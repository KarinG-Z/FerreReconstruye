'use strict';
window.FerreApi = (() => {
  const BASE = 'http://localhost:3000/api';

  async function pedir(ruta, opciones = {}) {
    let respuesta;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      respuesta = await fetch(BASE + ruta, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        ...opciones
      });
    } catch {
      throw new Error('No se pudo conectar con la API. Verifica que esté encendida (npm run dev en la carpeta api).');
    } finally { clearTimeout(timeout); }
    let datos;
    try { datos = await respuesta.json(); }
    catch { throw new Error('La API respondió algo inesperado (código ' + respuesta.status + '). Revisa la terminal de la API.'); }
    if (!respuesta.ok) throw new Error(datos.mensaje || 'Error en la API.');
    return datos;
  }

    return {
    listarProductos: () => pedir('/productos'),
    subirImagen: imagen => pedir('/imagenes', { method: 'POST', body: JSON.stringify({ imagen }) }),
    urlImagen: imagen => imagen?.startsWith('/imagenes/') ? 'http://localhost:3000' + imagen : imagen,
     crearProducto: datos => pedir('/productos', { method: 'POST', body: JSON.stringify(datos) }),
     actualizarProducto: (id, datos) => pedir('/productos/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(datos) }),
     eliminarProducto: id => pedir('/productos/' + encodeURIComponent(id), { method: 'DELETE' })
    };  
})();
