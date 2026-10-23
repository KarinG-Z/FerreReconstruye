const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const datos = require('../js/datos.js');
function entorno() {
  const mapa = new Map();
  const c = { FerreDatos: datos, TextEncoder, crypto: webcrypto, document: { getElementById: () => null }, localStorage: { getItem: k => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, v), removeItem: k => mapa.delete(k) } };
  c.window = c; vm.createContext(c); vm.runInContext(fs.readFileSync(require.resolve('../js/almacen.js'), 'utf8'), c); return { f: c.Ferre, mapa, c };
}
test('credencial usa sal aleatoria y verifica contraseña sin guardarla', async () => {
  const { f } = entorno(); const password = 'Prueba-2026';
  const a = await f.credencial(password); const b = await f.credencial(password);
  assert.notEqual(a.sal, b.sal); assert.notEqual(a.hash, b.hash); assert.equal(JSON.stringify(a).includes(password), false);
  assert.equal(await f.verificar(password, { credencial: a }), true); assert.equal(await f.verificar('incorrecta', { credencial: a }), false);
  await assert.rejects(f.credencial('123'), /8 y 128/);
});
test('sesión omite credencial y valida usuario activo en cada lectura', () => {
  const { f, mapa } = entorno(); const u = { id: '1', nombre: 'Ana', apellido: 'Prueba', correo: 'a@example.test', rol: 'Administrador', estado: 'Activo', credencial: { hash: 'secreto' } };
  f.guardar('usuarios', [u]); f.guardarSesion(u);
  assert.equal(mapa.get('usuarioSesion').includes('credencial'), false); assert.equal(f.sesion().id, '1');
  f.guardar('usuarios', [{ ...u, estado: 'Inactivo' }]); assert.equal(f.sesion(), null); assert.equal(mapa.has('usuarioSesion'), false);
});
test('sesión eliminada o malformada impide acceso', () => {
  const { f, mapa } = entorno(); mapa.set('usuarioSesion', 'no es json'); assert.equal(f.sesion(), null);
  f.guardarSesion({ id: 'inexistente' }); assert.equal(f.sesion(), null);
});
test('datos corruptos se reportan sin sobrescribirlos', () => {
  const { f, mapa } = entorno(); mapa.set('usuarios', 'no es json'); assert.throws(() => f.leer('usuarios'), /No se pudo leer/); assert.equal(mapa.get('usuarios'), 'no es json');
  mapa.set('productos', '{}'); assert.throws(() => f.leer('productos'), /compatibles/);
});
test('error de almacenamiento se comunica al usuario', () => {
  const { f, c } = entorno(); c.localStorage.setItem = () => { throw Error('quota') }; assert.throws(() => f.guardar('productos', []), /No se pudo guardar/);
});
