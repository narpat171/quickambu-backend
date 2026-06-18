const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ➔ 1. REGISTER USER (नया यूजर रजिस्टर करना)
const registerUser = async (req, res) => {
    try {
        console.log("➔ User Register API Hit! Data:", req.body);
        const { name, mobile, email, password } = req.body;

        if (!name || !mobile || !email || !password) {
            return res.status(400).json({ success: false, message: "सभी बॉक्स भरना जरूरी है!" });
        }

        const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "यह मोबाइल नंबर या ईमेल पहले से रजिस्टर है!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ➔ 🚨 Naya: Agar user ne photo upload ki hai, toh uska path nikalein aur Windows fix lagayein
        let profilePhoto = "";
        if (req.file) {
            profilePhoto = req.file.path.replace(/\\/g, "/");
        }

        // Naya user photo ke sath database me save karein
        const newUser = await User.create({
            name, mobile, email, 
            password: hashedPassword,
            profilePhoto // ➔ photo ka rasta save ho gaya
        });

        res.status(201).json({ success: true, message: "यूजर सफलतापूर्वक रजिस्टर हो गया! 🎉" });

    } catch (error) {
        console.error("यूजर रजिस्टर एरर:", error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर, रजिस्ट्रेशन फेल!" });
    }
};

// ➔ 2. LOGIN USER (यूजर लॉगिन करना)
const loginUser = async (req, res) => {
    try {
        console.log("➔ User Login API Hit! Data:", req.body);
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({ success: false, message: "मोबाइल नंबर और पासवर्ड दोनों डालें!" });
        }

        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(400).json({ success: false, message: "यह मोबाइल नंबर रजिस्टर नहीं है!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "गलत पासवर्ड!" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({
            success: true,
            message: "यूजर लॉगिन सफल रहा! 👋",
            token: token,
            // login par photo bhi bhej rahe hain taaki frontend me use ho sake
            userData: { name: user.name, mobile: user.mobile, email: user.email, profilePhoto: user.profilePhoto }
        });

    } catch (error) {
        console.error("यूजर लॉगिन एरर:", error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर!" });
    }
};
// ➔ 3. GET USER PROFILE (यूजर का डेटा मंगाना)
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: "यूजर नहीं मिला!" });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "सर्वर एरर!" });
    }
};

// ➔ 4. UPDATE USER PROFILE (यूजर की प्रोफाइल एडिट करना)
const updateUserProfile = async (req, res) => {
    try {
        const { name, email, mobile } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.userId, 
            { name, email, mobile }, 
            { new: true }
        ).select('-password');

        res.status(200).json({ success: true, message: "प्रोफाइल अपडेट हो गई! 🎉", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "सर्वर एरर, अपडेट फेल!" });
    }
};

// ➔ 🚨 इसके ठीक नीचे आपका पुराना एक्सपोर्ट रहना चाहिए:
module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };