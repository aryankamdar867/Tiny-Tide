const mongoose = require('mongoose');

// 1. Define the Health Record Schema
const healthRecordSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    temp: Number,
    symptoms: String,
    visit: String
});

// 2. Define the Main Baby Schema
const babySchema = new mongoose.Schema({
    name: String,
    dob: Date,
    age: Number,
    gender: String,
    feedings: [{ 
        type: { type: String }, 
        quantity: String, 
        notes: String, 
        timestamp: { type: Date, default: Date.now } 
    }],
    sleepLogs: [{ 
        startTime: Date, 
        endTime: Date, 
        duration: Number, 
        notes: String 
    }],
    vaccines: [{ 
        name: String, 
        date: Date, 
        completed: { type: Boolean, default: false } 
    }],
    emergencyContacts: [{ 
        name: String, 
        relation: String, 
        phone: String 
    }],
    healthRecords: [healthRecordSchema] // Connects the health records here
});

// 3. Define the User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    baby: babySchema // This nests the baby data under each user
});

module.exports = mongoose.model('User', userSchema);