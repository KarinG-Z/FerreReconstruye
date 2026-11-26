'use strict';
async function resumen() {
  if (!usuarioActual) return;
  try {
    const productos = (await FerreApi.listarProductos()).productos;
    const activos = productos.filter(p => p.estado === 'Activo');
    document.getElementById('bienvenida').textContent = `Hola, ${usuarioActual.nombre}.`;
    document.getElementById('totalProductos').textContent = productos.length;
    document.getElementById('stockBajo').textContent = activos.filter(p => p.cantidad <= 5).length;
    document.getElementById('valorInventario').textContent = Ferre.dinero(activos.reduce((s, p) => s + p.precio * p.cantidad, 0));
    document.getElementById('totalUsuarios').textContent = usuarioActual.rol === 'Administrador' ? (await FerreApi.listarUsuarios()).total : '—';
  } catch (e) { Ferre.mensaje(e.message, true); }
}

ferreSesionLista.then(resumen);

window.addEventListener('storage', resumen);
