import mongoose from "mongoose";

export async function connectDatabase(mongodbUri) {
  console.log("Connecting to MongoDB...");

  try {
    await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 10000
    });
  } catch (error) {
    const hint = getMongoHint(error.message);
    console.error(`MongoDB connection failed: ${error.message}${hint ? ` ${hint}` : ""}`);
    throw error;
  }
}

function getMongoHint(message) {
  if (/bad auth|authentication failed/i.test(message)) {
    return "Check the Atlas database user's username/password, then update server/.env.";
  }

  if (/whitelist|ENOTFOUND|querySrv|server selection/i.test(message)) {
    return "Check Atlas Network Access IP whitelist or use local MongoDB.";
  }

  return "";
}
