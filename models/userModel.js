const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ➔ 🚨 Naya: User ki photo ka path save karne ke liye
  profilePhoto: { type: String, default: "" }, 
  
  role: { type: String, default: "user" }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;