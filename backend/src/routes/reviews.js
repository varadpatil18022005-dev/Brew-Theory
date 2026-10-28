const { Router } = require('express');
const Review = require('../models/Review');

const router = Router();
router.get('/', async (_req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(60).lean();
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  res.json({ reviews, average: Math.round(average * 10) / 10, count: reviews.length });
});

router.get('/mine', async (req, res) => {
  const review = await Review.findOne({ user: req.user.id }).lean();
  res.json({ review });
});

router.put('/mine', async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment || comment.length > 700) {
    return res.status(400).json({ message: 'Choose 1–5 stars and write a review (up to 700 characters).' });
  }
  const review = await Review.findOneAndUpdate(
    { user: req.user.id },
    { $set: { customerName: req.user.name, rating, comment } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ review, message: 'Thanks for sharing your experience.' });
});

module.exports = router;
