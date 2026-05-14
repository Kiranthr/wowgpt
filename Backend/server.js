import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import chatRoute from "./routes/chat.js";
import testRoute from "./routes/test.js";
import authRoutes from "./routes/authRoutes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth",authRoutes);

// mongoose.connect("mongodb://127.0.0.1:27017/sigmagpt")
// .then(()=>console.log("MongoDB Connected"));
 mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Atlas Connected"))
.catch(err=>console.log(err));

app.use("/api/chat", chatRoute);
app.use("/api/test", testRoute);

app.listen(process.env.PORT, ()=>{
    console.log("Server running on port 5000");
});