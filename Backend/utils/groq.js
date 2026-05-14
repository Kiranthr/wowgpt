import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const askGroq = async (message) => {

  try {

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "user", content: message }
        ]
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