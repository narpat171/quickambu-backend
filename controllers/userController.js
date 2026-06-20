const nodemailer = require('nodemailer');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. 6 अंकों का रैंडम OTP जेनरेट करें
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 👉 (अगर आप OTP को डेटाबेस में सेव करते हैं, तो वो कोड यहाँ लिखें)

        // 2. Gmail का Transporter सेटअप
        const transporter = nodemailer.createTransport({
            service: 'gmail', // 👉 यहाँ सिर्फ gmail लिखना है, कोई host या port नहीं
            auth: {
                user: 'quickambu.churu@gmail.com', // 🚨 अपना जीमेल एड्रेस डालें
                pass: process.env.GMAIL_APP_PASSWORD // 🚨 .env वाला 16-अक्षरों का पासवर्ड
            }
        });

        // 3. ईमेल का फॉर्मेट
        const mailOptions = {
            from: '"QuickAmbu Team" <quickambu.churu@gmail.com>', // 🚨 अपना जीमेल एड्रेस
            to: email, 
            subject: 'QuickAmbu - Password Reset OTP',
            text: `Hello,\n\nYour OTP for password reset is: ${otp}\n\nPlease do not share this OTP with anyone.\n\nThanks,\nQuickAmbu Team`
        };

        // 4. ईमेल भेजें
        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: "OTP successfully sent to your email!" 
        });

    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ 
            success: false, 
            message: "सर्वर एरर, ईमेल नहीं जा सका।" 
        });
    }
};