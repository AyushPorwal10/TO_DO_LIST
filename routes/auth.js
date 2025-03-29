const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Signup Route
router.post('/signup', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
        let userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: "Username already taken" });

        let emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ message: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
        const otpExpire = Date.now() + 10 * 60 * 1000; // 10 min expiry

        const newUser = new User({ name, email, password: hashedPassword, otp, otpExpire });
        await newUser.save();

        // Send OTP Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            text: `Your OTP is: ${otp}`
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "OTP sent to email. Verify to activate your account." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// OTP Verification
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: "Invalid OTP or expired" });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, message: "Login successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
