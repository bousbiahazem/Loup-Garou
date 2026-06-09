import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 32
    },
    language: {
      type: String,
      enum: ["en", "fr", "ar"],
      default: "en"
    },
    avatarColor: {
      type: String,
      default: "#d9a441",
      match: /^#[0-9a-fA-F]{6}$/
    },
    avatarKey: {
      type: String,
      default: "moon",
      enum: ["moon", "crown", "leaf", "flame", "eye", "mask"]
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
