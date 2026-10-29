const express = require("express");
const cors = require("cors");

const productoRoutes = require("./routes/producto.routes"); 

const app = express();
const PORT = 3000;

app.use(cors());
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
app.use('/api/imagenes', require('./routes/imagen.routes'));

app.get("/", (req, res) => {
  res.json({ mensaje: "API de inventario funcionando correctamente v2.0" });
});

app.use("/api/productos", productoRoutes);
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ mensaje: error.type === 'entity.too.large' ? 'La imagen es demasiado grande. Usa una imagen procesada de menos de 1 MB.' : 'No se pudo procesar la solicitud.' });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
