require('dotenv').config();
const axios = require('axios');

async function testGemini() {
    console.log("Checking API Key...");
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
        console.error("❌ No API Key found in .env file!");
        return;
    }

    // We will try the most basic 'gemini-pro' model first
   // Using Gemini 2.0 Flash from your authorized list
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    console.log("Sending test request to Google...");
    
    try {
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: "Say 'Hello Tiny Tide'" }]
            }]
        });

        if (response.data.candidates) {
            console.log("✅ SUCCESS!");
            console.log("AI Response:", response.data.candidates[0].content.parts[0].text);
        }
    } catch (error) {
        console.error("❌ FAILED");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Error Detail:", error.response.data.error.message);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testGemini();