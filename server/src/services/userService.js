import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { httpError } from "../utils/httpError.js";

export const AVATAR_COLORS = ["#c99455", "#8b704f", "#7c8456", "#8f4232", "#b58a5a", "#6f5b45"];
export const AVATAR_KEYS = ["moon", "crown", "leaf", "flame", "eye", "mask"];
export const LANGUAGES = ["en", "fr", "ar"];

export async function createUserProfile(payload) {
  const displayName = cleanName(payload.displayName);

  if (!displayName) {
    throw httpError(400, "DISPLAY_NAME_REQUIRED");
  }

  return User.create({
    displayName,
    language: normalizeLanguage(payload.language),
    avatarColor: normalizeAvatarColor(payload.avatarColor),
    avatarKey: normalizeAvatarKey(payload.avatarKey)
  });
}

export async function updateUserProfile(userId, payload) {
  const user = await requireUser(userId);
  const displayName = cleanName(payload.displayName);

  if (!displayName) {
    throw httpError(400, "DISPLAY_NAME_REQUIRED");
  }

  user.displayName = displayName;
  user.language = normalizeLanguage(payload.language);
  user.avatarColor = normalizeAvatarColor(payload.avatarColor);
  user.avatarKey = normalizeAvatarKey(payload.avatarKey);
  await user.save();

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

export function normalizeLanguage(language) {
  return LANGUAGES.includes(language) ? language : "en";
}

export function normalizeAvatarColor(color) {
  return AVATAR_COLORS.includes(color) ? color : AVATAR_COLORS[0];
}

export function normalizeAvatarKey(key) {
  return AVATAR_KEYS.includes(key) ? key : AVATAR_KEYS[0];
}
