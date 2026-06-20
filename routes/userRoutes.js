const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// ➔ 👉 1. Naye OTP wale functions ko yahan import kiya gaya hai
const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile,
    forgotPassword, // ➔ Naya
    verifyOtp,      // ➔ Naya
    resetPassword   // ➔ Naya
} = require('../controllers/userController');

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) { cb(null, "user-" + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// Security Guard (Protect Middleware)
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
           const decoded = jwt.verify(token, "NarpatAmbu12345");
            req.userId = decoded.id; 
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "चाबी गलत या एक्सपायर है!" });
        }
    }
    if (!token) return res.status(401).json({ success: false, message: "बिना चाबी के एंट्री मना है!" });
};

// पुराने राउट्स
router.post('/register', upload.single('profilePhoto'), registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile); 
router.put('/profile', protect, updateUserProfile); 

// ➔ 👉 2. FORGOT PASSWORD wale 3 naye raaste (Inme protect middleware nahi lagega)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;