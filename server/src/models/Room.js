import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    avatarColor: {
      type: String,
      default: "#c99455"
    },
    avatarKey: {
      type: String,
      default: "moon"
    },
    roleKey: {
      type: String,
      default: null
    },
    isAlive: {
      type: Boolean,
      default: true
    },
    isNarrator: {
      type: Boolean,
      default: false
    },
    isRoleRevealed: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const eliminatedSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    displayName: {
      type: String,
      default: ""
    },
    roleKey: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      enum: ["vote", "manual", "none"],
      default: "none"
    },
    at: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      index: true,
      required: true
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    narratorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    status: {
      type: String,
      enum: ["lobby", "running", "ended"],
      default: "lobby"
    },
    phase: {
      type: String,
      enum: ["setup", "night", "day"],
      default: "setup"
    },
    dayNumber: {
      type: Number,
      default: 0
    },
    nightOrder: {
      type: [String],
      default: []
    },
    nightStepIndex: {
      type: Number,
      default: 0
    },
    nightStepTapCount: {
      type: Number,
      default: 0
    },
    voteOpen: {
      type: Boolean,
      default: false
    },
    votes: {
      type: Map,
      of: String,
      default: {}
    },
    lastEliminated: {
      type: eliminatedSchema,
      default: () => ({})
    },
    roleCounts: {
      type: Map,
      of: Number,
      default: {}
    },
    players: {
      type: [playerSchema],
      default: []
    },
    events: {
      type: [eventSchema],
      default: []
    }
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
