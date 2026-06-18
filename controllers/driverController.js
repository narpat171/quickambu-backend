const Driver = require('../models/driverModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ➔ 1. REGISTER DRIVER (नया ड्राइवर रजिस्टर करना)
const registerDriver = async (req, res) => {
    try {
        console.log("➔ Register API Hit! Data:", req.body);
        
        // 1. FRONTEND से आने वाला सारा डेटा यहाँ निकालें
        const { 
            name, mobile, password, whatsapp, email, 
            aadhar, plateNo, city, address, licenceNo, rcNo, facilities 
        } = req.body;

        if (!name || !mobile || !password) {
            return res.status(400).json({ success: false, message: "नाम, मोबाइल और पासवर्ड जरूरी है!" });
        }

        const existingDriver = await Driver.findOne({ mobile });
        if (existingDriver) {
            return res.status(400).json({ success: false, message: "यह नंबर पहले से रजिस्टर है! कृपया लॉगिन करें।" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ➔ फिक्स: फोटो निकालें और Windows के ( \ ) को ( / ) में बदलें
        let ownerPhoto = "", insidePhoto = "", outsidePhoto = "";
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (file.fieldname === 'ownerPhoto') ownerPhoto = file.path.replace(/\\/g, "/");
                if (file.fieldname === 'insidePhoto') insidePhoto = file.path.replace(/\\/g, "/");
                if (file.fieldname === 'outsidePhoto') outsidePhoto = file.path.replace(/\\/g, "/");
            });
        }

        // Facilities को Array में बदलें
        let parsedFacilities = [];
        if (facilities) {
            try {
                parsedFacilities = JSON.parse(facilities); 
            } catch (e) {
                console.log("Facilities parse error", e);
            }
        }

        // नया ड्राइवर सेव करें
        const newDriver = await Driver.create({
            name, mobile, password: hashedPassword,
            whatsapp, email, aadhar, plateNo,
            ambulanceNumber: plateNo,
            city, address, licenceNo, rcNo,
            facilities: parsedFacilities,
            photos: { ownerPhoto, insidePhoto, outsidePhoto }
        });

        res.status(201).json({ success: true, message: "ड्राइवर सफलतापूर्वक रजिस्टर हो गया!" });

    } catch (error) {
        console.error("रजिस्टर एरर:", error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर, रजिस्टर नहीं हो पाया!" });
    }
};

// ➔ 2. LOGIN DRIVER (ड्राइवर का लॉगिन करना)
const loginDriver = async (req, res) => {
    try {
        console.log("➔ Login API Hit! Data:", req.body);
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({ success: false, message: "मोबाइल नंबर और पासवर्ड दोनों डालना जरूरी है!" });
        }

        const driver = await Driver.findOne({ mobile });
        if (!driver) {
            return res.status(400).json({ success: false, message: "इस नंबर से कोई ड्राइवर रजिस्टर नहीं है!" });
        }

        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "पासवर्ड गलत है!" });
        }

        const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({
            success: true,
            message: "लॉगिन सफल रहा!",
            token: token
        });

    } catch (error) {
        console.error("लॉगिन एरर:", error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर!" });
    }
};

// ➔ 3. GET DRIVER PROFILE (ड्राइवर का डैशबोर्ड/डेटा)
const getDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findById(req.driverId).select('-password');
        
        if (!driver) {
            return res.status(404).json({ success: false, message: "ड्राइवर नहीं मिला!" });
        }

        res.status(200).json({ success: true, data: driver });

    } catch (error) {
        console.error("प्रोफाइल एरर:", error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर!" });
    }
};

// ➔ 4. UPDATE DRIVER PROFILE (ड्राइवर प्रोफाइल एडिट करना)
const updateDriverProfile = async (req, res) => {
    try {
        // ड्राइवर जो भी डेटा अपडेट करना चाहता है, उसे बॉडी से निकालें
        const { name, whatsapp, email, city, address, licenceNo, rcNo, plateNo } = req.body;

        // डेटाबेस में ड्राइवर को ढूंढें और उसका डेटा अपडेट करें
        const updatedDriver = await Driver.findByIdAndUpdate(
            req.driverId, // यह ID हमें सिक्योरिटी गार्ड (protect middleware) से मिलेगी
            {
                name, whatsapp, email, city, address, licenceNo, rcNo, plateNo,
                ambulanceNumber: plateNo // प्लेट नंबर बदलते ही एम्बुलेंस नंबर भी बदल जाएगा
            },
            { new: true } // इससे हमें अपडेटेड डेटा वापस मिलेगा
        ).select('-password'); // पासवर्ड को छोड़कर बाकी सब लाओ

        if (!updatedDriver) {
            return res.status(404).json({ success: false, message: "ड्राइवर नहीं मिला!" });
        }

        res.status(200).json({ 
            success: true, 
            message: "प्रोफाइल सफलतापूर्वक अपडेट हो गई है! 🎉", 
            data: updatedDriver 
        });

    } catch (error) {
        console.error("अपडेट प्रोफाइल एरर:", error.message);
        res.status(500).json({ success: false, message: "सर्वर एरर, प्रोफाइल अपडेट नहीं हो पाई!" });
    }
};

// ➔ 5. GET ALL DRIVERS (डेटाबेस से सारे ड्राइवर्स को खींचकर लाना - ADMIN के लिए)
const getAllDrivers = async (req, res) => {
    try {
        // Driver मॉडल का इस्तेमाल करके सारे ड्राइवर्स लायेंगे (पासवर्ड छुपा कर)
        const allDrivers = await Driver.find({}).select("-password");
        
        if (!allDrivers || allDrivers.length === 0) {
            return res.status(404).json({ success: false, message: "Koi driver nahi mila!" });
        }
        
        res.status(200).json({
            success: true,
            message: "Saare drivers mil gaye!",
            data: allDrivers
        });
    } catch (error) {
        console.error("Drivers laane me error:", error);
        res.status(500).json({ success: false, message: "Server error ho gaya!" });
    }
};

// 👇 सिर्फ एक ही बार export करना है (सब कुछ सही से डाल दिया है)
module.exports = { 
    registerDriver, 
    loginDriver, 
    getDriverProfile, 
    updateDriverProfile, 
    getAllDrivers 
};