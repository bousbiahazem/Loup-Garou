import { getRoleByKey } from "../data/roles.js";
export function toId(value) {
  if (!value) {
    return "";
  }

  return value.toString();
}

export function serializeRoleCounts(roleCounts) {
  if (!roleCounts) {
    return {};
  }

  if (roleCounts instanceof Map) {
    return Object.fromEntries(roleCounts.entries());
  }

  return { ...roleCounts };
}

export function serializeVotes(votes) {
  if (!votes) {
    return {};
  }

  const entries = votes instanceof Map ? votes.entries() : Object.entries(votes);
  return Object.fromEntries(entries);
}

export function getVoteCounts(votes) {
  const counts = {};

  for (const targetPlayerId of Object.values(serializeVotes(votes))) {
    counts[targetPlayerId] = (counts[targetPlayerId] || 0) + 1;
  }

  return counts;
}

export function isHost(room, userId) {
  return toId(room.hostUserId) === toId(userId);
}

export function isNarrator(room, userId) {
  return toId(room.narratorUserId) === toId(userId);
}

export function canControlGame(room, userId) {
  return isHost(room, userId) || isNarrator(room, userId);
}

export function sanitizeRoom(room, viewerUserId) {
  const viewerId = toId(viewerUserId);
  const narratorView = isNarrator(room, viewerId);
  const ended = room.status === "ended";
  const votes = serializeVotes(room.votes);
  const currentNightRoleKey = room.nightOrder?.[room.nightStepIndex] || null;
  const viewerPlayer = room.players.find((player) => toId(player.userId) === viewerId);
  const viewerIsWolf = isWolfRole(viewerPlayer?.roleKey);

  return {
    id: room._id.toString(),
    code: room.code,
    status: room.status,
    phase: room.phase,
    dayNumber: room.dayNumber,
    hostUserId: toId(room.hostUserId),
    narratorUserId: toId(room.narratorUserId),
    roleCounts: narratorView ? serializeRoleCounts(room.roleCounts) : {},
    voteOpen: room.voteOpen,
    voteCounts: getVoteCounts(room.votes),
    viewerVoteTargetId: votes[viewerId] || null,
    lastEliminated: room.lastEliminated?.playerId
      ? {
          playerId: room.lastEliminated.playerId,
          userId: toId(room.lastEliminated.userId),
          displayName: room.lastEliminated.displayName,
          roleKey: narratorView || toId(room.lastEliminated.userId) === viewerId ? room.lastEliminated.roleKey : null,
          reason: room.lastEliminated.reason,
          at: room.lastEliminated.at
        }
      : null,
    night: narratorView
      ? {
          order: room.nightOrder || [],
          stepIndex: room.nightStepIndex || 0,
          tapCount: room.nightStepTapCount || 0,
          currentRoleKey: currentNightRoleKey,
          isComplete: !currentNightRoleKey
        }
      : null,
    players: room.players.map((player) => {
      const ownRole = toId(player.userId) === viewerId;
      const wolfMate = viewerIsWolf && isWolfRole(player.roleKey);
      const canSeeRole = player.isNarrator || narratorView || ended || ownRole || wolfMate;

      return {
        id: player._id.toString(),
        userId: toId(player.userId),
        displayName: player.displayName,
        avatarColor: player.avatarColor,
        avatarKey: player.avatarKey,
        roleKey: canSeeRole ? player.roleKey : null,
        isAlive: player.isAlive,
        isNarrator: player.isNarrator,
        isRoleRevealed: player.isRoleRevealed,
        joinedAt: player.joinedAt
      };
    }),
    events: room.events.slice(-20).map((event) => ({
      type: event.type,
      message: event.message,
      createdBy: toId(event.createdBy),
      createdAt: event.createdAt
    })),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
}

export function addRoomEvent(room, type, message, createdBy) {
  room.events.push({ type, message, createdBy });

  if (room.events.length > 60) {
    room.events = room.events.slice(-60);
  }
}

function isWolfRole(roleKey) {
  return getRoleByKey(roleKey)?.faction === "wolves";
}
