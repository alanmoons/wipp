const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const enviarCorreo = require('./mailer');
const config = require('./config');  // Importas configuración

const app = express();

const PORT = config.PORT;
const JWT_SECRET = config.JWT_SECRET || 'mi_secreto_seguro_jwt'; // Por si acaso
const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN || '1d';            // Por si acaso

// CORS
app.use(cors(config.CORS_OPTIONS));

app.use(session({
  ...config.SESSION_OPTIONS,
  store: MongoStore.create({ mongoUrl: config.MONGODB_URI }),
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, default: 'user' }
});
const User = mongoose.model('User', UserSchema);

// Crear admin
app.post('/api/create-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({ email, password: hashedPassword, role: 'admin' });
    await adminUser.save();

    res.status(201).json({ message: 'Usuario admin creado correctamente' });
  } catch (error) {
    console.error('❌ Error en /api/create-admin:', error);
    res.status(500).json({ error: 'Error al crear usuario admin' });
  }
});

// Registro de usuario
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('❌ Error en /api/register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    console.error('❌ Error en /api/login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mal formado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
}

// Validar sesión
app.get('/api/session', authenticateToken, (req, res) => {
  res.json({ loggedIn: true, user: req.user });
});

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const modulo = req.body.modulo || 'general';
    const dir = path.join(__dirname, '../uploads', modulo);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Subida de archivos (solo admin)
app.post('/api/upload', authenticateToken, upload.single('archivo'), (req, res) => {
  if (req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado, solo admin' });
  }

  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  res.status(200).json({
    mensaje: 'Archivo subido exitosamente',
    archivo: {
      nombre: req.file.filename,
      ruta: `/uploads/${req.body.modulo}/${req.file.filename}`
    }
  });
});

// Listar archivos por módulo (requiere token)
app.get('/api/files/:modulo', authenticateToken, (req, res) => {
  const modulo = req.params.modulo;
  const dir = path.join(__dirname, '../uploads', modulo);

  if (!fs.existsSync(dir)) {
    return res.json({ archivos: [] });
  }

  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error leyendo archivos' });
    }

    const archivos = files.map(file => ({
      nombre: file,
      url: `/uploads/${modulo}/${file}`
    }));

    res.json({ archivos });
  });
});

// Eliminar archivo (solo admin)
app.delete('/api/files/:modulo/:filename', authenticateToken, (req, res) => {
  if (req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado, solo admin' });
  }

  const { modulo, filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', modulo, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ error: 'Error al eliminar archivo' });
    res.json({ mensaje: 'Archivo eliminado' });
  });
});

// Servir archivos subidos públicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir frontend (client)
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});
app.get('/olvide-password', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'olvide-password.html'));
});

// --- RUTAS DE ENVÍO DE CORREO ---

// Enviar correo de registro exitoso
app.post("/api/send-register-email", async (req, res) => {
  const { email, nombre } = req.body;

  try {
    await enviarCorreo({
      to: email,
      subject: "¡Registro exitoso!",
      html: `<p>Hola ${nombre}, gracias por registrarte. Ya puedes acceder a los cursos.</p>`
    });

    res.json({ ok: true, mensaje: "Correo de bienvenida enviado" });
  } catch (err) {
    console.error("❌ Error enviando correo de registro:", err);
    res.status(500).json({ ok: false, mensaje: "Error al enviar el correo" });
  }
});

// Enviar correo para recuperación de contraseña
app.post("/api/recuperar", async (req, res) => {
  const { email, token } = req.body;
  const link = `https://tusitio.com/reset/${token}`;

  try {
    await enviarCorreo({
      to: email,
      subject: "Recuperación de contraseña",
      html: `<p>Haz clic aquí para restablecer tu contraseña: <a href="${link}">${link}</a></p>`
    });

    res.json({ ok: true, mensaje: "Correo de recuperación enviado" });
  } catch (err) {
    console.error("❌ Error enviando correo de recuperación:", err);
    res.status(500).json({ ok: false, mensaje: "Error al enviar el correo" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
