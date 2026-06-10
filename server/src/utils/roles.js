import { DEFAULT_ROLE_COUNTS, ROLE_CATALOG, ROLE_KEYS } from "../data/roles.js";

export const NIGHT_ROLE_ORDER = [
  "werewolf",
  "blue_wolf",
  "red_wolf",
  "fog_wolf",
  "talkative_wolf",
  "white_wolf",
  "big_bad_wolf",
  "infected_wolf",
  "thief",
  "cupid",
  "wild_child",
  "wolf_dog",
  "seer",
  "fox",
  "bear_tamer",
  "healer",
  "witch",
  "piper",
  "raven",
  "actor",
  "alien"
];

export function normalizeRoleCounts(rawCounts = {}) {
  const normalized = {};

  for (const role of ROLE_CATALOG) {
    const rawValue = rawCounts[role.key];
    const numericValue = Number.parseInt(rawValue, 10);

    if (Number.isFinite(numericValue) && numericValue > 0) {
      normalized[role.key] = Math.min(numericValue, role.max);
    }
  }

  return normalized;
}

export function defaultRoleCounts() {
  return normalizeRoleCounts(DEFAULT_ROLE_COUNTS);
}

export function buildRoleDeck(roleCounts, playerCount) {
  const normalized = normalizeRoleCounts(roleCounts);
  const deck = [];

  for (const [roleKey, count] of Object.entries(normalized)) {
    if (!ROLE_KEYS.has(roleKey)) {
      continue;
    }

    for (let index = 0; index < count; index += 1) {
      deck.push(roleKey);
    }
  }

  if (deck.length > playerCount) {
    throw new Error("ROLE_COUNT_EXCEEDS_PLAYERS");
  }

  while (deck.length < playerCount) {
    deck.push("villager");
  }

  return shuffle(deck);
}

export function buildNightOrder(players) {
  const aliveRoleKeys = new Set(
    players
      .filter((player) => !player.isNarrator && player.isAlive && player.roleKey)
      .map((player) => player.roleKey)
  );

  return NIGHT_ROLE_ORDER.filter((roleKey) => aliveRoleKeys.has(roleKey));
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
