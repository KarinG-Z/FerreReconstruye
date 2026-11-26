'use strict';
const continuarCotizacionPublica = new URLSearchParams(location.search).get('continuar') === 'cotizaciones';
if (new URLSearchParams(location.search).get('registro') === 'ok') Ferre.mensaje('Cuenta creada. Ya puedes iniciar sesión.');
else if (continuarCotizacionPublica) Ferre.mensaje('Inicia sesión para continuar con los productos que seleccionaste en la tienda.');
const enlaceRegistroPublico = document.querySelector('a[href^="registro.html"]');
if (continuarCotizacionPublica && enlaceRegistroPublico) enlaceRegistroPublico.href = 'registro.html?continuar=cotizaciones';
document.getElementById('formulario').addEventListener('submit', async event => {
  event.preventDefault();
  const boton = event.submitter;
  boton.disabled = true;
  try {
    const datos = Object.fromEntries(new FormData(event.target));
    await FerreApi.iniciarSesion({ correo: datos.correo, password: datos.password });
    location.replace(continuarCotizacionPublica ? 'cotizaciones.html?desde=tienda' : 'dashboard.html');
  } catch (e) { Ferre.mensaje(e.message, true); }
  finally { boton.disabled = false; }
});
