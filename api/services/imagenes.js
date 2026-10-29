'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const directorio = process.env.FERRE_IMAGENES_DIR || path.join(__dirname, '../data/imagenes');
const indice = path.join(directorio, 'productos.json');
function leerIndice() {
  try { return JSON.parse(fs.readFileSync(indice, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return {}; throw new Error('No se pudo leer el índice de imágenes. Revisa api/data/imagenes/productos.json.'); }
}
function asociar(codigo, imagen, codigoAnterior = codigo) {
  const datos = leerIndice();
  if (codigoAnterior !== codigo) delete datos[codigoAnterior];
  datos[codigo] = imagen || '';
  fs.mkdirSync(directorio, { recursive: true });
  const temporal = indice + '.tmp'; fs.writeFileSync(temporal, JSON.stringify(datos, null, 2)); fs.renameSync(temporal, indice);
}
function guardarArchivo(dataUrl) {
  if (typeof dataUrl !== 'string') throw Error('Selecciona una imagen PNG, JPEG o WebP.');
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw Error('El formato de imagen no está permitido. Usa PNG, JPEG o WebP.');
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length || buffer.length > 1048576) throw Error('La imagen procesada no puede superar 1 MB.');
  const correcto = m[1] === 'png' ? buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : m[1] === 'jpeg' ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 : buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP';
  if (!correcto) throw Error('El contenido no corresponde a una imagen válida del formato indicado.');
  const nombre = crypto.createHash('sha256').update(buffer).digest('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.mkdirSync(directorio, { recursive: true });
  fs.writeFileSync(path.join(directorio, nombre), buffer);
  return '/imagenes/' + nombre;
}
module.exports = { directorio, leerIndice, asociar, guardarArchivo };
