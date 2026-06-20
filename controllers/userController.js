const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // 👉 Naya: Email bhejనే ke liye

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

        const token = jwt.sign({ id: user._id }, "NarpatAmbu12345", { expiresIn: '30d' });

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

// =========================================================
// 🚀 NAYA: FORGOT PASSWORD, VERIFY OTP, RESET PASSWORD APIs
// =========================================================

// ➔ 5. FORGOT PASSWORD (OTP भेजना)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "यह ईमेल रजिस्टर नहीं है!" });
        }

        // 4 नंबर का असली रैंडम OTP बनाएँ
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // OTP को डेटाबेस में सेव करें (10 मिनट की वैलिडिटी के साथ)
        user.resetOtp = otp;
        user.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        // 🚨 ईमेल भेजने की सेटिंग (यहाँ अपना असली ईमेल और App Password डालें)
       const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // पोर्ट 465 के लिए इसे true रखना ही पड़ता है
    auth: {
        user: 'af6263001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_KEY // (बिना स्पेस के!)
    }
});

        const mailOptions = {
            from: 'QuickAmbu Team <ns7976144@gmail.com>',
            to: email,
            subject: 'QuickAmbu - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 15px;">
                    <h2 style="color: #0f172a;">QuickAmbu Password Reset</h2>
                    <p style="color: #475569; font-size: 16px;">आपका वन-टाइम पासवर्ड (OTP) नीचे दिया गया है। यह 10 मिनट तक मान्य है:</p>
                    <h1 style="background: #fee2e2; color: #dc2626; padding: 15px 30px; letter-spacing: 8px; border-radius: 10px; display: inline-block; font-size: 32px; font-weight: 900;">${otp}</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">अगर आपने यह रिक्वेस्ट नहीं की है, तो इस ईमेल को अनदेखा करें।</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "OTP आपकी ईमेल पर भेज दी गई है!" });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "सर्वर एरर, ईमेल नहीं जा सका।" });
    }
};

// ➔ 6. VERIFY OTP (OTP चेक करना)
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: "ग़लत OTP!" });
        }

        if (user.resetOtpExpire < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP एक्सपायर हो चुका है!" });
        }

        res.status(200).json({ success: true, message: "OTP वेरीफाई हो गया!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "सर्वर एरर!" });
    }
};

// ➔ 7. RESET PASSWORD (नया पासवर्ड सेव करना)
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "यूज़र नहीं मिला!" });
        }

        // नया पासवर्ड हैश (Secure) करें
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // पासवर्ड अपडेट करें और OTP डेटा डिलीट कर दें
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpire = null;
        await user.save();

        res.status(200).json({ success: true, message: "पासवर्ड सफलतापूर्वक बदल गया है!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "सर्वर एरर!" });
    }
};

// ➔ 🚨 सारे फंक्शन एक्सपोर्ट कर रहे हैं:
module.exports = { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile,
    forgotPassword, // 👉 Naya
    verifyOtp,      // 👉 Naya
    resetPassword   // 👉 Naya
};