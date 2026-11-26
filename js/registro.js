'use strict';
const enlaceIngresoPublico = document.querySelector('a[href="login.html"]');
if (enlaceIngresoPublico && new URLSearchParams(location.search).get('continuar') === 'cotizaciones') enlaceIngresoPublico.href = 'login.html?continuar=cotizaciones';
document.getElementById('formulario').addEventListener('submit', async event => {
  event.preventDefault();
  const boton = event.submitter;
  boton.disabled = true;
  try {
    const datos = Object.fromEntries(new FormData(event.target));
    FerreDatos.exigir(datos.password === datos.confirmacion, 'Las contraseñas no coinciden.');
    await FerreApi.registrar(datos);
    location.href = 'login.html?registro=ok' + (new URLSearchParams(location.search).get('continuar') === 'cotizaciones' ? '&continuar=cotizaciones' : '');
  } catch (e) { Ferre.mensaje(e.message, true); }
  finally { boton.disabled = false; }
});
