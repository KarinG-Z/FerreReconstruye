const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarUsuario, validarProducto } = require('../js/datos.js');
const u = { nombre: 'Ana', apellido: 'Prueba', correo: ' ANA@example.test ', rol: 'Administrador', estado: 'Activo' };
const p = { codigo: ' her-001 ', nombre: 'Taladro', categoria: 'Herramientas', precio: '150000.50', cantidad: '3', estado: 'Activo' };
test('normaliza correo y nombres', () => assert.equal(validarUsuario(u, []).correo, 'ana@example.test'));
test('rechaza correo duplicado sin distinguir mayúsculas', () => assert.throws(() => validarUsuario(u, [{ ...u, id: '1', correo: 'ana@example.test' }]), /registrado/));
test('permite conservar correo durante edición', () => assert.equal(validarUsuario(u, [{ ...u, id: '1' }], '1').nombre, 'Ana'));
test('valida nombre, correo, rol y estado', () => {
  for (const cambio of [{ nombre: ' ' }, { apellido: 'a' }, { correo: 'no-valido' }, { rol: 'Otro' }, { estado: 'Otro' }]) assert.throws(() => validarUsuario({ ...u, ...cambio }, []));
});
test('normaliza productos y convierte cantidades', () => assert.deepEqual(validarProducto(p, []), { ...p, codigo: 'HER-001', precio: 150000.5, cantidad: 3 }));
test('rechaza códigos duplicados', () => assert.throws(() => validarProducto(p, [{ ...p, id: '1', codigo: 'HER-001' }]), /código/));
test('edición conserva código propio', () => assert.equal(validarProducto(p, [{ ...p, id: '1' }], '1').codigo, 'HER-001'));
test('rechaza precio negativo, vacío, no finito o con más de dos decimales', () => {
  for (const precio of ['-1', '', 'NaN', 'Infinity', '1.234']) assert.throws(() => validarProducto({ ...p, precio }, []));
});
test('rechaza existencias negativas, fraccionarias, vacías y enormes', () => {
  for (const cantidad of ['-1', '1.1', '', '99999999999999']) assert.throws(() => validarProducto({ ...p, cantidad }, []));
});
test('acepta cero precio y cero existencias', () => assert.equal(validarProducto({ ...p, precio: '0', cantidad: '0' }, []).cantidad, 0));
test('rechaza categorías y estados desconocidos', () => {
  assert.throws(() => validarProducto({ ...p, categoria: 'Otra' }, [])); assert.throws(() => validarProducto({ ...p, estado: 'Otro' }, []));
});
