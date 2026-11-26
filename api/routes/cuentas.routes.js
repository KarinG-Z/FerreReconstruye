const { randomBytes } = require('node:crypto');
const { Router } = require('express');
const usuarios = require('../services/usuarios');
const { fallo } = require('../services/mysql');

const router = Router();
const sesiones = new Map();
const duracion = 8 * 60 * 60 * 1000;
const opciones = { httpOnly: true, sameSite: 'strict', path: '/api' };
const token = req => /(?:^|;\s*)ferre_sesion=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];

async function sesion(req) {
  const clave = token(req);
  const activa = sesiones.get(clave);
  if (!activa) return null;
  if (activa.vence <= Date.now()) {
    sesiones.delete(clave);
    return null;
  }
  const usuario = await usuarios.buscar(activa.id);
  if (usuario?.estado === 'Activo') return usuario;
  sesiones.delete(clave);
  return null;
}

async function administrador(req, res, next) {
  const usuario = await sesion(req);
  if (!usuario) throw fallo(401, 'Inicia sesión.');
  if (usuario.rol !== 'Administrador') throw fallo(403, 'Se requiere una cuenta de administrador.');
  next();
}

router.post('/registro', async (req, res) => {
  const usuario = await usuarios.crear({ ...req.body, rol: 'Usuario', estado: 'Activo' });
  res.status(201).json({ usuario });
});
router.post('/login', async (req, res) => {
  const usuario = await usuarios.autenticar(req.body?.correo, req.body?.password);
  sesiones.delete(token(req));
  for (const [id, activa] of sesiones) if (activa.vence <= Date.now()) sesiones.delete(id);
  const clave = randomBytes(32).toString('hex');
  sesiones.set(clave, { id: usuario.id, vence: Date.now() + duracion });
  res.cookie('ferre_sesion', clave, { ...opciones, maxAge: duracion }).json({ usuario });
});
router.get('/sesion', async (req, res) => res.json({ usuario: await sesion(req) }));
router.post('/logout', (req, res) => {
  sesiones.delete(token(req));
  res.clearCookie('ferre_sesion', opciones).json({ mensaje: 'Sesión cerrada.' });
});

router.use('/usuarios', administrador);
router.get('/usuarios', async (req, res) => {
  const lista = await usuarios.listar();
  res.json({ total: lista.length, usuarios: lista });
});
router.get('/usuarios/:id', async (req, res) => {
  const usuario = await usuarios.buscar(req.params.id);
  if (!usuario) throw fallo(404, 'Usuario no encontrado.');
  res.json(usuario);
});
router.post('/usuarios', async (req, res) => res.status(201).json({ usuario: await usuarios.crear(req.body || {}) }));
router.put('/usuarios/:id', async (req, res) => res.json({ usuario: await usuarios.cambiar(req.params.id, req.body || {}) }));
router.delete('/usuarios/:id', async (req, res) => res.json({ usuario: await usuarios.cambiar(req.params.id, null) }));

module.exports = { router, administrador };
