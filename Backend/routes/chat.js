import express from "express";
import { askGroq } from "../utils/groq.js";
import Chat from "../models/chatModel.js";
import Conversation from "../models/conversationModel.js";
import auth from "../middleware/authen.js";
import mongoose from "mongoose";

const router = express.Router();

// GET list of conversations (threads) for authenticated user
router.get("/threads", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select("_id threadId title updatedAt createdAt");
    // Return in format expected by frontend (array of objects)
    res.json(conversations);
  } catch (err) {
    console.error("THREAD LIST ERROR:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// GET messages for a specific thread
router.get("/:threadId/messages", auth, async (req, res) => {
  const { threadId } = req.params;
  try {
    // First check if the conversation exists and belongs to the user
    const conversation = await Conversation.findOne({ _id: threadId, userId: req.userId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const messages = await Chat.find({ userId: req.userId, threadId })
      .sort({ createdAt: 1 })
      .select("role message createdAt");
    res.json(messages);
  } catch (err) {
    console.error("MESSAGE LOAD ERROR:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST a new message (user + AI reply)
router.post("/", auth, async (req, res) => {
  const { message, threadId } = req.body;
  const userId = req.userId;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    let conversation;
    // If threadId provided, try to find existing conversation
    if (threadId) {
      conversation = await Conversation.findOne({ _id: threadId, userId });
    }
    // If not found, create a new conversation
    if (!conversation) {
      const title = message.substring(0, 30);
      conversation = new Conversation({ userId, title });
      await conversation.save();
    }

    const currentThreadId = conversation._id.toString();

    // Get conversation history for context (before saving new message)
    const previousMessages = await Chat.find({ userId, threadId: currentThreadId })
      .sort({ createdAt: 1 })
      .select("role message");
    
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.message
    }));

    // Save user message
    await Chat.create({ userId, threadId: currentThreadId, role: "user", message });

    // Ask AI with conversation history
    const reply = await askGroq(message, conversationHistory);

    // Save AI reply
    await Chat.create({ userId, threadId: currentThreadId, role: "bot", message: reply });

    // Update conversation's updatedAt timestamp by saving (no changes needed other than timestamps)
    await conversation.save();

    res.json({ reply, threadId: currentThreadId, title: conversation.title });
  } catch (err) {
    console.error("CHAT POST ERROR:", err);
    res.status(500).json({ error: "AI error" });
  }
});

// PATCH rename conversation
router.patch("/:threadId", auth, async (req, res) => {
  const { threadId } = req.params;
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  try {
    const conversation = await Conversation.findOne({ _id: threadId, userId: req.userId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    conversation.title = title.trim();
    await conversation.save();
    res.json({ message: "Conversation renamed", conversation });
  } catch (err) {
    console.error("CONVERSATION RENAME ERROR:", err);
    res.status(500).json({ error: "Failed to rename conversation" });
  }
});

// DELETE conversation and its messages
router.delete("/:threadId", auth, async (req, res) => {
  const { threadId } = req.params;
  try {
    const conversation = await Conversation.findOne({ _id: threadId, userId: req.userId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    // Delete all messages belonging to this thread
    await Chat.deleteMany({ userId: req.userId, threadId });
    // Delete the conversation itself
    await conversation.deleteOne();
    res.json({ message: "Conversation deleted" });
  } catch (err) {
    console.error("CONVERSATION DELETE ERROR:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;