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
    const usuario = Ferre.leer('usuarios').find(u => FerreDatos.correo(u.correo) === FerreDatos.correo(datos.correo));
    FerreDatos.exigir(usuario && await Ferre.verificar(datos.password, usuario), 'Correo o contraseña incorrectos.');
    const actual = Ferre.leer('usuarios').find(u => u.id === usuario.id);
    FerreDatos.exigir(actual?.estado === 'Activo', 'El usuario está inactivo. Solicita su activación al administrador.');
    Ferre.guardarSesion(actual);
    location.replace(continuarCotizacionPublica ? 'cotizaciones.html?desde=tienda' : 'dashboard.html');
  } catch (e) { Ferre.mensaje(e.message, true); }
  finally { boton.disabled = false; }
});
