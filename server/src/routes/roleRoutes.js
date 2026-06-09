import express from "express";
import { listRoles } from "../controllers/roleController.js";

export const roleRoutes = express.Router();

roleRoutes.get("/", listRoles);
