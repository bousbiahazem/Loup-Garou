import {
  advanceNight,
  castVote,
  kickPlayer,
  leaveRoom,
  openVote,
  restartGame,
  resolveVote,
  setLife,
  setNarrator,
  setPhase,
  startGame,
  updateRoleSetup
} from "../services/gameService.js";
import { createRoomForHost, joinRoomByCode, requireRoom } from "../services/roomService.js";
import { emitRoomUpdate } from "../realtime/roomBroadcaster.js";
import { sanitizeRoom } from "../utils/room.js";

export async function createRoom(request, response) {
  const room = await createRoomForHost(request.body.hostUserId);
  response.status(201).json({ room: sanitizeRoom(room, request.body.hostUserId) });
}

export async function getRoom(request, response) {
  const room = await requireRoom(request.params.code);
  response.json({ room: sanitizeRoom(room, request.query.userId) });
}

export async function joinRoom(request, response) {
  const room = await joinRoomByCode(request.params.code, request.body.userId);
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function leaveCurrentRoom(request, response) {
  const room = await requireRoom(request.params.code);
  leaveRoom(room, request.body.userId);

  if (room.players.length === 0) {
    await room.deleteOne();
    response.json({ room: null });
    return;
  }

  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function kickRoomPlayer(request, response) {
  const room = await requireRoom(request.params.code);
  kickPlayer(room, request.body.userId, request.params.playerId);

  if (room.players.length === 0) {
    await room.deleteOne();
    response.json({ room: null });
    return;
  }

  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function updateRoomRoles(request, response) {
  const room = await requireRoom(request.params.code);
  updateRoleSetup(room, request.body.userId, request.body.roleCounts);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function updateNarrator(request, response) {
  const room = await requireRoom(request.params.code);
  setNarrator(room, request.body.userId, request.body.playerId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function startRoomGame(request, response) {
  const room = await requireRoom(request.params.code);
  startGame(room, request.body.userId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function restartRoomGame(request, response) {
  const room = await requireRoom(request.params.code);
  restartGame(room, request.body.userId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function advanceRoomNight(request, response) {
  const room = await requireRoom(request.params.code);
  advanceNight(room, request.body.userId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function updateRoomPhase(request, response) {
  const room = await requireRoom(request.params.code);
  setPhase(room, request.body.userId, request.body.phase);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function updatePlayerLife(request, response) {
  const room = await requireRoom(request.params.code);
  setLife(room, request.body.userId, request.params.playerId, request.body.isAlive);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function openRoomVote(request, response) {
  const room = await requireRoom(request.params.code);
  openVote(room, request.body.userId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function castRoomVote(request, response) {
  const room = await requireRoom(request.params.code);
  castVote(room, request.body.userId, request.body.targetPlayerId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}

export async function resolveRoomVote(request, response) {
  const room = await requireRoom(request.params.code);
  resolveVote(room, request.body.userId);
  await room.save();
  await emitRoomUpdate(room);
  response.json({ room: sanitizeRoom(room, request.body.userId) });
}
