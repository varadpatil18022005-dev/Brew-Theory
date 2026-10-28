const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerName: { type: String, required: true },
  items: [{ menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, name: String, quantity: Number, unitPrice: Number }],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Received', 'Preparing', 'Ready', 'Completed', 'Cancelled'], default: 'Received' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
