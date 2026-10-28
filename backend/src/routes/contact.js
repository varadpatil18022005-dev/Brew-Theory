const { Router } = require('express');
const ContactMessage = require('../models/ContactMessage');

const router = Router();
router.post('/', async (req, res) => {
  const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!subject || subject.length > 120 || !message || message.length > 2000) {
    return res.status(400).json({ message: 'Enter a subject and message (up to 2,000 characters).' });
  }
  await ContactMessage.create({
    user: req.user.id,
    name: req.user.name,
    email: req.user.email,
    subject,
    message,
  });
  res.status(201).json({ message: 'Thanks for reaching out. Your message has been saved.' });
});

module.exports = router;
