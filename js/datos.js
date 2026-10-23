(function (root) {
  'use strict';
  const roles = ['Administrador', 'Usuario'];
  const estados = ['Activo', 'Inactivo'];
  function exigir(condicion, mensaje) { if (!condicion) throw new Error(mensaje); }
  function texto(valor) { return String(valor ?? '').trim(); }
  function correo(valor) { return texto(valor).toLowerCase(); }
  function validarUsuario(datos, usuarios, id) {
    const u = { nombre: texto(datos.nombre), apellido: texto(datos.apellido), correo: correo(datos.correo), rol: datos.rol, estado: datos.estado || 'Activo' };
    exigir(u.nombre.length >= 2 && u.apellido.length >= 2, 'Nombre y apellido deben tener al menos 2 caracteres.');
    exigir(u.nombre.length <= 60 && u.apellido.length <= 60, 'Nombre y apellido admiten hasta 60 caracteres.');
    exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.correo), 'Ingresa un correo electrónico válido.');
    exigir(!usuarios.some(x => x.id !== id && correo(x.correo) === u.correo), 'El correo ya está registrado.');
    exigir(roles.includes(u.rol) && estados.includes(u.estado), 'Selecciona un rol y estado válidos.');
    return u;
  }
  function validarProducto(datos, productos, id) {
    const p = { codigo: texto(datos.codigo).toUpperCase(), nombre: texto(datos.nombre), categoria: texto(datos.categoria), precio: Number(datos.precio), cantidad: Number(datos.cantidad), estado: datos.estado };
    exigir(p.codigo.length >= 2 && p.codigo.length <= 24, 'El código debe tener entre 2 y 24 caracteres.');
    exigir(!productos.some(x => x.id !== id && x.codigo.toUpperCase() === p.codigo), 'Ya existe un producto con ese código.');
    exigir(p.nombre.length >= 2 && p.nombre.length <= 100, 'El nombre debe tener entre 2 y 100 caracteres.');
    exigir(['Herramientas', 'Construcción', 'Electricidad', 'Plomería', 'Pinturas', 'Seguridad'].includes(p.categoria), 'Selecciona una categoría válida.');
    exigir(texto(datos.precio) !== '' && Number.isFinite(p.precio) && p.precio >= 0 && p.precio <= 1e10 && Math.abs(p.precio * 100 - Math.round(p.precio * 100)) < 0.001, 'Ingresa un precio válido, con hasta dos decimales.');
    exigir(texto(datos.cantidad) !== '' && Number.isSafeInteger(p.cantidad) && p.cantidad >= 0 && p.cantidad <= 1e7, 'Las existencias deben ser un número entero entre 0 y 10.000.000.');
    exigir(estados.includes(p.estado), 'Selecciona un estado válido.');
    return p;
  }
  const api = { exigir, texto, correo, validarUsuario, validarProducto };
  root.FerreDatos = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
