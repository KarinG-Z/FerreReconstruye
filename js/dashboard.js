'use strict';
function resumen() {
  if (!usuarioActual) return;
  try {
    const productos = Ferre.leer('productos');
    const activos = productos.filter(p => p.estado === 'Activo');
    document.getElementById('bienvenida').textContent = `Hola, ${usuarioActual.nombre}.`;
    document.getElementById('totalProductos').textContent = productos.length;
    document.getElementById('stockBajo').textContent = activos.filter(p => p.cantidad <= 5).length;
    document.getElementById('valorInventario').textContent = Ferre.dinero(activos.reduce((s, p) => s + p.precio * p.cantidad, 0));
    document.getElementById('totalUsuarios').textContent = Ferre.leer('usuarios').length;
  } catch (e) { Ferre.mensaje(e.message, true); }
}
resumen();
window.addEventListener('storage', resumen);
