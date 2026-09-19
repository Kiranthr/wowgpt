import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

/* =============================
   SIGNUP
============================= */

router.post("/signup", async (req,res)=>{

try{

const {name,email,password} = req.body;

if(!name || !email || !password){
return res.status(400).json({
message:"All fields are required"
});
}

/* check if email already exists */

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({
message:"Email already registered"
});
}

/* hash password */

const hashedPassword = await bcrypt.hash(password,10);

/* create user */

const user = new User({
name,
email,
password:hashedPassword
});

await user.save();

res.json({
message:"User created successfully"
});

}catch(error){

console.log("SIGNUP ERROR:",error);

res.status(500).json({
message:"Signup failed"
});

}

});


/* =============================
   LOGIN
============================= */

router.post("/login", async (req,res)=>{

try{

const {email,password} = req.body;

/* find user */

const user = await User.findOne({email});

if(!user){
return res.status(400).json({
message:"User not found"
});
}

/* compare password */

const validPassword = await bcrypt.compare(password,user.password);

if(!validPassword){
return res.status(400).json({
message:"Invalid password"
});
}

/* create JWT token */

const token = jwt.sign(
{userId:user._id},
process.env.JWT_SECRET || "secretkey",
{expiresIn:"7d"}
);

/* send response */

res.json({
token,
user:{
id:user._id,
name:user.name,
email:user.email
}
});

}catch(error){

console.log("LOGIN ERROR:",error);

res.status(500).json({
message:"Login failed"
});

}

});

export default router;