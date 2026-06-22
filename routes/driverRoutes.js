const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// ➔ कंट्रोलर्स का सही इम्पोर्ट (यहाँ मैंने फ़ॉरगॉट पासवर्ड वाले फ़ंक्शन्स भी जोड़ दिए हैं)
const { 
    registerDriver, 
    loginDriver, 
    getDriverProfile, 
    updateDriverProfile,
    getAllDrivers,
    forgotPassword,    // 👈 नया
    verifyOtp,         // 👈 नया
    resetPassword      // 👈 नया
} = require('../controllers/driverController');

// Multer Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, "driver-" + Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// Security Middleware (Protect Route)
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, "NarpatAmbu12345");
            req.driverId = decoded.id; 
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "चाबी गलत या एक्सपायर है!" });
        }
    }
    if (!token) {
        return res.status(401).json({ success: false, message: "बिना चाबी (Token) के एंट्री मना है!" });
    }
};

// राउट्स की सही मैपिंग
router.post('/register', upload.any(), registerDriver);
router.post('/login', loginDriver);
router.get('/profile', protect, getDriverProfile);
router.put('/profile', protect, updateDriverProfile);

// 👇 🔥 ये रही आपकी API जो सारे ड्राइवर्स को लाएगी
router.get('/all', getAllDrivers);

// ==========================================
// 🚀 FORGOT PASSWORD (नये Routes)
// ==========================================
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;