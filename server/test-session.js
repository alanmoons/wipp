const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const PORT = 4000;

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
    secure: false,      // porque es localhost sin HTTPS
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'     // para localhost funciona bien
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
