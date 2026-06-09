import express from "express";
import {
  advanceRoomNight,
  castRoomVote,
  createRoom,
  getRoom,
  joinRoom,
  kickRoomPlayer,
  leaveCurrentRoom,
  openRoomVote,
  restartRoomGame,
  resolveRoomVote,
  startRoomGame,
  updateNarrator,
  updatePlayerLife,
  updateRoomPhase,
  updateRoomRoles
} from "../controllers/roomController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const roomRoutes = express.Router();

roomRoutes.post("/", asyncHandler(createRoom));
roomRoutes.get("/:code", asyncHandler(getRoom));
roomRoutes.post("/:code/join", asyncHandler(joinRoom));
roomRoutes.post("/:code/leave", asyncHandler(leaveCurrentRoom));
roomRoutes.delete("/:code/players/:playerId", asyncHandler(kickRoomPlayer));
roomRoutes.patch("/:code/roles", asyncHandler(updateRoomRoles));
roomRoutes.patch("/:code/narrator", asyncHandler(updateNarrator));
roomRoutes.post("/:code/start", asyncHandler(startRoomGame));
roomRoutes.post("/:code/restart", asyncHandler(restartRoomGame));
roomRoutes.post("/:code/night/advance", asyncHandler(advanceRoomNight));
roomRoutes.patch("/:code/phase", asyncHandler(updateRoomPhase));
roomRoutes.patch("/:code/players/:playerId/life", asyncHandler(updatePlayerLife));
roomRoutes.post("/:code/vote/open", asyncHandler(openRoomVote));
roomRoutes.post("/:code/vote", asyncHandler(castRoomVote));
roomRoutes.post("/:code/vote/resolve", asyncHandler(resolveRoomVote));
