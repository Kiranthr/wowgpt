import express from "express";
import { askGroq } from "../utils/groq.js";
import Chat from "../models/chatModel.js";
import auth from "../middleware/authen.js";
import mongoose from "mongoose";

const router = express.Router();
router.get("/threads", auth, async(req,res)=>{

const threads = await Chat.aggregate([
{ $match:{ userId:req.userId } },
{ $group:{ _id:"$threadId" } }
]);

res.json(threads);

});

/* =====================================
   SEND MESSAGE (Protected Route)
===================================== */

router.post("/", auth, async (req, res) => {

try{

const { message, threadId } = req.body;
const userId = req.userId; // extracted from JWT middleware

if(!message){
return res.status(400).json({
error:"Message is required"
});
}

/* Save USER message */

await Chat.create({
userId,
threadId,
role:"user",
message
});


/* Ask AI */

const reply = await askGroq(message);


/* Save AI reply */

await Chat.create({
userId,
threadId,
role:"bot",
message:reply
});


/* Send reply back */

res.json({
reply
});

}catch(error){

console.error("CHAT ERROR:", error);

res.status(500).json({
error:"AI error"
});

}

});


/* =====================================
   LOAD THREAD MESSAGES
===================================== */



router.get("/threads", auth, async(req,res)=>{

try{

const threads = await Chat.aggregate([
{
$match:{
userId:req.userId
}
},
{
$group:{
_id:"$threadId",
lastMessage:{ $last:"$message" }
}
},
{
$sort:{ _id:-1 }
}
]);

res.json(threads);

}catch(err){

console.log("THREAD ERROR:",err);

res.status(500).json({error:"Thread load failed"});

}

});

export default router;