const API = "http://localhost:5000/api/auth";

/* ================= SIGNUP ================= */

async function signup(){

const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

const res = await fetch(`${API}/signup`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name,
email,
password
})
});

const data = await res.json();

if(data.message){

alert(data.message);

if(data.message === "User created successfully"){
window.location.href = "login.html";
}

}else{

alert("Signup failed");

}

}catch(err){

alert("Server error");

}

}


/* ================= LOGIN ================= */

async function login(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

const res = await fetch(`${API}/login`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
password
})
});

const data = await res.json();

if(data.token){

localStorage.setItem("token",data.token);
localStorage.setItem("user",JSON.stringify(data.user));

alert("Login successful");

window.location.href="index.html";

}else{

alert(data.message || "Login failed");

}

}catch(err){

alert("Server error");

}

}