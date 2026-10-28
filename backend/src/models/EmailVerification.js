const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, maxlength: 80 },
  passwordHash: { type: String, required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  sentAt: { type: Date, required: true, default: Date.now },
  attempts: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
