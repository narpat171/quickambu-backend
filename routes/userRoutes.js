const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/userController');

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
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id; 
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "चाबी गलत या एक्सपायर है!" });
        }
    }
    if (!token) return res.status(401).json({ success: false, message: "बिना चाबी के एंट्री मना है!" });
};

// राउट्स
router.post('/register', upload.single('profilePhoto'), registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile); // ➔ नया रास्ता
router.put('/profile', protect, updateUserProfile); // ➔ नया रास्ता

module.exports = router;