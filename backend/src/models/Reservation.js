const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerName: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 8 },
  tableNumber: { type: Number, required: true },
  startsAt: { type: Date, required: true },
  note: { type: String, maxlength: 300, default: '' },
  status: { type: String, enum: ['Booked', 'Cancelled', 'Completed'], default: 'Booked' },
}, { timestamps: true });

reservationSchema.index(
  { tableNumber: 1, startsAt: 1 },
  { unique: true, partialFilterExpression: { status: 'Booked' } },
);
module.exports = mongoose.model('Reservation', reservationSchema);
