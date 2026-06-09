import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { setRoomSocketServer } from "./realtime/roomBroadcaster.js";
import { registerSocketHandlers } from "./realtime/socketHandlers.js";

const PORT = Number.parseInt(process.env.PORT || "4000", 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/loup_garou";

const app = createApp({ clientOrigin: CLIENT_ORIGIN });
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PATCH"]
  }
});

setRoomSocketServer(io);
registerSocketHandlers(io);

connectDatabase(MONGODB_URI)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Loup Garou server listening on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });
