let threads = [];
let currentThread = null;
let typingInterval = null;

/* =============================
   AUTH CHECK
============================= */

if(!localStorage.getItem("token")){
window.location.href = "login.html";
}

window.addEventListener("DOMContentLoaded", () => {

const user = JSON.parse(localStorage.getItem("user"));

if(user){
document.getElementById("username").innerText = "👤 " + user.name;
}

loadThreads();

});


/* =============================
   LOGOUT
============================= */

function logout(){

localStorage.removeItem("token");
localStorage.removeItem("user");

window.location.href = "login.html";

}


/* =============================
   CREATE NEW CHAT
============================= */

function newChat(){

const id = Date.now();

threads.push({
id:id,
title:"New Chat",
messages:[]
});

currentThread = id;

renderThreads();

document.getElementById("chat").innerHTML = "";

}


/* =============================
   RENDER THREADS
============================= */

function renderThreads(){

const list = document.getElementById("threads");

list.innerHTML = "";

threads.forEach(thread => {

const li = document.createElement("li");
li.className = "thread-item";

const title = document.createElement("span");
title.innerText = thread.title;
title.onclick = () => loadThread(thread.id);

const deleteIcon = document.createElement("span");
deleteIcon.innerText = "🗑";
deleteIcon.className = "delete-icon";

deleteIcon.onclick = (e) => {
e.stopPropagation();
deleteThread(thread.id);
};

li.appendChild(title);
li.appendChild(deleteIcon);

list.appendChild(li);

});

}


/* =============================
   DELETE THREAD
============================= */

function deleteThread(id){

threads = threads.filter(thread => thread.id !== id);

if(currentThread === id){
currentThread = null;
document.getElementById("chat").innerHTML = "";
}

renderThreads();

}


/* =============================
   LOAD THREAD MESSAGES
============================= */

async function loadThread(id){

currentThread = id;

const chat = document.getElementById("chat");

chat.innerHTML = "";

const token = localStorage.getItem("token");

const res = await fetch("http://localhost:5000/api/chat/" + id,{
headers:{
Authorization:token
}
});

const messages = await res.json();

messages.forEach(m => {

chat.innerHTML += `
<div class="chat-row ${m.role}-row">
<div class="message ${m.role}">
<b>${m.role === "user" ? "You" : "AI"}:</b>
${marked.parse(m.message)}
</div>
</div>
`;

});

scrollChat();

}


/* =============================
   LOAD THREAD LIST FROM DB
============================= */

async function loadThreads(){

const token = localStorage.getItem("token");

const res = await fetch("http://localhost:5000/api/chat/threads",{
headers:{
Authorization:token
}
});

const data = await res.json();

threads = data.map(t => ({
id: t._id,
title: t.lastMessage ? t.lastMessage.substring(0,30) : "Chat",
messages:[]
}));

renderThreads();

}


/* =============================
   STREAM TEXT
============================= */

function streamText(element, text){

let index = 0;
let buffer = "";

document.getElementById("stopBtn").style.display = "block";

typingInterval = setInterval(()=>{

buffer += text.charAt(index);

element.innerHTML = "<b>AI:</b> " + marked.parse(buffer);

document.querySelectorAll("pre code").forEach((block)=>{
hljs.highlightElement(block);
});

index++;

scrollChat();

if(index >= text.length){

clearInterval(typingInterval);
document.getElementById("stopBtn").style.display = "none";

}

},15);

}


/* =============================
   STOP GENERATION
============================= */

function stopGeneration(){

if(typingInterval){
clearInterval(typingInterval);
document.getElementById("stopBtn").style.display = "none";
}

}


/* =============================
   SEND MESSAGE
============================= */

async function sendMessage(){

const input = document.getElementById("message");
const chat = document.getElementById("chat");

const message = input.value.trim();

if(message === "") return;

if(!currentThread){
newChat();
}

const thread = threads.find(t => t.id === currentThread);

if(thread && thread.title === "New Chat"){
thread.title = message.substring(0,30);
renderThreads();
}


/* USER MESSAGE */

chat.innerHTML += `
<div class="chat-row user-row">
<div class="message user">
<b>You:</b> ${message}
</div>
</div>
`;

input.value = "";


/* LOADER */

const loader = document.createElement("div");
loader.className = "message bot";
loader.id = "loader";
loader.innerText = "AI is typing...";

chat.appendChild(loader);

scrollChat();


/* API CALL */

const token = localStorage.getItem("token");

const res = await fetch("http://localhost:5000/api/chat",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:token
},
body:JSON.stringify({
message,
threadId:currentThread
})
});

const data = await res.json();


/* REMOVE LOADER */

loader.remove();


/* AI MESSAGE */

const row = document.createElement("div");
row.className = "chat-row bot-row";

const aiMessage = document.createElement("div");
aiMessage.className = "message bot";

row.appendChild(aiMessage);
chat.appendChild(row);

streamText(aiMessage, data.reply);

scrollChat();

}


/* =============================
   AUTO SCROLL
============================= */

function scrollChat(){

const chat = document.getElementById("chat");

chat.scrollTop = chat.scrollHeight;

}


/* =============================
   AUTO GROW INPUT
============================= */

const textarea = document.getElementById("message");

textarea.addEventListener("input", () => {

textarea.style.height = "auto";
textarea.style.height = textarea.scrollHeight + "px";

});


/* =============================
   ENTER TO SEND
============================= */

textarea.addEventListener("keydown", function(e){

if(e.key === "Enter" && !e.shiftKey){

e.preventDefault();
sendMessage();

}

});