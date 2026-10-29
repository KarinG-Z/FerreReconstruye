'use strict';
window.usuarioActual = null;
function comprobarSesion() {
  try {
    window.usuarioActual = Ferre.sesion();
    if (!usuarioActual) { location.replace(document.body.dataset.pagina === 'cotizaciones' ? 'login.html?continuar=cotizaciones' : 'login.html'); return; }
    Ferre.guardarSesion(usuarioActual);
    document.getElementById('nombreSesion').textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    document.getElementById('rolSesion').textContent = usuarioActual.rol;
    document.querySelectorAll('[data-admin]').forEach(n => n.hidden = usuarioActual.rol !== 'Administrador');
    if (document.body.dataset.pagina === 'usuarios' && usuarioActual.rol !== 'Administrador') { location.replace('dashboard.html'); return; }
    document.body.classList.remove('verificando');
  } catch (e) { Ferre.mensaje(e.message, true); }
}
comprobarSesion();
document.getElementById('cerrarSesion').addEventListener('click', Ferre.salir);
window.addEventListener('pageshow', comprobarSesion);
window.addEventListener('storage', event => {
  if (['usuarioSesion', 'usuarios', null].includes(event.key)) comprobarSesion();
});
