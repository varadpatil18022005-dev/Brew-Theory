const { Router } = require('express');
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const router = Router();

router.get('/', async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
});

router.post('/', async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return res.status(400).json({ message: 'Add at least one menu item to your order.' });
  }
  const quantities = new Map();
  for (const line of items) {
    if (!line || !mongoose.isValidObjectId(line.menuItemId) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      return res.status(400).json({ message: 'An order item or quantity is invalid.' });
    }
    quantities.set(line.menuItemId, (quantities.get(line.menuItemId) || 0) + line.quantity);
  }
  const menuItems = await MenuItem.find({ _id: { $in: [...quantities.keys()] }, available: true });
  if (menuItems.length !== quantities.size) return res.status(400).json({ message: 'One or more menu items are unavailable.' });
  const orderItems = menuItems.map((item) => ({ menuItem: item.id, name: item.name, quantity: quantities.get(item.id), unitPrice: item.price }));
  const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const order = await Order.create({ user: req.user.id, customerName: req.user.name, items: orderItems, total });
  res.status(201).json({ order });
});

module.exports = router;
