const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./config/logger');
const routes = require('./routes/index');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// HTTP logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security sanitization — in-place, compatible with Express 5 (req.query is read-only)
// Strips NoSQL injection keys ($-prefixed, dot-notation) and HTML-encodes string values.
const sanitizeValue = (v) =>
  typeof v === 'string'
    ? v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c]))
    : v;
const sanitizeObj = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach((key) => {
    if (key.startsWith('$') || key.includes('.')) { delete obj[key]; return; }
    if (typeof obj[key] === 'object') { sanitizeObj(obj[key]); }
    else { obj[key] = sanitizeValue(obj[key]); }
  });
};
app.use((req, _res, next) => { sanitizeObj(req.body); sanitizeObj(req.params); sanitizeObj(req.query); next(); });

// Global rate limit — skipped entirely in development (production: 500 req/15 min)
app.use('/api/v1', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many requests, please try again later' },
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// API routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => res.json({ success: true, message: 'Server is running' }));

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
