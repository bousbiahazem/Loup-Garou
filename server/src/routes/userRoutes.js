import express from "express";
import { createUser, getUser, loginUser, updateUser } from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const userRoutes = express.Router();

userRoutes.post("/", asyncHandler(createUser));
userRoutes.post("/login", asyncHandler(loginUser));
userRoutes.get("/:userId", asyncHandler(getUser));
userRoutes.patch("/:userId", asyncHandler(updateUser));
