// server/emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function enviarCorreoBienvenida(destinatario, nombre) {
  const mailOptions = {
    from: `"Mi Plataforma" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: "¡Bienvenido a la plataforma!",
    html: `
      <h2>Hola ${nombre},</h2>
      <p>Gracias por registrarte. Tu cuenta ha sido creada exitosamente.</p>
      <p>Saludos,<br>El equipo</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  enviarCorreoBienvenida,
};