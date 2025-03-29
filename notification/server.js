require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Notification Schema
const NotificationSchema = new mongoose.Schema({
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Send a welcome message
    socket.emit('message', 'Welcome to Real-Time Notifications');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// API to Add New Notifications
app.post('/add-notification', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    try {
        const newNotification = new Notification({ message });
        await newNotification.save();

        // Emit new notification event
        io.emit('newNotification', newNotification);

        res.status(201).json({ message: "Notification added", notification: newNotification });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
