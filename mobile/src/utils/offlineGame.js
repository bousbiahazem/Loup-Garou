import { OFFLINE_NIGHT_ORDER } from "../constants/offline";

export function createEmptyOfflineGame() {
  return {
    step: "players",
    players: [],
    roleCounts: { werewolf: 1, seer: 1 },
    revealIndex: 0,
    revealVisible: false,
    phase: "night",
    nightStepIndex: 0
  };
}

export function createLocalId() {
  return "local-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export function buildOfflineDeck(roleCounts, playerCount) {
  const deck = [];

  for (const [roleKey, rawCount] of Object.entries(roleCounts || {})) {
    const count = Number(rawCount || 0);

    for (let index = 0; index < count; index += 1) {
      deck.push(roleKey);
    }
  }

  while (deck.length < playerCount) {
    deck.push("villager");
  }

  return shuffleItems(deck).slice(0, playerCount);
}

export function shuffleItems(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function getOfflineNightOrder(players, roles) {
  const alivePlayers = players.filter((player) => player.isAlive);
  const roleKeys = new Set(alivePlayers.map((player) => player.roleKey));
  const order = [];

  if (alivePlayers.some((player) => isWolfRoleKey(player.roleKey, roles))) {
    order.push("wolves");
  }

  for (const roleKey of OFFLINE_NIGHT_ORDER) {
    if (roleKeys.has(roleKey) && !isWolfRoleKey(roleKey, roles)) {
      order.push(roleKey);
    }
  }

  return order;
}

export function isWolfRoleKey(roleKey, roles) {
  return roles.find((role) => role.key === roleKey)?.faction === "wolves";
}
