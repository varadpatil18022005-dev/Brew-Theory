const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, required: true, enum: ['Coffee', 'Cold drinks', 'Bakery', 'Brunch'] },
  description: { type: String, required: true, maxlength: 240 },
  price: { type: Number, required: true, min: 0 },
  icon: { type: String, required: true, default: 'coffee' },
  available: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
