'use strict';
window.Ferre = (() => {
  const { exigir } = FerreDatos;
  function leer(clave) {
    try {
      const valor = localStorage.getItem(clave);
      if (!valor) return [];
      const datos = JSON.parse(valor);
      exigir(Array.isArray(datos) && datos.every(x => x && typeof x === 'object' && typeof x.id === 'string'), `Los datos de ${clave} no son compatibles. No se han sobrescrito.`);
      return datos;
    } catch (e) { throw new Error(`No se pudo leer ${clave}. ${e.message}`); }
  }
  function guardar(clave, datos) {
    try { localStorage.setItem(clave, JSON.stringify(datos)); }
    catch { throw new Error('No se pudo guardar. Revisa el espacio disponible y los permisos de almacenamiento del navegador.'); }
  }
  function mensaje(texto, error = false) {
    const nodo = document.getElementById('mensaje');
    if (!nodo) return;
    nodo.textContent = texto;
    nodo.className = 'mensaje ' + (error ? 'error' : 'exito');
    nodo.setAttribute('role', error ? 'alert' : 'status');
  }
  const hex = bytes => Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
  async function derivar(password, sal) {
    const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(sal), iterations: 210000, hash: 'SHA-256' }, clave, 256);
    return hex(new Uint8Array(bits));
  }
  async function credencial(password) {
    exigir(typeof password === 'string' && password.length >= 8 && password.length <= 128, 'La contraseña debe tener entre 8 y 128 caracteres.');
    exigir(!!globalThis.crypto?.subtle, 'Abre la aplicación desde http://localhost para usar el registro seguro.');
    const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
    return { sal, hash: await derivar(password, sal), algoritmo: 'PBKDF2-SHA256', iteraciones: 210000 };
  }
  async function verificar(password, usuario) {
    if (!usuario.credencial?.sal || !usuario.credencial?.hash) return false;
    return await derivar(password, usuario.credencial.sal) === usuario.credencial.hash;
  }
  function sesion() {
    let s;
    try { s = JSON.parse(localStorage.getItem('usuarioSesion') || 'null'); }
    catch { localStorage.removeItem('usuarioSesion'); return null; }
    if (!s) return null;
    const actual = leer('usuarios').find(u => u.id === s.id && u.estado === 'Activo');
    if (!actual) { localStorage.removeItem('usuarioSesion'); return null; }
    return actual;
  }
  function guardarSesion(u) { guardar('usuarioSesion', { id: u.id, nombre: u.nombre, apellido: u.apellido, rol: u.rol, correo: u.correo }); }
  function salir() { localStorage.removeItem('usuarioSesion'); location.replace('login.html'); }
  const dinero = valor => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(valor);
  return { leer, guardar, mensaje, credencial, verificar, sesion, guardarSesion, salir, dinero };
})();
