const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); 

const http = require('http'); 
const { Server } = require("socket.io"); 

const app = express();
const server = http.createServer(app); 

// 🚀 1. CORS फिक्स: Vercel और Localhost को सटीक परमिशन दे दी (origin "*" को हटाकर)
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://quickambu-frontend1.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// MongoDB Connection
const MONGO_URI = "mongodb+srv://Narpat:Ambu1234@cluster0.wpj7hlj.mongodb.net/quickambu?";
mongoose.connect(MONGO_URI)
  .then(() => console.log("➔ MongoDB se Connection SUCCESSFUL! 🎉"))
  .catch((err) => console.error("➔ Database Connection Error:", err));

const driverRoutes = require('./routes/driverRoutes');
const userRoutes = require('./routes/userRoutes'); 

app.use('/api/driver', driverRoutes); 
app.use('/api/user', userRoutes);    

// 🚀 2. Socket.io Configuration (यहाँ भी CORS फिक्स कर दिया है)
const io = new Server(server, {
  cors: {
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://quickambu-frontend1.vercel.app'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("🟢 Naya user connect hua! Socket ID:", socket.id);

  // 1. यूज़र से रिक्वेस्ट सुनना (जो एडमिन को जाएगी)
  socket.on("new-ambulance-request", (data) => {
    console.log("🚨 Nayi emergency request aayi:", data.name);
    io.emit("receive-request", data); 
  });

  // 2. जब Admin 'Dispatch' दबाए (जो ड्राइवर को जाएगी)
  socket.on("dispatch-ambulance", (data) => {
    console.log("🚑 Admin ne Ambulance Dispatch ki, Driver ID:", data.driverId);
    io.emit("incoming-duty", data); 
  });

  // 3. ड्राइवर से जर्नी (सफ़र) का लाइव स्टेटस सुनना
  socket.on("update-journey-status", (data) => {
    console.log(`📍 Journey Update (Req: ${data.reqId}) -> Step: ${data.step}`);
    io.emit("journey-status-updated", data); 
  });

  // 🚀 4. NEW: ड्राइवर की लाइव GPS लोकेशन सुनना और आगे भेजना
  socket.on("driver-location-update", (data) => {
    io.emit("driver-location-update", data); 
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnect ho gaya:", socket.id);
  });
});

// 🚀 3. Render के लिए PORT डायनामिक कर दिया
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`➔ Backend Server Port ${PORT} par shuru ho gaya hai! 🚀`);
});