import mongoose from "mongoose";
import dotenv from "dotenv";
import Chat from "./models/chatModel.js";
import Conversation from "./models/conversationModel.js";

dotenv.config();

const mongoUri = "mongodb://127.0.0.1:27017/wowgpt";

async function migrate() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if there are existing Chat documents
    const existingChats = await Chat.find({});
    console.log(`Found ${existingChats.length} existing chat messages`);

    if (existingChats.length > 0) {
      console.log("Processing existing chats to create conversations...");
      
      // Group chats by threadId
      const threadGroups = {};
      existingChats.forEach(chat => {
        const threadIdStr = chat.threadId.toString();
        if (!threadGroups[threadIdStr]) {
          threadGroups[threadIdStr] = [];
        }
        threadGroups[threadIdStr].push(chat);
      });

      // Create conversations for each thread
      for (const [threadIdStr, chats] of Object.entries(threadGroups)) {
        let existingConversation;
        
        // Try to find conversation by ObjectId or string
        try {
          existingConversation = await Conversation.findById(threadIdStr);
        } catch (e) {
          // If invalid ObjectId, try to find by string
          existingConversation = await Conversation.findOne({ _id: threadIdStr });
        }
        
        if (!existingConversation) {
          // Find the first user message to generate title
          const firstUserMessage = chats.find(c => c.role === "user");
          const title = firstUserMessage 
            ? firstUserMessage.message.substring(0, 30) 
            : "Imported Chat";
          
          const conversation = new Conversation({
            userId: chats[0].userId,
            title: title
          });
          
          await conversation.save();
          
          // Update all chats with the new conversation ID
          const newThreadId = conversation._id.toString();
          await Chat.updateMany(
            { threadId: threadIdStr },
            { threadId: conversation._id }
          );
          
          console.log(`Created conversation ${newThreadId} for thread ${threadIdStr}`);
        } else {
          console.log(`Conversation already exists for thread ${threadIdStr}`);
        }
      }
    } else {
      console.log("No existing chats found. Migration complete.");
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();