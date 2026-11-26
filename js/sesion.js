'use strict';
window.usuarioActual = null;

async function comprobarSesion() {
  try {
    window.usuarioActual = (await FerreApi.sesion()).usuario;
    if (!usuarioActual) {
      location.replace(document.body.dataset.pagina === 'cotizaciones' ? 'login.html?continuar=cotizaciones' : 'login.html');
      return null;
    }
    document.getElementById('nombreSesion').textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    document.getElementById('rolSesion').textContent = usuarioActual.rol;
    document.querySelectorAll('[data-admin]').forEach(n => n.hidden = usuarioActual.rol !== 'Administrador');
    if (document.body.dataset.pagina === 'usuarios' && usuarioActual.rol !== 'Administrador') {
      location.replace('dashboard.html');
      return null;
    }
    document.body.classList.remove('verificando');
    return usuarioActual;
  } catch (error) {
    window.usuarioActual = null;
    document.body.classList.remove('verificando');
    Ferre.mensaje(error.message, true);
    return null;
  }
}

window.ferreSesionLista = comprobarSesion();
document.getElementById('cerrarSesion').addEventListener('click', async () => {
  try {
    await FerreApi.cerrarSesion();
    window.usuarioActual = null;
    location.replace('login.html');
  } catch (error) { Ferre.mensaje(error.message, true); }
});
window.addEventListener('pageshow', event => {
  if (event.persisted) comprobarSesion();
});
