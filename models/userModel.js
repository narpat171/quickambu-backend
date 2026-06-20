const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ➔ 🚨 Naya: User ki photo ka path save karne ke liye
  profilePhoto: { type: String, default: "" }, 
  
  role: { type: String, default: "user" },

  // 👇 Forgot Password (Email OTP) ke liye naye fields
  resetOtp: { type: String, default: null },
  resetOtpExpire: { type: Date, default: null }
  
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;