const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a little and try again.' },
});
router.use(authLimiter);

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function sendVerificationEmail(to, code) {
  const user = process.env.MAIL_USER;
  const password = process.env.MAIL_APP_PASSWORD;
  if (!user || !password) {
    const error = new Error('Email is not configured. Add MAIL_USER and MAIL_APP_PASSWORD to backend/.env.');
    error.status = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: password.replace(/\s/g, '') },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transporter.sendMail({
    from: `Brew Theory <${user}>`,
    to,
    subject: 'Your Brew Theory verification code',
    text: `Your Brew Theory verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
  });
}

router.post('/request-code', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid name and email address.' });
  }
  if (Buffer.byteLength(password, 'utf8') < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Use a password between 8 and 72 bytes.' });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
  }

  const now = new Date();
  const pending = await EmailVerification.findOne({ email });
  if (pending && now - pending.sentAt < 60_000) {
    return res.status(429).json({ message: 'Please wait 60 seconds before requesting another code.' });
  }

  const code = String(require('node:crypto').randomInt(0, 1_000_000)).padStart(6, '0');
  const passwordHash = await bcrypt.hash(password, 12);
  const codeHash = await bcrypt.hash(code, 10);
  try {
    await sendVerificationEmail(email, code);
  } catch (error) {
    if (error.status === 503) throw error;
    console.error('Verification email could not be sent:', error.message);
    return res.status(503).json({ message: 'Email could not be sent. Check Gmail setup and try again.' });
  }

  await EmailVerification.findOneAndUpdate(
    { email },
    { $set: { name, email, passwordHash, codeHash, expiresAt: new Date(now.getTime() + 10 * 60_000), sentAt: now, attempts: 0 } },
    { upsert: true, new: true, runValidators: true },
  );
  return res.json({ message: `A verification code was sent to ${email}.` });
});

router.post('/verify-code', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (!email || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Enter your email and the 6-digit code.' });
  }

  const pending = await EmailVerification.findOne({ email });
  if (!pending) return res.status(400).json({ message: 'Request a verification code first, or request a new one.' });
  if (pending.expiresAt <= new Date()) {
    await pending.deleteOne();
    return res.status(400).json({ message: 'That code expired. Request a new one.' });
  }
  if (pending.attempts >= 5) {
    await pending.deleteOne();
    return res.status(429).json({ message: 'Too many incorrect codes. Request a new code.' });
  }
  if (!await bcrypt.compare(code, pending.codeHash)) {
    pending.attempts += 1;
    await pending.save();
    return res.status(400).json({ message: 'That code is incorrect.' });
  }

  try {
    await User.create({ name: pending.name, email, passwordHash: pending.passwordHash, emailVerifiedAt: new Date() });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'This email already has an account. Please sign in.' });
    throw error;
  }
  await pending.deleteOne();
  return res.status(201).json({ message: 'Email verified and account created. You can now sign in.' });
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error('JWT_SECRET must be set to a random secret at least 32 characters long.');
    error.status = 503;
    throw error;
  }
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, secret, { expiresIn: '12h', issuer: 'coffee-house' });
  return res.json({ token, user: { name: user.name, email: user.email } });
});

module.exports = router;
