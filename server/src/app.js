import cors from "cors";
import express from "express";
import { roleRoutes } from "./routes/roleRoutes.js";
import { roomRoutes } from "./routes/roomRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";

export function createApp({ clientOrigin }) {
  const app = express();

  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "loup-garou-server" });
  });

  app.use("/api/roles", roleRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/rooms", roomRoutes);

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(error.statusCode || 500).json({ error: error.publicCode || "SERVER_ERROR" });
  });

  return app;
}
