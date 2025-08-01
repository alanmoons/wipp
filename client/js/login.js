document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Limpiar token viejo por seguridad
      localStorage.removeItem('token');

      // Guardar nuevo token
      localStorage.setItem('token', data.token);

      // Decodificar token de forma segura
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));

        if (payload.role && payload.role.toLowerCase() === 'admin') {
          window.location.replace('admin-dashboard.html');
        } else {
          window.location.replace('dashboard.html');
        }
      } catch (decodeError) {
        console.error('Error al decodificar token:', decodeError);
        document.getElementById('mensaje').textContent = 'Token inválido, inténtalo de nuevo.';
      }
    } else {
      document.getElementById('mensaje').textContent = data.error || 'Error en login';
    }
  } catch (error) {
    document.getElementById('mensaje').textContent = 'Error de conexión';
  }
});
