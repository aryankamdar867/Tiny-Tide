require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    // This URL asks Google for your available models
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await axios.get(url);
        console.log("--- Your Available Models ---");
        response.data.models.forEach(m => {
            console.log(m.name); // This prints strings like 'models/gemini-1.5-flash'
        });
    } catch (error) {
        console.error("Error fetching models:", error.response?.data || error.message);
    }
}

listModels();