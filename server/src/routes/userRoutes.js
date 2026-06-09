import express from "express";
import { createUser, updateUser } from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const userRoutes = express.Router();

userRoutes.post("/", asyncHandler(createUser));
userRoutes.patch("/:userId", asyncHandler(updateUser));
