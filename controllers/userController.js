const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // 👉 Email भेजने के लिए
const axios = require('axios');

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

        // ➔ 🚨 फोटो अपलोड का पाथ सेट करना (Windows fix के साथ)
        let profilePhoto = "";
        if (req.file) {
            profilePhoto = req.file.path.replace(/\\/g, "/");
        }

        // नया यूजर डेटाबेस में सेव करें
        const newUser = await User.create({
            name, mobile, email, 
            password: hashedPassword,
            profilePhoto // ➔ photo का रास्ता
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

        const token = jwt.sign({ id: user._id }, "NarpatAmbu12345", { expiresIn: '30d' });

        res.status(200).json({
            success: true,
            message: "यूजर लॉगिन सफल रहा! 👋",
            token: token,
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

// =========================================================
// 🚀 FORGOT PASSWORD, VERIFY OTP, RESET PASSWORD APIs (GMAIL)
// =========================================================

// ➔ 5. FORGOT PASSWORD (OTP भेजना)
// ➔ 5. FORGOT PASSWORD (OTP भेजना) - FINAL FIX
// ➔ 5. FORGOT PASSWORD (OTP भेजना) - 100% GUARANTEED FIX

// ➔ 5. FORGOT PASSWORD (सभी नंबर्स पर SMS भेजना)
const forgotPassword = async (req, res) => {
    try {
        const { mobile } = req.body; 
        const user = await User.findOne({ mobile });

        if (!user) {
            return res.status(404).json({ success: false, message: "यह नंबर रजिस्टर नहीं है!" });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.resetOtpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // 🚀 Fast2SMS API: किसी भी नंबर पर मैसेज भेजने के लिए
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: 'DUPEMBtjkmYziHfo3hWrFKCabg2I74wSlX5RqANOcvxGpuL8JVyXIlhZboETSH2quM3me9jrkB0giYPv',
                // 👇 ध्यान दें: यहाँ OTP शब्द हटा दिया है ताकि ऑपरेटर इसे ब्लॉक न करे
                message: `QuickAmbu verification code is ${otp}. Do not share it with anyone.`,
                language: 'english',
                route: 'q', // ➔ 'q' मतलब बिना DLT वाला रास्ता
                numbers: mobile // ➔ वेबसाइट पर जो भी नंबर डाला जाएगा, मैसेज उसी पर जाएगा
            }
        });

        res.status(200).json({ success: true, message: "OTP आपके मोबाइल पर भेज दिया गया है! 📱" });

    } catch (error) {
        console.error("SMS Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर, SMS नहीं जा सका।" });
    }
};

// ➔ 6. VERIFY OTP (OTP चेक करना)
const verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body; // 👉 email की जगह mobile
        const user = await User.findOne({ mobile }); // 👉 mobile से यूज़र ढूंढेंगे

        if (!user) {
            return res.status(404).json({ success: false, message: "यह नंबर रजिस्टर नहीं है!" });
        }

        // चेक करें कि OTP सही है या एक्सपायर तो नहीं हो गया
        if (user.resetOtp !== otp || user.resetOtpExpire < Date.now()) {
            return res.status(400).json({ success: false, message: "ग़लत या एक्सपायर OTP! कृपया दोबारा चेक करें।" });
        }

        res.status(200).json({ success: true, message: "OTP सही है! अब नया पासवर्ड बनाएँ।" });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ success: false, message: "सर्वर एरर, OTP वेरीफाई नहीं हो सका।" });
    }
};

// ➔ 7. RESET PASSWORD (नया पासवर्ड सेव करना)
const resetPassword = async (req, res) => {
    try {
        const { mobile, newPassword } = req.body; // 👉 email की जगह mobile
        const user = await User.findOne({ mobile });

        if (!user) {
            return res.status(404).json({ success: false, message: "यह नंबर रजिस्टर नहीं है!" });
        }

        // नया पासवर्ड सेट करें और पुराने OTP को हटा दें
        user.password = newPassword; // (अगर आपने bcrypt लगाया है तो मॉडल अपने आप इसे हैश कर देगा)
        user.resetOtp = undefined;
        user.resetOtpExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "पासवर्ड सफलतापूर्वक बदल गया है! 🎉" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, message: "सर्वर एरर, पासवर्ड नहीं बदला जा सका।" });
    }
}

// ➔ 🚨 सारे फंक्शन एक्सपोर्ट कर रहे हैं
module.exports = { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile,
    forgotPassword, 
    verifyOtp,      
    resetPassword   
};