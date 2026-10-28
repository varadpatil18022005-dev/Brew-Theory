const { Router } = require('express');
const Reservation = require('../models/Reservation');

const router = Router();
const TABLES = [
  { number: 1, capacity: 2 }, { number: 2, capacity: 2 },
  { number: 3, capacity: 4 }, { number: 4, capacity: 4 },
  { number: 5, capacity: 4 }, { number: 6, capacity: 6 },
  { number: 7, capacity: 6 }, { number: 8, capacity: 8 },
];
const SLOTS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'];

function getSlotDate(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !SLOTS.includes(time)) return null;
  const startsAt = new Date(`${date}T${time}:00`);
  return Number.isNaN(startsAt.getTime()) ? null : startsAt;
}

router.get('/availability', async (req, res) => {
  const startsAt = getSlotDate(req.query.date, req.query.time);
  if (!startsAt) return res.status(400).json({ message: 'Choose a date and one of the listed booking times.' });
  const booked = await Reservation.find({ startsAt, status: 'Booked' }).select('tableNumber').lean();
  const occupied = new Set(booked.map((item) => item.tableNumber));
  res.json({ availableTables: TABLES.filter((table) => !occupied.has(table.number)), slots: SLOTS });
});

router.get('/', async (req, res) => {
  const reservations = await Reservation.find({ user: req.user.id }).sort({ startsAt: 1 }).lean();
  res.json({ reservations });
});

router.post('/', async (req, res) => {
  const startsAt = getSlotDate(req.body.date, req.body.time);
  const guests = Number(req.body.guests);
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  if (!startsAt || !Number.isInteger(guests) || guests < 1 || guests > 8 || note.length > 300) {
    return res.status(400).json({ message: 'Choose a valid date, time and party size (1–8 guests).' });
  }
  if (startsAt <= new Date() || startsAt > new Date(Date.now() + 90 * 24 * 60 * 60_000)) {
    return res.status(400).json({ message: 'Choose a future date within the next 90 days.' });
  }
  const booked = await Reservation.find({ startsAt, status: 'Booked' }).select('tableNumber').lean();
  const occupied = new Set(booked.map((item) => item.tableNumber));
  const table = TABLES.find((option) => option.capacity >= guests && !occupied.has(option.number));
  if (!table) return res.status(409).json({ message: 'No suitable tables remain at that time. Please choose another slot.' });

  try {
    const reservation = await Reservation.create({
      user: req.user.id,
      customerName: req.user.name,
      guests,
      tableNumber: table.number,
      startsAt,
      note,
    });
    return res.status(201).json({ reservation });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That table was just reserved. Please choose another time.' });
    throw error;
  }
});

router.patch('/:id/cancel', async (req, res) => {
  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id, status: 'Booked', startsAt: { $gt: new Date() } },
    { $set: { status: 'Cancelled' } },
    { new: true },
  );
  if (!reservation) return res.status(404).json({ message: 'Upcoming reservation not found.' });
  res.json({ reservation, message: 'Reservation cancelled.' });
});

module.exports = { router, SLOTS };
