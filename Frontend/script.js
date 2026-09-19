let threads = [];
let currentThread = null; // holds the conversation _id from DB
let typingInterval = null;
let isSending = false; // prevent double submission

/* =============================
   AUTH CHECK
   ============================= */

if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

window.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    document.getElementById("username").innerText = "👤 " + user.name;
  }

  loadThreads();
});

/* =============================
   LOGOUT
   ============================= */

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/* =============================
   CREATE NEW CHAT
   ============================= */

function newChat() {
  currentThread = null;
  renderThreads();
  document.getElementById("chat").innerHTML = "";
}

/* =============================
   RENDER THREADS
   ============================= */

function renderThreads() {
  const list = document.getElementById("threads");
  list.innerHTML = "";

  threads.forEach((thread) => {
    const li = document.createElement("li");
    li.className = "thread-item";
    if (thread.id === currentThread) {
      li.classList.add("active");
    }

    const title = document.createElement("span");
    title.innerText = thread.title;
    title.onclick = () => loadThread(thread.id);
    // double click to rename
    title.ondblclick = (e) => {
      e.stopPropagation();
      renameThread(thread.id);
    };

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

async function deleteThread(id) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/chat/${id}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete conversation");
    }
    // Reload threads from server
    if (currentThread === id) {
      currentThread = null;
      document.getElementById("chat").innerHTML = "";
    }
    await loadThreads();
  } catch (err) {
    alert(err.message);
  }
}

/* =============================
   RENAME THREAD
   ============================= */

async function renameThread(id) {
  const newTitle = prompt("Enter new chat title:");
  if (!newTitle) return;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/chat/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ title: newTitle }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to rename conversation");
    }
    // Reload threads from server to get updated title
    await loadThreads();
  } catch (err) {
    alert(err.message);
  }
}

/* =============================
   LOAD THREAD MESSAGES
   ============================= */

async function loadThread(id) {
  currentThread = id;
  const chat = document.getElementById("chat");
  chat.innerHTML = "";
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`http://localhost:5000/api/chat/${id}/messages`, {
      headers: { Authorization: token },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to load messages");
    }
    const messages = await res.json();
    messages.forEach((m) => {
      chat.innerHTML += `
<div class="chat-row ${m.role}-row">
  <div class="message ${m.role}"><b>${m.role === "user" ? "You" : "AI"}:</b> ${marked.parse(m.message)}</div>
</div>`;
    });
    // Highlight code blocks
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
    scrollChat();
  } catch (err) {
    alert(err.message);
  }
}

/* =============================
   LOAD THREAD LIST FROM DB
   ============================= */

async function loadThreads() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:5000/api/chat/threads", {
      headers: { Authorization: token },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to load conversations");
    }
    const data = await res.json();
    threads = data.map((t) => ({
      id: t._id,
      title: t.title || "Chat",
      messages: [],
    }));
    renderThreads();
  } catch (err) {
    console.error("Failed to load threads:", err);
    alert(err.message);
  }
}

/* =============================
   STREAM TEXT
   ============================= */

function streamText(element, text) {
  let index = 0;
  let buffer = "";
  document.getElementById("stopBtn").style.display = "block";
  typingInterval = setInterval(() => {
    buffer += text.charAt(index);
    element.innerHTML = "<b>AI:</b> " + marked.parse(buffer);
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
    index++;
    scrollChat();
    if (index >= text.length) {
      clearInterval(typingInterval);
      document.getElementById("stopBtn").style.display = "none";
    }
  }, 15);
}

/* =============================
   STOP GENERATION
   ============================= */

function stopGeneration() {
  if (typingInterval) {
    clearInterval(typingInterval);
    document.getElementById("stopBtn").style.display = "none";
  }
}

/* =============================
   SEND MESSAGE
   ============================= */

async function sendMessage() {
  const input = document.getElementById("message");
  const chat = document.getElementById("chat");
  const message = input.value.trim();
  
  if (message === "" || isSending) return;
  
  isSending = true;

  // USER MESSAGE UI
  chat.innerHTML += `
<div class="chat-row user-row">
  <div class="message user"><b>You:</b> ${message}</div>
</div>`;
  input.value = "";

  // LOADER
  const loader = document.createElement("div");
  loader.className = "message bot";
  loader.id = "loader";
  loader.innerText = "AI is typing...";
  chat.appendChild(loader);
  scrollChat();

  // API CALL
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:5000/api/chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ message, threadId: currentThread }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to send message");
    }
    
    const data = await res.json();
    
    // Update current thread with the real ID from server
    currentThread = data.threadId;
    
    // Reload threads to get the updated list
    await loadThreads();
    
    // REMOVE LOADER
    loader.remove();
    // AI MESSAGE UI
    const row = document.createElement("div");
    row.className = "chat-row bot-row";
    const aiMessage = document.createElement("div");
    aiMessage.className = "message bot";
    row.appendChild(aiMessage);
    chat.appendChild(row);
    streamText(aiMessage, data.reply);
    scrollChat();
  } catch (err) {
    loader.remove();
    alert("Error sending message: " + err.message);
  } finally {
    isSending = false;
  }
}

/* =============================
   AUTO SCROLL
   ============================= */

function scrollChat() {
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

textarea.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});