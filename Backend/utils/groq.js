import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const askGroq = async (message, conversationHistory = []) => {

  try {

    const messages = [
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b",
        messages: messages
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {

    console.log("GROQ ERROR:", error.response?.data || error.message);

    return "Error getting response from AI";
  }

};