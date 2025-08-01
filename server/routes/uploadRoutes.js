// server/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const modulo = req.body.modulo;
    const dir = path.join(__dirname, '../../uploads', modulo);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('archivo'), (req, res) => {
  res.json({ mensaje: 'Archivo subido', archivo: req.file });
});

module.exports = router;