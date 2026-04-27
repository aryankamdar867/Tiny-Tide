const API_URL = 'http://localhost:3000/api';

// Helper to save the "VIP Pass" (Token)
const saveToken = (token) => localStorage.setItem('tinyTideToken', token);
const getToken = () => localStorage.getItem('tinyTideToken');

const api = {
    // 1. Register a new user
    register: async (email, password, babyName) => {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, babyName })
        });
        const data = await res.json();
        if (data.token) saveToken(data.token);
        return data;
    },

    // 2. Log feeding to the cloud
    logFeeding: async (feedingData) => {
        const res = await fetch(`${API_URL}/feeding`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}` 
            },
            body: JSON.stringify(feedingData)
        });
        return res.json();
    },

    // 3. Ask the AI (using your Gemini Key)
    askAI: async (question, profileContext) => {
        const res = await fetch(`${API_URL}/ask-ai`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}` 
            },
            body: JSON.stringify({ question, profileContext })
        });
        return res.json();
    }
};