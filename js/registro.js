'use strict';
document.getElementById('formulario').addEventListener('submit', async event => {
  event.preventDefault();
  const boton = event.submitter;
  boton.disabled = true;
  try {
    const datos = Object.fromEntries(new FormData(event.target));
    FerreDatos.exigir(datos.password === datos.confirmacion, 'Las contraseñas no coinciden.');
    let usuarios = Ferre.leer('usuarios');
    const usuario = FerreDatos.validarUsuario(datos, usuarios);
    const credencial = await Ferre.credencial(datos.password);
    // Volver a leer después de la operación asíncrona evita sobrescribir cambios recientes.
    usuarios = Ferre.leer('usuarios');
    FerreDatos.validarUsuario(datos, usuarios);
    Ferre.guardar('usuarios', [...usuarios, { ...usuario, id: crypto.randomUUID(), credencial }]);
    location.href = 'login.html?registro=ok';
  } catch (e) { Ferre.mensaje(e.message, true); }
  finally { boton.disabled = false; }
});
