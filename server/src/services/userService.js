import crypto from "node:crypto";
import { promisify } from "node:util";
import mongoose from "mongoose";
import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { httpError } from "../utils/httpError.js";

const scrypt = promisify(crypto.scrypt);
const PASSWORD_KEY_LENGTH = 64;

export const AVATAR_COLORS = ["#c99455", "#8b704f", "#7c8456", "#8f4232", "#b58a5a", "#6f5b45"];
export const AVATAR_KEYS = ["moon", "crown", "leaf", "flame", "eye", "mask"];
export const LANGUAGES = ["en", "fr", "ar"];

export async function createUserProfile(payload) {
  const displayName = cleanName(payload.displayName);
  const accountName = normalizeAccountName(displayName);
  const password = cleanPassword(payload.password);

  if (!displayName || !accountName) {
    throw httpError(400, "DISPLAY_NAME_REQUIRED");
  }

  if (!password) {
    throw httpError(400, "PASSWORD_REQUIRED");
  }

  if (await User.exists({ accountName })) {
    throw httpError(409, "ACCOUNT_EXISTS");
  }

  try {
    return await User.create({
      displayName,
      accountName,
      passwordHash: await hashPassword(password),
      language: normalizeLanguage(payload.language),
      avatarColor: normalizeAvatarColor(payload.avatarColor),
      avatarKey: normalizeAvatarKey(payload.avatarKey)
    });
  } catch (error) {
    throw normalizeUserWriteError(error);
  }
}

export async function loginUserProfile(payload) {
  const accountName = normalizeAccountName(payload.displayName || payload.accountName);
  const password = String(payload.password || "");

  if (!accountName || !password) {
    throw httpError(401, "INVALID_LOGIN");
  }

  const user = await User.findOne({ accountName }).select("+passwordHash");

  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw httpError(401, "INVALID_LOGIN");
  }

  return user;
}

export async function updateUserProfile(userId, payload) {
  const user = await requireUser(userId);
  const displayName = cleanName(payload.displayName);
  const accountName = normalizeAccountName(displayName);

  if (!displayName || !accountName) {
    throw httpError(400, "DISPLAY_NAME_REQUIRED");
  }

  const existingAccount = await User.exists({ accountName, _id: { $ne: user._id } });

  if (existingAccount) {
    throw httpError(409, "ACCOUNT_EXISTS");
  }

  user.displayName = displayName;
  user.accountName = accountName;
  user.language = normalizeLanguage(payload.language);
  user.avatarColor = normalizeAvatarColor(payload.avatarColor);
  user.avatarKey = normalizeAvatarKey(payload.avatarKey);

  if (payload.password !== undefined && String(payload.password || "").length > 0) {
    const password = cleanPassword(payload.password);

    if (!password) {
      throw httpError(400, "PASSWORD_TOO_SHORT");
    }

    user.passwordHash = await hashPassword(password);
  }

  try {
    await user.save();
  } catch (error) {
    throw normalizeUserWriteError(error);
  }

  await Room.updateMany(
    { "players.userId": user._id },
    {
      $set: {
        "players.$[player].displayName": user.displayName,
        "players.$[player].avatarColor": user.avatarColor,
        "players.$[player].avatarKey": user.avatarKey
      }
    },
    {
      arrayFilters: [{ "player.userId": user._id }]
    }
  );

  return user;
}

export async function requireUser(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    throw httpError(404, "USER_NOT_FOUND");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw httpError(404, "USER_NOT_FOUND");
  }

  return user;
}

export function cleanName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 32 ? name : "";
}

export function normalizeAccountName(value) {
  return cleanName(value).toLowerCase();
}

export function cleanPassword(value) {
  const password = String(value || "");
  return password.length >= 4 && password.length <= 72 ? password : "";
}

export function normalizeLanguage(language) {
  return LANGUAGES.includes(language) ? language : "en";
}

export function normalizeAvatarColor(color) {
  return AVATAR_COLORS.includes(color) ? color : AVATAR_COLORS[0];
}

export function normalizeAvatarKey(key) {
  return AVATAR_KEYS.includes(key) ? key : AVATAR_KEYS[0];
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  return "scrypt:" + salt + ":" + derivedKey.toString("hex");
}

async function verifyPassword(password, storedHash) {
  const [scheme, salt, hash] = String(storedHash || "").split(":");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  const storedBuffer = Buffer.from(hash, "hex");

  return storedBuffer.length === derivedKey.length && crypto.timingSafeEqual(storedBuffer, derivedKey);
}

function normalizeUserWriteError(error) {
  if (error?.code === 11000) {
    return httpError(409, "ACCOUNT_EXISTS");
  }

  if (error?.name === "ValidationError") {
    return httpError(400, "INVALID_PROFILE");
  }

  return error;
}
