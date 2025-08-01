document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.replace('index.html');
    return;
  }

  const modulosBoxes = Array.from(document.querySelectorAll('.image-box'));

  function crearBotonAtras(contenedor, callback) {
    if (contenedor.querySelector('#btn-atras')) return;

    const boton = document.createElement('button');
    boton.id = 'btn-atras';
    boton.textContent = '← Atrás';
    boton.style.marginBottom = '15px';

    boton.addEventListener('click', () => {
      callback();
    });

    contenedor.prepend(boton);
  }

  modulosBoxes.forEach(box => {
    const img = box.querySelector('img');
    if (!img) return;

    img.addEventListener('click', async () => {
      const modulo = box.getAttribute('data-modulo');
      if (!modulo) return;

      // Ocultar todos excepto el que se clickeó
      modulosBoxes.forEach(m => {
        m.style.display = (m === box) ? 'block' : 'none';
      });

      // Contenedor para mostrar archivos dentro del módulo
      let archivosContainer = box.querySelector('.archivos-container');
      if (!archivosContainer) {
        archivosContainer = document.createElement('div');
        archivosContainer.className = 'archivos-container';
        archivosContainer.style.marginTop = '10px';
        box.appendChild(archivosContainer);
      }

      archivosContainer.style.display = 'block';
      archivosContainer.innerHTML = `<p>Cargando archivos de ${modulo}...</p>`;

      try {
        const res = await fetch(`http://localhost:4000/api/files/${modulo}`, {
          headers: { Authorization: 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Error al obtener archivos');

        const data = await res.json();
        const archivos = data.archivos || [];

        if (archivos.length === 0) {
          archivosContainer.innerHTML = `<p>No hay archivos para el módulo</p>`;
          crearBotonAtras(archivosContainer, () => {
            archivosContainer.style.display = 'none';
            modulosBoxes.forEach(m => m.style.display = 'block');
            archivosContainer.innerHTML = '';
          });
          return;
        }

        let currentIndex = 0;
        let vistoActual = false;

        const habilitarSiguiente = () => {
          const btnSiguiente = archivosContainer.querySelector('#btn-siguiente');
          if (!btnSiguiente) return;
          btnSiguiente.disabled = false;

          // Si es el último archivo cambia texto a "Finalizar"
          if (currentIndex === archivos.length - 1) {
            btnSiguiente.textContent = 'Finalizar';
            btnSiguiente.onclick = () => {
              archivosContainer.style.display = 'none';
              modulosBoxes.forEach(m => m.style.display = 'block');
              archivosContainer.innerHTML = '';
            };
          }
        };

        const renderArchivo = (index) => {
          const { nombre, url } = archivos[index];
          const ext = nombre.split('.').pop().toLowerCase();

          let contenido = '';
          vistoActual = false;

          if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
            contenido = `<img src="http://localhost:4000${url}" alt="${nombre}" style="max-width:100%;height:auto;border:1px solid #ccc;" />`;
            vistoActual = true; // imágenes consideradas vistas al mostrarse
          } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
            contenido = `<video id="video-archivo" controls style="max-width:100%;height:auto;border:1px solid #ccc;">
                          <source src="http://localhost:4000${url}" type="video/${ext}">
                          Tu navegador no soporta la reproducción de video.
                         </video>`;
          } else if (ext === 'pdf') {
            contenido = `<embed src="http://localhost:4000${url}" type="application/pdf" width="100%" height="500px" />`;
            vistoActual = true; // PDF se considera visto al mostrarse
          } else {
            contenido = `<a href="http://localhost:4000${url}" target="_blank" rel="noopener noreferrer">Abrir archivo</a>`;
            vistoActual = true; // enlaces considerados vistos
          }

          archivosContainer.innerHTML = `
  <div style="margin-bottom: 15px;">
    ${contenido}
  </div>
  <div class="boton-container">
    <button id="btn-anterior" ${index === 0 ? 'disabled' : ''}>← Anterior</button>
    <button id="btn-siguiente" disabled>Siguiente →</button>
  </div>
`;

          crearBotonAtras(archivosContainer, () => {
            archivosContainer.style.display = 'none';
            modulosBoxes.forEach(m => m.style.display = 'block');
            archivosContainer.innerHTML = '';
          });

          const btnAnterior = archivosContainer.querySelector('#btn-anterior');
          const btnSiguiente = archivosContainer.querySelector('#btn-siguiente');

          btnAnterior.onclick = () => {
            currentIndex--;
            renderArchivo(currentIndex);
          };

          btnSiguiente.onclick = () => {
            currentIndex++;
            renderArchivo(currentIndex);
          };

          // Manejar habilitación botón "Siguiente"
          if (vistoActual) {
            habilitarSiguiente();
          } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
            const video = archivosContainer.querySelector('#video-archivo');
            if (video) {
              btnSiguiente.disabled = true;
              video.onended = () => {
                vistoActual = true;
                habilitarSiguiente();
              };
              video.ontimeupdate = () => {
                if (video.currentTime > 3 && !btnSiguiente.disabled) return; // ya habilitado
                if (video.currentTime > 3) {
                  vistoActual = true;
                  habilitarSiguiente();
                }
              };
            }
          }
        };

        renderArchivo(currentIndex);

      } catch (error) {
        console.error('Error al cargar archivos:', error);
        archivosContainer.innerHTML = '<p>Error al cargar archivos</p>';
        crearBotonAtras(archivosContainer, () => {
          archivosContainer.style.display = 'none';
          modulosBoxes.forEach(m => m.style.display = 'block');
          archivosContainer.innerHTML = '';
        });
      }
    });
  });

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.replace('index.html');
    });
  }
});
