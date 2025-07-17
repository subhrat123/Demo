const express = require('express');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();
const app = express();
app.use(express.json());

// === Optional: MongoDB Schema ===
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  uuid: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// === Connect to MongoDB ===
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// === Password Generator ===
function generatePassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// === Email Sender ===
async function sendEmail(to, name, uuid, password) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Club Event" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: 'Your Event Credentials',
    text: `Hi ${name},

Thank you for registering!

Here are your credentials:

🆔 UUID: ${uuid}
🔐 Password: ${password}

Best,
Event Team`
  };

  await transporter.sendMail(mailOptions);
}


app.get('/',(req,res)=>res.send("hello"))

// === API Endpoint ===
app.post('/api/register', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

    const uuid = uuidv4();
    const password = generatePassword();

    // Save to DB
    await User.create({ name, email, uuid, password });

    // Send email
    await sendEmail(email, name, uuid, password);

    res.status(200).json({ message: "User registered and email sent" });
  } catch (err) {
    console.error("Error in /api/register:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
