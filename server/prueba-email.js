const enviarCorreo = require('./mailer');

async function testEmail() {
  try {
    await enviarCorreo({
      to: 'alanmessi2@gmail.com',
      subject: 'Prueba de correo desde Brevo SMTP',
      html: '<p>Este es un correo de prueba enviado con Brevo y Nodemailer.</p>'
    });
    console.log('Correo enviado correctamente');
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
}

testEmail();