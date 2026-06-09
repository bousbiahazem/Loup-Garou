import crypto from "node:crypto";
import { Room } from "../models/Room.js";
import { defaultRoleCounts } from "../utils/roles.js";
import { httpError } from "../utils/httpError.js";
import { requireUser } from "./userService.js";

export async function createRoomForHost(hostUserId) {
  const user = await requireUser(hostUserId);

  return Room.create({
    code: await generateRoomCode(),
    hostUserId: user._id,
    roleCounts: defaultRoleCounts(),
    players: [
      {
        userId: user._id,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        avatarKey: user.avatarKey
      }
    ],
    events: [
      {
        type: "room.created",
        message: `${user.displayName} created the room.`,
        createdBy: user._id
      }
    ]
  });
}

export async function joinRoomByCode(code, userId) {
  const room = await requireRoom(code);
  const user = await requireUser(userId);
  const existingPlayer = room.players.find((player) => player.userId.toString() === user._id.toString());

  if (room.status !== "lobby" && !existingPlayer) {
    throw httpError(409, "ROOM_ALREADY_STARTED");
  }

  if (!existingPlayer) {
    room.players.push({
      userId: user._id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      avatarKey: user.avatarKey
    });
    room.events.push({
      type: "player.joined",
      message: `${user.displayName} joined the room.`,
      createdBy: user._id
    });
    await room.save();
  }

  return room;
}

export async function requireRoom(code) {
  const room = await Room.findOne({ code: normalizeRoomCode(code) });

  if (!room) {
    throw httpError(404, "ROOM_NOT_FOUND");
  }

  return room;
}

export function normalizeRoomCode(code) {
  return String(code || "").trim().toUpperCase();
}

async function generateRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    const exists = await Room.exists({ code });

    if (!exists) {
      return code;
    }
  }

  return crypto.randomUUID().slice(0, 6).toUpperCase();
}
