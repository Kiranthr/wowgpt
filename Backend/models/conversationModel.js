import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
}, { timestamps: true }); // adds createdAt and updatedAt

// Index for efficient retrieval of user's conversations
conversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
