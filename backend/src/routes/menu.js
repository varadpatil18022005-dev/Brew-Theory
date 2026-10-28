const { Router } = require('express');
const MenuItem = require('../models/MenuItem');

const router = Router();
router.get('/', async (_req, res) => {
  const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 }).lean();
  res.json({ items });
});

module.exports = router;
