const { randomUUID, randomBytes, pbkdf2, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const pool = require('../database');
const { fallo, transaccion, validar } = require('./mysql');
const { validarUsuario, correo } = require('../../js/datos');
const derivar = promisify(pbkdf2);
const algoritmo = 'PBKDF2-SHA256';
const iteraciones = 210000;

const perfil = `SELECT u.id_usuario AS id, u.nombre, u.apellido, u.correo, r.nombre AS rol, u.estado
  FROM usuarios u JOIN roles r USING (id_rol)`;

async function credencial(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw fallo(400, 'La contraseña debe tener entre 8 y 128 caracteres.');
  }
  const sal = randomBytes(16).toString('hex');
  const hash = await derivar(password, sal, iteraciones, 32, 'sha256');
  return [hash.toString('hex'), sal, algoritmo, iteraciones];
}

async function autenticar(email, password) {
  const denegado = () => fallo(401, 'Correo o contraseña incorrectos, o usuario inactivo.');
  if (typeof password !== 'string' || password.length > 128) throw denegado();
  const [[u]] = await pool.execute(`SELECT u.*, r.nombre AS rol FROM usuarios u
    JOIN roles r USING (id_rol) WHERE u.correo = ?`, [correo(email)]);
  if (!u || u.estado !== 'Activo' || u.credencial_algoritmo !== algoritmo ||
      u.credencial_iteraciones !== iteraciones || !u.credencial_salt ||
      !/^[a-f0-9]{64}$/i.test(u.credencial_hash)) throw denegado();
  const hash = await derivar(password, u.credencial_salt, iteraciones, 32, 'sha256');
  if (!timingSafeEqual(hash, Buffer.from(u.credencial_hash, 'hex'))) throw denegado();
  return buscar(u.id_usuario);
}

async function buscar(id, conexion = pool) {
  const [[usuario]] = await conexion.execute(perfil + ' WHERE u.id_usuario = ?', [id]);
  return usuario;
}

async function listar() {
  const [usuarios] = await pool.execute(perfil + ' ORDER BY u.nombre, u.apellido, u.id_usuario');
  return usuarios;
}

function datosUsuario(datos) {
  const usuario = validar(() => validarUsuario(datos, []));
  if (usuario.correo.length > 254) throw fallo(400, 'El correo admite hasta 254 caracteres.');
  return usuario;
}

async function crear(datos) {
  const u = datosUsuario(datos);
  const id = randomUUID();
  const clave = await credencial(datos.password);
  await pool.execute(`INSERT INTO usuarios
    (id_usuario, id_rol, nombre, apellido, correo, estado, credencial_hash,
     credencial_salt, credencial_algoritmo, credencial_iteraciones)
    VALUES (?, (SELECT id_rol FROM roles WHERE nombre = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, u.rol, u.nombre, u.apellido, u.correo, u.estado, ...clave]);
  return buscar(id);
}

async function cambiar(id, datos) {
  const clave = datos?.password ? await credencial(datos.password) : null;
  return transaccion(async conexion => {
    // Serializa cambios que puedan afectar al último administrador activo.
    await conexion.execute(`SELECT id_usuario FROM usuarios
      WHERE id_rol = (SELECT id_rol FROM roles WHERE nombre = 'Administrador')
        AND estado = 'Activo' ORDER BY id_usuario FOR UPDATE`);
    const actual = await buscar(id, conexion);
    if (!actual) throw fallo(404, 'Usuario no encontrado.');
    const u = datos && datosUsuario({ ...actual, ...datos });
    if (actual.rol === 'Administrador' && actual.estado === 'Activo' &&
        !(u?.rol === 'Administrador' && u.estado === 'Activo')) {
      const [[{ total }]] = await conexion.execute(`SELECT COUNT(*) AS total FROM usuarios
        WHERE id_rol = (SELECT id_rol FROM roles WHERE nombre = 'Administrador')
          AND estado = 'Activo' AND id_usuario <> ?`, [id]);
      if (!total) throw fallo(409, 'Debe permanecer al menos un administrador activo.');
    }
    if (!u) {
      await conexion.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
      return actual;
    }
    const camposClave = clave ? ', credencial_hash = ?, credencial_salt = ?, credencial_algoritmo = ?, credencial_iteraciones = ?' : '';
    await conexion.execute(`UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?,
      id_rol = (SELECT id_rol FROM roles WHERE nombre = ?), estado = ?${camposClave}
      WHERE id_usuario = ?`, [u.nombre, u.apellido, u.correo, u.rol, u.estado, ...(clave || []), id]);
    return buscar(id, conexion);
  });
}

module.exports = { autenticar, buscar, listar, crear, cambiar };
