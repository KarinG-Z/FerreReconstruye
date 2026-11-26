const express = require("express");
const cors = require("cors");

const productoRoutes = require('./routes/producto.mysql.routes');
const cuentas = require('./routes/cuentas.routes');
const pool = require('./database');

const app = express();
const PORT = 3000;

app.use(cors({ origin: /^http:\/\/(localhost|127\.0\.0\.1):(?:4173|5500|5501)$/, credentials: true }));
app.use(express.json({ limit: '2mb' }));
const imagenes = require('./services/imagenes');
app.use('/imagenes', (req, res, next) => {
  if (!/^\/[a-f0-9]{64}\.(?:png|jpg|webp)$/.test(req.path)) return res.status(404).json({ mensaje: 'Imagen no encontrada.' });
  next();
});
app.use('/imagenes', express.static(imagenes.directorio, {
  dotfiles: 'deny',
  setHeaders(res) { res.setHeader('X-Content-Type-Options', 'nosniff'); }
}));
app.use('/api/imagenes', cuentas.administrador, require('./routes/imagen.routes'));

app.get("/", (req, res) => {
  res.json({ mensaje: "API de inventario funcionando correctamente v2.0" });
});

app.get('/api/conexion', async (req, res) => {
  const [[fila]] = await pool.execute('SELECT DATABASE() AS base, @@port AS puerto');
  res.json(fila);
});
app.use('/api', cuentas.router);
app.use('/api/productos', productoRoutes);
app.use((error, req, res, next) => {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'El correo o código ya está registrado.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ mensaje: 'El registro tiene referencias. Puedes desactivarlo para conservar el historial.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La imagen es demasiado grande.' });
  if (error.status && error.status < 500) return res.status(error.status).json({ mensaje: error.message });
  console.error('Error de API:', error.code || error.name);
  res.status(503).json({ mensaje: 'No se pudo acceder al servicio. Comprueba la API y MySQL.' });
});

pool.execute('SELECT 1').then(() => {
  app.listen(PORT, '127.0.0.1', () => console.log(`API MySQL disponible en http://localhost:${PORT}`));
}).catch(error => {
  console.error('No se pudo conectar con MySQL:', error.code || error.name);
  process.exitCode = 1;
  return pool.end();
});
