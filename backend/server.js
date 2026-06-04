const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.some((o) =>
          origin.startsWith(o.replace(/\/$/, ''))
        )
      ) {
        callback(null, true);
      } else {
        callback(null, true); // allow all in dev
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE VERSION:', process.version);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');

    // Routes should only load after MongoDB connects
    const eventRoutes = require('./routes/events');
    const adminRoutes = require('./routes/admin');
    const colorRoutes = require('./routes/colors');

    app.use('/api/events', eventRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', colorRoutes);

    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'Tentative Event Calendar API is running',
      });
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Error:');
    console.dir(err, { depth: null });
    process.exit(1);
  });

module.exports = app;
