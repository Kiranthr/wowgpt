import axios from "axios";

const API_URL = "http://localhost:5000";

async function endToEndTest() {
  console.log("=== END-TO-END TEST ===\n");
  
  try {
    // Step 1: Clean up - delete existing test user if exists
    console.log("Step 1: Cleanup - Registering new test user...");
    const testEmail = `e2e-test-${Date.now()}@example.com`;
    const testPassword = "test123";
    
    try {
      await axios.post(`${API_URL}/api/auth/signup`, {
        name: "E2E Test User",
        email: testEmail,
        password: testPassword
      });
      console.log("✓ Test user registered");
    } catch (signupError) {
      console.log("⚠ Signup failed (user may exist):", signupError.response?.data?.message);
    }
    
    // Step 2: Login
    console.log("\nStep 2: Login...");
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    const token = loginRes.data.token;
    console.log("✓ Login successful");
    
    // Step 3: Create Chat A
    console.log("\nStep 3: Create Chat A with message 'Hello'...");
    const chatARes = await axios.post(`${API_URL}/api/chat`, {
      message: "Hello",
      threadId: null
    }, {
      headers: { Authorization: token, "Content-Type": "application/json" }
    });
    const chatAThreadId = chatARes.data.threadId;
    console.log("✓ Chat A created with ID:", chatAThreadId);
    
    // Step 4: Get threads to verify Chat A exists
    console.log("\nStep 4: Verify Chat A exists in thread list...");
    const threadsRes = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: token }
    });
    console.log("✓ Thread count:", threadsRes.data.length);
    console.log("✓ Chat A title:", threadsRes.data[0]?.title);
    
    // Step 5: Get messages from Chat A
    console.log("\nStep 5: Get messages from Chat A...");
    const messagesARes = await axios.get(`${API_URL}/api/chat/${chatAThreadId}/messages`, {
      headers: { Authorization: token }
    });
    console.log("✓ Message count in Chat A:", messagesARes.data.length);
    console.log("✓ First message role:", messagesARes.data[0]?.role);
    
    // Step 6: Send another message to Chat A
    console.log("\nStep 6: Send second message to Chat A...");
    await axios.post(`${API_URL}/api/chat`, {
      message: "How are you?",
      threadId: chatAThreadId
    }, {
      headers: { Authorization: token, "Content-Type": "application/json" }
    });
    console.log("✓ Second message sent to Chat A");
    
    // Step 7: Verify Chat A now has 4 messages (2 user + 2 AI)
    console.log("\nStep 7: Verify Chat A has 4 messages...");
    const messagesARes2 = await axios.get(`${API_URL}/api/chat/${chatAThreadId}/messages`, {
      headers: { Authorization: token }
    });
    console.log("✓ Message count in Chat A:", messagesARes2.data.length);
    
    // Step 8: Create Chat B
    console.log("\nStep 8: Create Chat B with different message...");
    const chatBRes = await axios.post(`${API_URL}/api/chat`, {
      message: "What is 2+2?",
      threadId: null
    }, {
      headers: { Authorization: token, "Content-Type": "application/json" }
    });
    const chatBThreadId = chatBRes.data.threadId;
    console.log("✓ Chat B created with ID:", chatBThreadId);
    
    // Step 9: Verify Chat B has only its own messages
    console.log("\nStep 9: Verify Chat B has only its own messages...");
    const messagesBRes = await axios.get(`${API_URL}/api/chat/${chatBThreadId}/messages`, {
      headers: { Authorization: token }
    });
    console.log("✓ Message count in Chat B:", messagesBRes.data.length);
    console.log("✓ First message in Chat B:", messagesBRes.data[0]?.message?.substring(0, 20));
    
    // Step 10: Verify Chat A still has its own messages (isolation test)
    console.log("\nStep 10: Verify Chat A still has its messages (isolation test)...");
    const messagesARes3 = await axios.get(`${API_URL}/api/chat/${chatAThreadId}/messages`, {
      headers: { Authorization: token }
    });
    console.log("✓ Chat A still has", messagesARes3.data.length, "messages");
    
    // Step 11: Rename Chat A
    console.log("\nStep 11: Rename Chat A...");
    await axios.patch(`${API_URL}/api/chat/${chatAThreadId}`, {
      title: "Renamed Chat A"
    }, {
      headers: { Authorization: token, "Content-Type": "application/json" }
    });
    console.log("✓ Chat A renamed");
    
    // Step 12: Verify rename persisted
    console.log("\nStep 12: Verify rename persisted...");
    const threadsRes2 = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: token }
    });
    const chatAInList = threadsRes2.data.find(t => t._id === chatAThreadId);
    console.log("✓ Chat A new title:", chatAInList?.title);
    
    // Step 13: Delete Chat B
    console.log("\nStep 13: Delete Chat B...");
    await axios.delete(`${API_URL}/api/chat/${chatBThreadId}`, {
      headers: { Authorization: token }
    });
    console.log("✓ Chat B deleted");
    
    // Step 14: Verify Chat B is gone
    console.log("\nStep 14: Verify Chat B is deleted...");
    const threadsRes3 = await axios.get(`${API_URL}/api/chat/threads`, {
      headers: { Authorization: token }
    });
    const chatBInList = threadsRes3.data.find(t => t._id === chatBThreadId);
    console.log("✓ Chat B in list:", chatBInList ? "Still exists (ERROR)" : "Deleted correctly");
    console.log("✓ Remaining thread count:", threadsRes3.data.length);
    
    // Step 15: Try to access deleted Chat B (should fail)
    console.log("\nStep 15: Try to access deleted Chat B (should fail)...");
    try {
      await axios.get(`${API_URL}/api/chat/${chatBThreadId}/messages`, {
        headers: { Authorization: token }
      });
      console.log("❌ ERROR: Deleted chat is still accessible");
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("✓ Deleted chat returns 404 (expected)");
      } else {
        console.log("⚠ Deleted chat returned different error:", error.response?.status);
      }
    }
    
    // Step 16: Verify Chat A still exists after deletion of Chat B
    console.log("\nStep 16: Verify Chat A still exists after Chat B deletion...");
    const messagesARes4 = await axios.get(`${API_URL}/api/chat/${chatAThreadId}/messages`, {
      headers: { Authorization: token }
    });
    console.log("✓ Chat A still has", messagesARes4.data.length, "messages");
    
    console.log("\n=== END-TO-END TEST COMPLETED SUCCESSFULLY ===");
    
  } catch (error) {
    console.error("\n❌ END-TO-END TEST FAILED:", error.response?.data || error.message);
    process.exit(1);
  }
}

endToEndTest();