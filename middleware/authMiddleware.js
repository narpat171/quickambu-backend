const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // चेक करें कि रिक्वेस्ट में 'Authorization' हेडर है और क्या वह 'Bearer' से शुरू होता है
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 'Bearer <token>' में से सिर्फ <token> वाला हिस्सा निकालें
            token = req.headers.authorization.split(' ')[1];

            // .env फाइल में रखी सीक्रेट की (Secret Key) का इस्तेमाल करके टोकन को वेरीफाई करें
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // टोकन सही है, तो ड्राइवर की ID को req में सेव कर लें ताकि आगे काम आ सके
            req.driverId = decoded.id; 

            // सब सही है, आगे (अगले फंक्शन में) जाने दो
            next(); 
        } catch (error) {
            console.error("टोकन एरर:", error.message);
            return res.status(401).json({ success: false, message: "टोकन अमान्य (Invalid) है या एक्सपायर हो गया है, कृपया फिर से लॉगिन करें" });
        }
    }

    // अगर टोकन है ही नहीं
    if (!token) {
        return res.status(401).json({ success: false, message: "कोई टोकन नहीं मिला, एक्सेस मना है. पहले लॉगिन करें!" });
    }
};

// इसे एक्सपोर्ट करना बहुत ज़रूरी है, ताकि routes इसे इस्तेमाल कर सके
module.exports = { protect };
