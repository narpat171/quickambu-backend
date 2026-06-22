const mongoose = require('mongoose');

// डेटाबेस में ड्राइवर का डेटा कैसा दिखेगा (उसका स्ट्रक्चर)
const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  whatsapp: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  aadhar: { type: String, required: true },
  plateNo: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  licenceNo: { type: String, required: true },
  rcNo: { type: String, required: true },
  facilities: [String], 
  
  // 👇 🔥 ये रहीं वो 2 नई लाइनें जो OTP को डेटाबेस में सेव करेंगी
  resetOtp: { type: String },
  resetOtpExpire: { type: Date },
  
  // ➔ 🚨 फिक्स: तीनों फोटो को 'photos' के डब्बे में पैक कर दिया 🚨
  photos: {
    ownerPhoto: { type: String, default: "" },
    insidePhoto: { type: String, default: "" },
    outsidePhoto: { type: String, default: "" }
  }
  
}, { timestamps: true }); // timestamps से यह पता चलेगा कि ड्राइवर कब रजिस्टर हुआ था

// 'Driver' नाम से इस मॉडल को एक्सपोर्ट करें
const Driver = mongoose.model('Driver', DriverSchema);

module.exports = Driver;