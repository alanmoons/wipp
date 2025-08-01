document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.replace('index.html');
    return;
  }

  fetch('http://localhost:4000/api/session', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (!res.ok) throw new Error('No autorizado');
      return res.json();
    })
    .then(data => {
      if (!data.loggedIn || data.user.role.toLowerCase() !== 'admin') {
        localStorage.removeItem('token');
        window.location.replace('index.html');
        return;
      }

      // Logout
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('token');
          window.location.replace('index.html');
        });
      }

      const boxes = document.querySelectorAll('.image-box img');
      const contenidoModulo = document.querySelector('#contenido-modulo');
      const body = document.body;

      // Función para abrir módulo y mostrar pantalla completa
      async function abrirModulo(modulo) {
        contenidoModulo.innerHTML = `<p>Cargando archivos de ${modulo}...</p>`;

        try {
          const res = await fetch(`http://localhost:4000/api/files/${modulo}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });

          if (!res.ok) throw new Error('Error al obtener archivos');
          const data = await res.json();
          const archivos = data.archivos || [];

          // HTML para botón cerrar con clase .btn-red
          let html = `
            <button id="cerrarModuloBtn" class="btn-red" style="align-self: flex-end; margin-bottom: 10px;">Cerrar módulo</button>
            <form id="uploadFormModulo" style="margin-bottom: 20px;">
              <input type="hidden" name="modulo" value="${modulo}" />
              <label>Archivo:</label>
              <input type="file" name="archivo" required />
              <button type="submit">Subir archivo</button>
            </form>
            <hr />
            <h3 class="titulo-modulo">Archivos del módulo</h3>
          `;

          if (archivos.length === 0) {
          html += `<p class="sin-archivos">No hay archivos para este módulo.</p>`;
          } else {
            archivos.forEach(({ nombre, url }) => {
              const ext = nombre.split('.').pop().toLowerCase();
              let contenido = '';

              // Contenedor relativo para posicionar botón fullscreen
              if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
                contenido = `
                  <div style="position: relative;">
                    <img id="content-${nombre}" src="http://localhost:4000${url}" alt="${nombre}" style="max-width: 100%; margin-bottom: 10px; border: 1px solid #ccc;" />
                    <button class="btn-fullscreen" data-target-id="content-${nombre}">Pantalla completa</button>
                  </div>
                `;
              } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
                contenido = `
                  <div style="position: relative;">
                    <video id="content-${nombre}" controls style="max-width: 100%; margin-bottom: 10px; border: 1px solid #ccc;">
                      <source src="http://localhost:4000${url}" type="video/${ext}" />
                      Tu navegador no soporta video.
                    </video>
                    <button class="btn-fullscreen" data-target-id="content-${nombre}">Pantalla completa</button>
                  </div>
                `;
              } else if (ext === 'pdf') {
                contenido = `
                  <div style="position: relative;">
                    <embed id="content-${nombre}" src="http://localhost:4000${url}" type="application/pdf" width="100%" height="300px" style="margin-bottom: 10px;" />
                    <button class="btn-fullscreen" data-target-id="content-${nombre}">Pantalla completa</button>
                  </div>
                `;
              } else {
                contenido = `<a href="http://localhost:4000${url}" target="_blank" rel="noopener noreferrer">${nombre}</a>`;
              }

              html += `
                <div class="archivo-item" style="margin-bottom: 15px;">
                  ${contenido}
                  <br />
                  <button class="btn-delete" data-modulo="${modulo}" data-filename="${nombre}" style="padding: 5px 10px; cursor: pointer;">Eliminar</button>
                </div>
              `;
            });
          }

          contenidoModulo.innerHTML = html;

          // Activar modo fullscreen
          body.classList.add('fullscreen-module');

          // Manejar cierre módulo
          const cerrarBtn = document.getElementById('cerrarModuloBtn');
          cerrarBtn.addEventListener('click', () => {
            body.classList.remove('fullscreen-module');
            contenidoModulo.innerHTML = '';
            // Mostrar todas las imágenes
            boxes.forEach(img => {
              img.parentElement.style.display = 'block';
            });
          });

          // Manejar subida archivos
          const uploadFormModulo = document.getElementById('uploadFormModulo');
          uploadFormModulo.addEventListener('submit', async e => {
            e.preventDefault();
            const formData = new FormData(uploadFormModulo);

            try {
              const resUpload = await fetch('http://localhost:4000/api/upload', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token
                },
                body: formData
              });

              const dataUpload = await resUpload.json();
              alert(dataUpload.mensaje || 'Archivo subido correctamente.');

              // Recargar módulo para actualizar archivos
              abrirModulo(modulo);

            } catch (error) {
              console.error('Error al subir archivo:', error);
              alert('Error al subir archivo.');
            }
          });

          // Manejar eliminación archivos
          contenidoModulo.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
              const filename = btn.getAttribute('data-filename');
              if (!confirm(`¿Eliminar archivo ${filename}?`)) return;

              try {
                const resDelete = await fetch(`http://localhost:4000/api/files/${modulo}/${filename}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': 'Bearer ' + token }
                });

                if (!resDelete.ok) throw new Error('Error al eliminar archivo');
                alert('Archivo eliminado correctamente.');

                // Recargar lista archivos
                abrirModulo(modulo);

              } catch (error) {
                console.error('Error al eliminar archivo:', error);
                alert('Error al eliminar archivo.');
              }
            });
          });

          // BOTONES DE PANTALLA COMPLETA
          contenidoModulo.querySelectorAll('.btn-fullscreen').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetId = btn.getAttribute('data-target-id');
              const elem = document.getElementById(targetId);

              if (!elem) {
                alert('Elemento no encontrado para pantalla completa.');
                return;
              }

              if (elem.requestFullscreen) {
                elem.requestFullscreen();
              } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
              } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
              } else {
                alert('Tu navegador no soporta pantalla completa.');
              }
            });
          });

        } catch (error) {
          console.error('Error al cargar archivos:', error);
          contenidoModulo.innerHTML = `<p>Error al cargar archivos.</p>`;
        }
      }

      // Evento clic para abrir módulos
      boxes.forEach(img => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('src');
          const match = src.match(/recuadro(\d+)\.png$/);
          if (!match) return;
          const modulo = 'modulo' + match[1];
          abrirModulo(modulo);
        });
      });

    })
    .catch(error => {
      console.error('Error verificando sesión admin:', error);
      localStorage.removeItem('token');
      window.location.replace('index.html');
    });
});
