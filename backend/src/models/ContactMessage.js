const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, maxlength: 254 },
  subject: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['New', 'In progress', 'Resolved'], default: 'New' },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
