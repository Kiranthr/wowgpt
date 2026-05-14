import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

threadId:{
type:String,
required:true
},

role:{
type:String,
required:true
},

message:{
type:String,
required:true
},

createdAt:{
type:Date,
default:Date.now
}

});

export default mongoose.model("Chat",chatSchema);