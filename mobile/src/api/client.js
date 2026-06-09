import { io } from "socket.io-client";

export const DEFAULT_API_URL = "https://loup-garou-te90.onrender.com/api";
export function createApi(apiBaseUrl) {
  const baseUrl = normalizeApiUrl(apiBaseUrl);

  return {
    baseUrl,
    createUser: (payload) => request(baseUrl, "/users", { method: "POST", body: payload }),
    getUser: (userId) => request(baseUrl, `/users/${encodeURIComponent(userId)}`),
    updateUser: (userId, payload) => request(baseUrl, `/users/${encodeURIComponent(userId)}`, { method: "PATCH", body: payload }),
    getRoles: (language) => request(baseUrl, `/roles?lang=${encodeURIComponent(language)}`),
    createRoom: (hostUserId) => request(baseUrl, "/rooms", { method: "POST", body: { hostUserId } }),
    getRoom: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}?userId=${encodeURIComponent(userId)}`),
    joinRoom: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/join`, { method: "POST", body: { userId } }),
    leaveRoom: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/leave`, { method: "POST", body: { userId } }),
    kickPlayer: (code, userId, playerId) => request(baseUrl, `/rooms/${cleanCode(code)}/players/${playerId}`, { method: "DELETE", body: { userId } }),
    updateRoles: (code, userId, roleCounts) => request(baseUrl, `/rooms/${cleanCode(code)}/roles`, { method: "PATCH", body: { userId, roleCounts } }),
    setNarrator: (code, userId, playerId) => request(baseUrl, `/rooms/${cleanCode(code)}/narrator`, { method: "PATCH", body: { userId, playerId } }),
    startGame: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/start`, { method: "POST", body: { userId } }),
    restartGame: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/restart`, { method: "POST", body: { userId } }),
    advanceNight: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/night/advance`, { method: "POST", body: { userId } }),
    setPhase: (code, userId, phase) => request(baseUrl, `/rooms/${cleanCode(code)}/phase`, { method: "PATCH", body: { userId, phase } }),
    setLife: (code, userId, playerId, isAlive) => request(baseUrl, `/rooms/${cleanCode(code)}/players/${playerId}/life`, { method: "PATCH", body: { userId, isAlive } }),
    openVote: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/vote/open`, { method: "POST", body: { userId } }),
    castVote: (code, userId, targetPlayerId) => request(baseUrl, `/rooms/${cleanCode(code)}/vote`, { method: "POST", body: { userId, targetPlayerId } }),
    resolveVote: (code, userId) => request(baseUrl, `/rooms/${cleanCode(code)}/vote/resolve`, { method: "POST", body: { userId } })
  };
}

export function createRoomSocket(apiBaseUrl, code, userId) {
  const socketUrl = normalizeApiUrl(apiBaseUrl).replace(/\/api\/?$/, "");
  const socket = io(socketUrl, {
    transports: ["websocket"],
    query: { userId }
  });

  socket.on("connect", () => {
    socket.emit("room:watch", { code: cleanCode(code), userId });
  });

  return socket;
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "REQUEST_FAILED");
  }

  return data;
}

function normalizeApiUrl(value) {
  return String(value || DEFAULT_API_URL).trim().replace(/\/+$/, "");
}

function cleanCode(value) {
  return String(value || "").trim().toUpperCase();
}
