const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  emailVerifiedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
