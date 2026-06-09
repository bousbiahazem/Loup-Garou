import { Room } from "../models/Room.js";
import { roomChannel } from "./roomBroadcaster.js";
import { sanitizeRoom } from "../utils/room.js";
import { normalizeRoomCode } from "../services/roomService.js";

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("room:watch", async ({ code, userId }) => {
      try {
        const room = await Room.findOne({ code: normalizeRoomCode(code) });

        if (!room) {
          socket.emit("room:error", { error: "ROOM_NOT_FOUND" });
          return;
        }

        socket.data.userId = userId;
        socket.data.roomCode = room.code;
        socket.join(roomChannel(room.code));
        socket.emit("room:update", sanitizeRoom(room, userId));
      } catch {
        socket.emit("room:error", { error: "ROOM_WATCH_FAILED" });
      }
    });
  });
}
