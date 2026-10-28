const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/requireAuth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const { router: reservationRoutes } = require('./routes/reservations');
const reviewRoutes = require('./routes/reviews');
const contactRoutes = require('./routes/contact');

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', requireAuth, orderRoutes);
app.use('/api/reservations', requireAuth, reservationRoutes);
app.use('/api/reviews', requireAuth, reviewRoutes);
app.use('/api/contact', requireAuth, contactRoutes);

app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'The server could not complete that request.',
  });
});

module.exports = app;
