require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/user');

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Tiny Tide Database Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- AUTH MIDDLEWARE ---
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).send({ error: 'Log in required' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) throw new Error();
        req.user = user;
        next();
    } catch (e) { 
        res.status(401).send({ error: 'Session expired. Please log in again.' }); 
    }
};

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, babyName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 8);
        
        // FIXED: Initialize arrays to prevent "undefined" errors later
        const user = new User({ 
            email, 
            password: hashedPassword, 
            baby: { 
                name: babyName,
                feedings: [],
                sleepLogs: [],
                vaccines: [],
                healthRecords: [],
                emergencyContacts: []
            } 
        });
        
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.status(201).send({ user, token });
    } catch (e) { 
        res.status(400).send({ error: "Registration failed." }); 
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.send({ 
            token, 
            babyName: user.baby.name,
            user: { email: user.email } 
        });
    } catch (e) { 
        res.status(500).send({ error: "Login error" }); 
    }
});

// --- TRACKER ROUTES ---
app.get('/api/feeding', auth, async (req, res) => {
    res.send(req.user.baby.feedings);
});

app.post('/api/feeding', auth, async (req, res) => {
    req.user.baby.feedings.push(req.body);
    await req.user.save();
    res.send(req.user.baby.feedings);
});

// --- AI ASSISTANT (Gemini Integration) ---
app.post('/api/ask-ai', auth, async (req, res) => {
    try {
        const { question } = req.body;
        const baby = req.user.baby;

        const recentFeedings = baby.feedings.slice(-3).map(f => `${f.type}: ${f.quantity}ml`).join(', ');
        
        const systemContext = `You are an expert pediatric assistant for the app "Tiny Tide". 
        The baby's name is ${baby.name}. 
        Recent logs: ${recentFeedings || "No feeding data logged yet"}.
        Provide safe, warm, and helpful advice. Always suggest seeing a doctor for medical concerns.`;

        // FIXED: Using 'gemini-2.0-flash' which was confirmed in your list-models.js
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: `${systemContext}\n\nParent Question: ${question}` }]
            }]
        });

        if (response.data.candidates && response.data.candidates.length > 0) {
            const answer = response.data.candidates[0].content.parts[0].text;
            res.json({ answer });
        } else {
            throw new Error("Empty AI response");
        }
    } catch (error) {
        // Detailed error logging for debugging
        console.error("AI Error:", error.response?.data || error.message);
        
        // Handle Rate Limiting (429) specifically
        if (error.response?.status === 429) {
            return res.status(429).json({ error: "AI is busy. Wait 60 seconds." });
        }

        res.status(500).json({ error: "AI Assistant is resting. Try again shortly." });
    }
});

// --- HEALTH RECORDS ROUTES ---
app.get('/api/health', auth, async (req, res) => {
    try {
        res.send(req.user.baby.healthRecords || []);
    } catch (e) {
        res.status(500).send({ error: "Could not fetch records" });
    }
});

app.post('/api/health', auth, async (req, res) => {
    try {
        // Ensure healthRecords array exists
        if(!req.user.baby.healthRecords) req.user.baby.healthRecords = [];
        
        req.user.baby.healthRecords.push(req.body);
        await req.user.save();
        res.status(201).send(req.user.baby.healthRecords);
    } catch (e) {
        res.status(400).send({ error: "Could not save record" });
    }
});

// --- REMAINING ROUTES (Sleep, Vaccines, etc.) ---
app.post('/api/sleep', auth, async (req, res) => {
    req.user.baby.sleepLogs.push(req.body);
    await req.user.save();
    res.status(200).send(req.user.baby.sleepLogs);
});

app.get('/api/sleep', auth, async (req, res) => {
    res.send(req.user.baby.sleepLogs);
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Tiny Tide Backend LIVE on Port ${PORT}`);
});