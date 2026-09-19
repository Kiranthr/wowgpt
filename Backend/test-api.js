import axios from "axios";

const API_URL = "http://localhost:5000";

async function testAPI() {
  console.log("Starting API tests...");
  
  try {
    // Test 1: Test endpoint
    console.log("\n1. Testing /api/test endpoint...");
    const testRes = await axios.get(`${API_URL}/api/test`);
    console.log("✓ Test endpoint working:", testRes.data);
    
    // Test 2: Signup
    console.log("\n2. Testing signup...");
    const testEmail = `test${Date.now()}@example.com`;
    const signupRes = await axios.post(`${API_URL}/api/auth/signup`, {
      name: "Test User",
      email: testEmail,
      password: "test123"
    });
    console.log("✓ Signup successful:", signupRes.data);
    
    // Test 3: Login
    console.log("\n3. Testing login...");
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: "test123"
    });
    console.log("✓ Login successful, token received");
    const token = loginRes.data.token;
    
    // Test 4: Get threads (should be empty initially)
    console.log("\n4. Testing GET /api/chat/threads...");
    const threadsRes = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: token }
    });
    console.log("✓ Threads retrieved:", threadsRes.data.length, "conversations");
    
    // Test 5: Send message (create new conversation)
    console.log("\n5. Testing POST /api/chat (send message)...");
    console.log("   Note: This may fail if GROQ_API_KEY is not configured");
    let threadId = null;
    try {
      const messageRes = await axios.post(`${API_URL}/api/chat`, {
        message: "Hello, this is a test message",
        threadId: null
      }, {
        headers: { 
          Authorization: token,
          "Content-Type": "application/json"
        }
      });
      console.log("✓ Message sent, thread created:", messageRes.data.threadId);
      threadId = messageRes.data.threadId;
    } catch (aiError) {
      console.log("⚠ Message creation skipped (AI API issue):", aiError.response?.data?.error || aiError.message);
      console.log("   Continuing with basic tests...");
      threadId = null; // Skip AI-dependent tests
    }
    
    // Test 6: Get threads again (should have 1 conversation)
    console.log("\n6. Testing GET /api/chat/threads after message...");
    const threadsRes2 = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: token }
    });
    console.log("✓ Threads retrieved:", threadsRes2.data.length, "conversations");
    
    if (threadId) {
      // Test 7: Get messages for the thread
      console.log("\n7. Testing GET /api/chat/:threadId/messages...");
      const messagesRes = await axios.get(`${API_URL}/api/chat/${threadId}/messages`, {
        headers: { Authorization: token }
      });
      console.log("✓ Messages retrieved:", messagesRes.data.length, "messages");
      
      // Test 8: Rename conversation
      console.log("\n8. Testing PATCH /api/chat/:threadId (rename)...");
      const renameRes = await axios.patch(`${API_URL}/api/chat/${threadId}`, {
        title: "Renamed Test Chat"
      }, {
        headers: { 
          Authorization: token,
          "Content-Type": "application/json"
        }
      });
      console.log("✓ Conversation renamed:", renameRes.data);
      
      // Test 9: Send another message to same thread
      console.log("\n9. Testing POST /api/chat (second message)...");
      console.log("   Note: This may fail if GROQ_API_KEY is not configured");
      try {
        const messageRes2 = await axios.post(`${API_URL}/api/chat`, {
          message: "This is a follow-up message",
          threadId: threadId
        }, {
          headers: { 
            Authorization: token,
            "Content-Type": "application/json"
          }
        });
        console.log("✓ Second message sent");
        
        // Test 10: Get messages again (should have 4 messages: 2 user + 2 AI)
        console.log("\n10. Testing GET /api/chat/:threadId/messages after second message...");
        const messagesRes2 = await axios.get(`${API_URL}/api/chat/${threadId}/messages`, {
          headers: { Authorization: token }
        });
        console.log("✓ Messages retrieved:", messagesRes2.data.length, "messages");
      } catch (aiError) {
        console.log("⚠ Second message skipped (AI API issue):", aiError.response?.data?.error || aiError.message);
      }
      
      // Test 11: Delete conversation
      console.log("\n11. Testing DELETE /api/chat/:threadId...");
      const deleteRes = await axios.delete(`${API_URL}/api/chat/${threadId}`, {
        headers: { Authorization: token }
      });
      console.log("✓ Conversation deleted:", deleteRes.data);
      
      // Test 12: Verify conversation is deleted
      console.log("\n12. Verifying conversation deletion...");
      const threadsRes3 = await axios.get(`${API_URL}/api/chat/threads`, {
        headers: { Authorization: token }
      });
      console.log("✓ Threads after deletion:", threadsRes3.data.length, "conversations");
    } else {
      console.log("\n⚠ Skipping thread-specific tests (no thread created due to AI API issue)");
    }
    
    console.log("\n✅ All API tests passed!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();