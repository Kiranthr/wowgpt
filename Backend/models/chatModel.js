import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "bot"]
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient retrieval of a user's messages in a thread, sorted by creation time
chatSchema.index({ userId: 1, threadId: 1, createdAt: 1 });

export default mongoose.model("Chat", chatSchema);