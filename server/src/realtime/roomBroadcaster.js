import { Room } from "../models/Room.js";
import { sanitizeRoom, toId } from "../utils/room.js";

let socketServer = null;

export function setRoomSocketServer(io) {
  socketServer = io;
}

export async function emitRoomUpdate(room) {
  if (!socketServer) {
    return;
  }

  const sockets = await socketServer.in(roomChannel(room.code)).fetchSockets();

  await Promise.all(
    sockets.map((socket) => socket.emit("room:update", sanitizeRoom(room, socket.data.userId)))
  );
}

export async function emitRoomUpdatesForUser(userId) {
  if (!socketServer) {
    return;
  }

  const rooms = await Room.find({ "players.userId": userId });

  await Promise.all(rooms.map((room) => emitRoomUpdate(room)));
}

export function roomChannel(code) {
  return `room:${code}`;
}

export function viewerIdFromSocket(socket) {
  return toId(socket.data.userId || socket.handshake.query.userId);
}
