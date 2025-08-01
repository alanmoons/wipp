require('dotenv').config();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://digitalfactory.mx',
  'http://localhost:4000'
];

const isProduction = process.env.NODE_ENV === 'production';

const SESSION_OPTIONS = {
  secret: process.env.SESSION_SECRET || 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,          // true en producción (HTTPS)
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax'
  }
};

module.exports = {
  PORT: process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'tu_jwt_secreto',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',  // 1 día de duración
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: process.env.SMTP_PORT,
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
  },
  CORS_OPTIONS: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true
  },
  SESSION_OPTIONS,
};

