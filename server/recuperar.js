document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRecuperar");
  const mensaje = document.getElementById("mensaje");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();

    if (!email) {
      mensaje.textContent = "Por favor ingresa tu correo.";
      return;
    }

    try {
      const res = await fetch("/api/recuperar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      mensaje.textContent = data.message || "Correo enviado (si el email existe).";
    } catch (err) {
      console.error(err);
      mensaje.textContent = "Ocurrió un error. Intenta más tarde.";
    }
  });
});