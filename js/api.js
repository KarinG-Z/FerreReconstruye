'use strict';
window.FerreApi = (() => {
  const origenApi = location.hostname === '127.0.0.1' ? 'http://127.0.0.1:3000' : 'http://localhost:3000';
  const BASE = origenApi + '/api';

  async function pedir(ruta, opciones = {}) {
    let respuesta;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      respuesta = await fetch(BASE + ruta, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        credentials: 'include',
        ...opciones
      });
    } catch {
      throw new Error('No se pudo conectar con la API. Verifica que esté encendida (npm run api en la raíz del proyecto).');
    } finally { clearTimeout(timeout); }
    let datos;
    try { datos = await respuesta.json(); }
    catch { throw new Error('La API respondió algo inesperado (código ' + respuesta.status + '). Revisa la terminal de la API.'); }
    if (!respuesta.ok) throw new Error(datos.mensaje || 'Error en la API.');
    return datos;
  }

  const enviar = (ruta, method, datos) => pedir(ruta, { method, body: JSON.stringify(datos) });
  const usuarioRuta = id => '/usuarios/' + encodeURIComponent(id);
  return {
    registrar: datos => enviar('/registro', 'POST', datos),
    iniciarSesion: datos => enviar('/login', 'POST', datos),
    sesion: () => pedir('/sesion'),
    cerrarSesion: () => pedir('/logout', { method: 'POST' }),
    listarUsuarios: () => pedir('/usuarios'),
    crearUsuario: datos => enviar('/usuarios', 'POST', datos),
    actualizarUsuario: (id, datos) => enviar(usuarioRuta(id), 'PUT', datos),
    eliminarUsuario: id => pedir(usuarioRuta(id), { method: 'DELETE' }),
    listarProductos: () => pedir('/productos'),
    subirImagen: imagen => pedir('/imagenes', { method: 'POST', body: JSON.stringify({ imagen }) }),
    urlImagen: imagen => imagen?.startsWith('/imagenes/') ? origenApi + imagen : imagen,
     crearProducto: datos => pedir('/productos', { method: 'POST', body: JSON.stringify(datos) }),
     actualizarProducto: (id, datos) => pedir('/productos/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(datos) }),
     eliminarProducto: id => pedir('/productos/' + encodeURIComponent(id), { method: 'DELETE' })
    };  
})();
