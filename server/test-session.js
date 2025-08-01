const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 4000;

const allowedOrigins = [
  'http://localhost:4000',
  'https://digitalfactory.mx'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Postman o sin origin
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60,
  }),
  cookie: {
    httpOnly: true,
    secure: false,      // para localhost sin HTTPS, cambia a true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'     // para localhost funciona bien; si en producción con dominio cruzado usa 'none' + secure:true
  }
}));

app.get('/set', (req, res) => {
  req.session.user = { name: 'Alan' };
  res.send('Sesión creada');
});

app.get('/get', (req, res) => {
  res.json({ session: req.session });
});

app.listen(PORT, () => {
  console.log(`Test server on http://localhost:${PORT}`);
});

