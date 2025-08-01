require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 4000;

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Conectado a MongoDB');
}).catch((err) => {
  console.error('❌ Error al conectar a MongoDB', err);
});

// Modelo Usuario
const UserSchema = new mongoose.Schema({
  nombre: String,
  correo: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' }
});
const Usuario = mongoose.model('Usuario', UserSchema);

// Middlewares
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    secure: false,  // Cambia a true si usas HTTPS
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'  // Ajusta según frontend/backend
  }
}));

// CORS
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:4000',  // Cambia si frontend está en otro lugar
  credentials: true
}));

app.use(express.json());

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Registro usuario
app.post('/api/register', async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existingUser = await Usuario.findOne({ correo });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ nombre, correo, password: hashedPassword });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    if (!correo || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await Usuario.findOne({ correo });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Guardar sesión
    req.session.user = { correo: user.correo, nombre: user.nombre, role: user.role };

    res.json({ message: 'Login exitoso', user: req.session.user, loggedIn: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Verificar sesión
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Cerrar sesión
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada' });
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});