document.addEventListener('DOMContentLoaded', () => {
  const btnRegistrarse = document.getElementById('btnRegistrarse');
  const btnIniciarSesion = document.getElementById('btnIniciarSesion');
  const pantallaPrincipal = document.getElementById('pantalla-principal');
  const formularioRegistro = document.getElementById('formulario-registro');
  const formularioLogin = document.getElementById('formulario-login');
  const mensaje = document.getElementById('mensaje');

  // **1. Detectar token y redirigir si ya está logueado**
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role.toLowerCase() === 'admin') {
        window.location.replace('admin-dashboard.html');
        return;
      } else {
        window.location.replace('dashboard.html');
        return;
      }
    } catch (e) {
      // Token inválido o corrupto, eliminar
      localStorage.removeItem('token');
    }
  }

  // Mostrar formulario de registro
  btnRegistrarse.addEventListener('click', () => {
    pantallaPrincipal.classList.add('oculto');
    formularioLogin.classList.add('oculto');
    formularioRegistro.classList.remove('oculto');
    mensaje.textContent = '';
  });

  // Mostrar formulario de login
  btnIniciarSesion.addEventListener('click', () => {
    pantallaPrincipal.classList.add('oculto');
    formularioRegistro.classList.add('oculto');
    formularioLogin.classList.remove('oculto');
    mensaje.textContent = '';
  });

  // Botón "Atrás" en registro
  const btnAtrasRegistro = document.getElementById('btnAtrasRegistro');
  btnAtrasRegistro.addEventListener('click', () => {
    formularioRegistro.classList.add('oculto');
    pantallaPrincipal.classList.remove('oculto');
    mensaje.textContent = '';
  });

  // Botón "Atrás" en login
  const btnAtrasLogin = document.getElementById('btnAtrasLogin');
  btnAtrasLogin.addEventListener('click', () => {
    formularioLogin.classList.add('oculto');
    pantallaPrincipal.classList.remove('oculto');
    mensaje.textContent = '';
  });

  // Manejar registro
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('https://landingwipp1.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword })
      });

      const data = await response.json();
      alert(data.message);
      e.target.reset();
      pantallaPrincipal.classList.remove('oculto');
      formularioRegistro.classList.add('oculto');
      mensaje.textContent = '';
    } catch {
      alert('Error al registrar');
    }
  });

  // Manejar login
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch('https://landingwipp1.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token para mantener sesión
        if (data.token) localStorage.setItem('token', data.token);
        e.target.reset();

        // Redirigir según rol decodificado del token
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        if (payload.role.toLowerCase() === 'admin') {
          window.location.replace('admin-dashboard.html');
        } else {
          window.location.replace('dashboard.html');
        }
      } else {
        mensaje.textContent = data.error || 'Error al iniciar sesión';
      }
    } catch {
      mensaje.textContent = 'Error de conexión al iniciar sesión';
    }
  });
});

