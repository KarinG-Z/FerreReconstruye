'use strict';
window.FerreApi = (() => {
  const BASE = 'http://localhost:3000/api';

  async function pedir(ruta, opciones = {}) {
    let respuesta;
    try {
      respuesta = await fetch(BASE + ruta, {
        headers: { 'Content-Type': 'application/json' },
        ...opciones
      });
    } catch {
      throw new Error('No se pudo conectar con la API. Verifica que esté encendida (npm run dev en la carpeta api).');
    }
    let datos;
    try { datos = await respuesta.json(); }
    catch { throw new Error('La API respondió algo inesperado (código ' + respuesta.status + '). Revisa la terminal de la API.'); }
    if (!respuesta.ok) throw new Error(datos.mensaje || 'Error en la API.');
    return datos;
  }

    return {
    listarProductos: () => pedir('/productos'),
     crearProducto: datos => pedir('/productos', { method: 'POST', body: JSON.stringify(datos) }),
     actualizarProducto: (id, datos) => pedir('/productos/' + id, { method: 'PUT', body: JSON.stringify(datos) })
    };  
})();