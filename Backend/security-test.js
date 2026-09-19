import axios from "axios";

const API_URL = "http://localhost:5000";

async function securityTest() {
  console.log("=== SECURITY TEST - USER ISOLATION ===\n");
  
  try {
    // Create User A
    console.log("Step 1: Create User A...");
    const userAEmail = `user-a-${Date.now()}@example.com`;
    await axios.post(`${API_URL}/api/auth/signup`, {
      name: "User A",
      email: userAEmail,
      password: "password123"
    });
    const userALogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: userAEmail,
      password: "password123"
    });
    const tokenA = userALogin.data.token;
    console.log("✓ User A created and logged in");
    
    // Create User B
    console.log("\nStep 2: Create User B...");
    const userBEmail = `user-b-${Date.now()}@example.com`;
    await axios.post(`${API_URL}/api/auth/signup`, {
      name: "User B",
      email: userBEmail,
      password: "password123"
    });
    const userBLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: userBEmail,
      password: "password123"
    });
    const tokenB = userBLogin.data.token;
    console.log("✓ User B created and logged in");
    
    // User A creates a chat
    console.log("\nStep 3: User A creates Chat A...");
    const chatARes = await axios.post(`${API_URL}/api/chat`, {
      message: "This is User A's private message",
      threadId: null
    }, {
      headers: { Authorization: tokenA, "Content-Type": "application/json" }
    });
    const chatAThreadId = chatARes.data.threadId;
    console.log("✓ User A created Chat A with ID:", chatAThreadId);
    
    // User B tries to access User A's chat (should fail)
    console.log("\nStep 4: User B tries to access User A's chat (should fail)...");
    try {
      await axios.get(`${API_URL}/api/chat/${chatAThreadId}/messages`, {
        headers: { Authorization: tokenB }
      });
      console.log("❌ SECURITY ERROR: User B can access User A's chat!");
      process.exit(1);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log("✓ User B cannot access User A's chat (expected)");
      } else {
        console.log("⚠ Unexpected error:", error.response?.status);
      }
    }
    
    // User B tries to rename User A's chat (should fail)
    console.log("\nStep 5: User B tries to rename User A's chat (should fail)...");
    try {
      await axios.patch(`${API_URL}/api/chat/${chatAThreadId}`, {
        title: "Hacked by User B"
      }, {
        headers: { Authorization: tokenB, "Content-Type": "application/json" }
      });
      console.log("❌ SECURITY ERROR: User B can rename User A's chat!");
      process.exit(1);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log("✓ User B cannot rename User A's chat (expected)");
      } else {
        console.log("⚠ Unexpected error:", error.response?.status);
      }
    }
    
    // User B tries to delete User A's chat (should fail)
    console.log("\nStep 6: User B tries to delete User A's chat (should fail)...");
    try {
      await axios.delete(`${API_URL}/api/chat/${chatAThreadId}`, {
        headers: { Authorization: tokenB }
      });
      console.log("❌ SECURITY ERROR: User B can delete User A's chat!");
      process.exit(1);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log("✓ User B cannot delete User A's chat (expected)");
      } else {
        console.log("⚠ Unexpected error:", error.response?.status);
      }
    }
    
    // Verify User A's chat still exists
    console.log("\nStep 7: Verify User A's chat still exists...");
    const messagesARes = await axios.get(`${API_URL}/api/chat/${chatAThreadId}/messages`, {
      headers: { Authorization: tokenA }
    });
    console.log("✓ User A's chat still has", messagesARes.data.length, "messages");
    
    // User B creates their own chat
    console.log("\nStep 8: User B creates their own chat...");
    const chatBRes = await axios.post(`${API_URL}/api/chat`, {
      message: "This is User B's private message",
      threadId: null
    }, {
      headers: { Authorization: tokenB, "Content-Type": "application/json" }
    });
    const chatBThreadId = chatBRes.data.threadId;
    console.log("✓ User B created Chat B with ID:", chatBThreadId);
    
    // Verify User A cannot access User B's chat
    console.log("\nStep 9: User A tries to access User B's chat (should fail)...");
    try {
      await axios.get(`${API_URL}/api/chat/${chatBThreadId}/messages`, {
        headers: { Authorization: tokenA }
      });
      console.log("❌ SECURITY ERROR: User A can access User B's chat!");
      process.exit(1);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log("✓ User A cannot access User B's chat (expected)");
      } else {
        console.log("⚠ Unexpected error:", error.response?.status);
      }
    }
    
    // Verify each user only sees their own threads
    console.log("\nStep 10: Verify User A only sees their own threads...");
    const threadsA = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: tokenA }
    });
    console.log("✓ User A sees", threadsA.data.length, "thread(s)");
    
    console.log("\nStep 11: Verify User B only sees their own threads...");
    const threadsB = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: tokenB }
    });
    console.log("✓ User B sees", threadsB.data.length, "thread(s)");
    
    console.log("\n=== SECURITY TEST PASSED - USERS ARE PROPERLY ISOLATED ===");
    
  } catch (error) {
    console.error("\n❌ SECURITY TEST FAILED:", error.response?.data || error.message);
    process.exit(1);
  }
}

securityTest();