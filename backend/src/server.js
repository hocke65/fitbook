const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - tillåt requests från frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Parse JSON body
app.use(express.json());

// Logga requests i development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Fitness Booking API körs!',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint hittades inte.',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Serverfel:', err);
  res.status(500).json({
    error: 'Ett oväntat serverfel inträffade.',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
});

// ============================================
// START SERVER
// ============================================

const useSSL = process.env.SSL_ENABLED === 'true';

if (useSSL) {
  const sslKeyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/server.key');
  const sslCertPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/server.crt');

  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };

  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log('=========================================');
    console.log(`🏋️  Fitness Booking API`);
    console.log(`🚀 Server körs på port ${PORT} (HTTPS)`);
    console.log(`📍 https://localhost:${PORT}`);
    console.log(`🔒 SSL aktiverat`);
    console.log(`🌍 Miljö: ${process.env.NODE_ENV || 'development'}`);
    console.log('=========================================');
  });
} else {
  app.listen(PORT, () => {
    console.log('=========================================');
    console.log(`🏋️  Fitness Booking API`);
    console.log(`🚀 Server körs på port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🌍 Miljö: ${process.env.NODE_ENV || 'development'}`);
    console.log('=========================================');
  });
}

module.exports = app;
