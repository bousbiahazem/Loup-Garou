import { getRoleByKey } from "../data/roles.js";
import { addRoomEvent, canControlGame, isHost, isNarrator, serializeRoleCounts, toId } from "../utils/room.js";
import { buildRoleDeck, buildNightOrder, normalizeRoleCounts } from "../utils/roles.js";
import { httpError } from "../utils/httpError.js";

export function updateRoleSetup(room, userId, roleCounts) {
  assertNarrator(room, userId, "ONLY_NARRATOR_CAN_EDIT_ROLES");
  assertLobby(room);

  room.roleCounts = normalizeRoleCounts(roleCounts || {});
  addRoomEvent(room, "roles.updated", "Role setup was updated.", userId);
}

export function setNarrator(room, userId, playerId) {
  assertRoomOwnerOrNarrator(room, userId, "ONLY_NARRATOR_CAN_SET_NARRATOR");
  assertLobby(room);

  const narrator = room.players.id(playerId);

  if (!narrator) {
    throw httpError(404, "PLAYER_NOT_FOUND");
  }

  room.narratorUserId = narrator.userId;
  room.hostUserId = narrator.userId;
  room.players.forEach((player) => {
    player.isNarrator = player._id.equals(narrator._id);
    player.roleKey = null;
    player.isAlive = true;
    player.isRoleRevealed = false;
  });

  addRoomEvent(room, "narrator.updated", `${narrator.displayName} is the narrator.`, userId);
}

export function kickPlayer(room, userId, playerId) {
  assertRoomOwnerOrNarrator(room, userId, "ONLY_NARRATOR_CAN_KICK_PLAYER");

  const player = room.players.id(playerId);

  if (!player) {
    throw httpError(404, "PLAYER_NOT_FOUND");
  }

  if (toId(player.userId) === toId(userId)) {
    throw httpError(400, "CANNOT_KICK_SELF");
  }

  const kickedName = player.displayName;
  player.deleteOne();
  transferOwnerIfNeeded(room);
  addRoomEvent(room, "player.kicked", `${kickedName} left the room.`, userId);
}

export function leaveRoom(room, userId) {
  const player = room.players.find((candidate) => toId(candidate.userId) === toId(userId));

  if (!player) {
    throw httpError(404, "PLAYER_NOT_FOUND");
  }

  const playerName = player.displayName;
  player.deleteOne();
  transferOwnerIfNeeded(room);
  addRoomEvent(room, "player.left", `${playerName} left the room.`, userId);
}

export function startGame(room, userId) {
  if (!canControlGame(room, userId)) {
    throw httpError(403, "ONLY_HOST_OR_NARRATOR_CAN_START");
  }

  assertLobby(room);

  if (!room.narratorUserId) {
    throw httpError(400, "NARRATOR_REQUIRED");
  }

  const activePlayers = room.players.filter((player) => !player.isNarrator);

  if (activePlayers.length < 3) {
    throw httpError(400, "NOT_ENOUGH_PLAYERS");
  }

  let deck;

  try {
    deck = buildRoleDeck(serializeRoleCounts(room.roleCounts), activePlayers.length);
  } catch (error) {
    if (error.message === "ROLE_COUNT_EXCEEDS_PLAYERS") {
      throw httpError(400, "ROLE_COUNT_EXCEEDS_PLAYERS");
    }

    throw error;
  }

  activePlayers.forEach((player, index) => {
    player.roleKey = deck[index];
    player.isAlive = true;
    player.isRoleRevealed = false;
  });

  room.players.forEach((player) => {
    if (player.isNarrator) {
      player.roleKey = null;
      player.isAlive = true;
      player.isRoleRevealed = false;
    }
  });

  room.status = "running";
  room.dayNumber = 0;
  room.lastEliminated = {};
  startNight(room);
  addRoomEvent(room, "game.started", "The game started. Night falls.", userId);
}

export function restartGame(room, userId) {
  assertNarrator(room, userId, "ONLY_NARRATOR_CAN_RESTART_GAME");

  room.status = "lobby";
  room.phase = "setup";
  room.dayNumber = 0;
  room.nightOrder = [];
  room.nightStepIndex = 0;
  room.nightStepTapCount = 0;
  room.voteOpen = false;
  room.votes = new Map();
  room.lastEliminated = {};

  room.players.forEach((player) => {
    player.roleKey = null;
    player.isAlive = true;
    player.isRoleRevealed = false;
  });

  addRoomEvent(room, "game.restarted", "The narrator started a new round.", userId);
}

export function advanceNight(room, userId) {
  assertNarrator(room, userId, "ONLY_NARRATOR_CAN_ADVANCE_NIGHT");
  assertRunning(room);

  if (room.phase !== "night") {
    throw httpError(409, "NOT_NIGHT_PHASE");
  }

  const currentRoleKey = room.nightOrder[room.nightStepIndex];

  if (!currentRoleKey) {
    startDay(room, userId);
    return;
  }

  const role = getRoleByKey(currentRoleKey);

  if (room.nightStepTapCount === 0) {
    room.nightStepTapCount = 1;
    addRoomEvent(room, "night.role.wake", `${role?.names.en || currentRoleKey} wakes up.`, userId);
    return;
  }

  room.nightStepIndex += 1;
  room.nightStepTapCount = 0;

  if (!room.nightOrder[room.nightStepIndex]) {
    startDay(room, userId);
  }
}

export function openVote(room, userId) {
  assertNarrator(room, userId, "ONLY_NARRATOR_CAN_OPEN_VOTE");
  assertRunning(room);

  if (room.phase !== "day") {
    throw httpError(409, "NOT_DAY_PHASE");
  }

  room.voteOpen = true;
  room.votes = new Map();
  addRoomEvent(room, "vote.opened", "The village vote is open.", userId);
}

export function castVote(room, userId, targetPlayerId) {
  assertRunning(room);

  if (room.phase !== "day" || !room.voteOpen) {
    throw httpError(409, "VOTE_NOT_OPEN");
  }

  const voter = room.players.find((player) => toId(player.userId) === toId(userId));
  const target = room.players.id(targetPlayerId);

  if (!voter || voter.isNarrator || !voter.isAlive) {
    throw httpError(403, "ONLY_ALIVE_PLAYERS_CAN_VOTE");
  }

  if (!target || target.isNarrator || !target.isAlive) {
    throw httpError(400, "INVALID_VOTE_TARGET");
  }

  room.votes.set(toId(userId), target._id.toString());
  addRoomEvent(room, "vote.cast", `${voter.displayName} voted.`, userId);

  if (allAlivePlayersVoted(room)) {
    resolveVote(room, room.narratorUserId, true);
  }
}

export function resolveVote(room, userId, automatic = false) {
  if (!automatic) {
    assertNarrator(room, userId, "ONLY_NARRATOR_CAN_RESOLVE_VOTE");
  }

  assertRunning(room);

  if (room.phase !== "day" || !room.voteOpen) {
    throw httpError(409, "VOTE_NOT_OPEN");
  }

  const result = getVoteResult(room);
  room.voteOpen = false;
  room.votes = new Map();

  if (!result.playerId || result.tied) {
    room.lastEliminated = {};
    addRoomEvent(room, "vote.tied", "The vote tied. Nobody died.", userId);
    startNight(room);
    return;
  }

  const eliminated = room.players.id(result.playerId);

  if (!eliminated) {
    throw httpError(404, "PLAYER_NOT_FOUND");
  }

  eliminated.isAlive = false;
  eliminated.isRoleRevealed = true;
  room.lastEliminated = {
    playerId: eliminated._id.toString(),
    userId: eliminated.userId,
    displayName: eliminated.displayName,
    roleKey: eliminated.roleKey,
    reason: "vote",
    at: new Date()
  };

  addRoomEvent(room, "vote.resolved", `${eliminated.displayName} died by vote.`, userId);
  startNight(room);
}

export function setLife(room, userId, playerId, isAlive) {
  assertNarrator(room, userId, "ONLY_NARRATOR_CAN_UPDATE_LIFE");
  assertRunning(room);

  const player = room.players.id(playerId);

  if (!player || player.isNarrator) {
    throw httpError(404, "PLAYER_NOT_FOUND");
  }

  player.isAlive = Boolean(isAlive);

  if (!player.isAlive) {
    player.isRoleRevealed = true;
    room.lastEliminated = {
      playerId: player._id.toString(),
      userId: player.userId,
      displayName: player.displayName,
      roleKey: player.roleKey,
      reason: "manual",
      at: new Date()
    };
  }

  addRoomEvent(room, player.isAlive ? "player.revived" : "player.dead", `${player.displayName} is now ${player.isAlive ? "alive" : "dead"}.`, userId);
}

export function setPhase(room, userId, nextPhase) {
  assertNarrator(room, userId, "ONLY_NARRATOR_CAN_SET_PHASE");
  assertRunning(room);

  if (nextPhase === "night") {
    startNight(room);
    addRoomEvent(room, "phase.changed", "Night falls.", userId);
    return;
  }

  if (nextPhase === "day") {
    startDay(room, userId);
    return;
  }

  throw httpError(400, "INVALID_PHASE");
}

function startNight(room) {
  room.phase = "night";
  room.voteOpen = false;
  room.votes = new Map();
  room.nightOrder = buildNightOrder(room.players);
  room.nightStepIndex = 0;
  room.nightStepTapCount = 0;
}

function startDay(room, userId) {
  room.phase = "day";
  room.dayNumber += 1;
  room.voteOpen = false;
  room.votes = new Map();
  room.nightStepIndex = 0;
  room.nightStepTapCount = 0;
  addRoomEvent(room, "phase.changed", "Morning arrives.", userId);
}

function getVoteResult(room) {
  const counts = {};

  for (const targetPlayerId of room.votes.values()) {
    counts[targetPlayerId] = (counts[targetPlayerId] || 0) + 1;
  }

  let topPlayerId = null;
  let topCount = 0;
  let tied = false;

  for (const [playerId, count] of Object.entries(counts)) {
    if (count > topCount) {
      topPlayerId = playerId;
      topCount = count;
      tied = false;
    } else if (count === topCount) {
      tied = true;
    }
  }

  return { playerId: topPlayerId, count: topCount, tied };
}

function allAlivePlayersVoted(room) {
  const voters = room.players.filter((player) => !player.isNarrator && player.isAlive);
  return voters.length > 0 && voters.every((player) => room.votes.has(toId(player.userId)));
}

function assertHost(room, userId, code) {
  if (!isHost(room, userId)) {
    throw httpError(403, code);
  }
}

function assertRoomOwnerOrNarrator(room, userId, code) {
  if (!canControlGame(room, userId)) {
    throw httpError(403, code);
  }
}

function assertNarrator(room, userId, code) {
  if (!isNarrator(room, userId)) {
    throw httpError(403, code);
  }
}

function assertLobby(room) {
  if (room.status !== "lobby") {
    throw httpError(409, "ROOM_ALREADY_STARTED");
  }
}

function assertRunning(room) {
  if (room.status !== "running") {
    throw httpError(409, "GAME_NOT_RUNNING");
  }
}

function transferOwnerIfNeeded(room) {
  if (room.players.length === 0) {
    return;
  }

  const hasHost = room.players.some((player) => toId(player.userId) === toId(room.hostUserId));
  const hasNarrator = room.players.some((player) => toId(player.userId) === toId(room.narratorUserId));

  if (hasHost && hasNarrator) {
    return;
  }

  const oldestPlayer = [...room.players].sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt))[0];
  room.hostUserId = oldestPlayer.userId;
  room.narratorUserId = oldestPlayer.userId;
  room.players.forEach((player) => {
    player.isNarrator = player._id.equals(oldestPlayer._id);
  });
}
