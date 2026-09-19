import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

import chatRoute from "./routes/chat.js";
import testRoute from "./routes/test.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from Frontend directory
app.use(express.static(path.join(process.cwd(), "../Frontend")));

app.use("/api/auth",authRoutes);

// MongoDB connection - prioritize local for development
const mongoUri = "mongodb://127.0.0.1:27017/wowgpt";
mongoose.connect(mongoUri)
.then(()=>console.log("MongoDB Connected (Local)"))
.catch(err=>console.log("MongoDB Connection Error:", err));

app.use("/api/chat", chatRoute);
app.use("/api/test", testRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
});