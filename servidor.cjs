'use strict';
// Servidor estático de desarrollo: no es una API ni una base de datos.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const raiz = __dirname;

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",

  // Imágenes
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",

  // Videos
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

http.createServer((req, res) => {
  let ruta;
  try { ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Solicitud inválida'); return; }
  const archivo = path.resolve(raiz, '.' + (ruta === '/' ? '/index.html' : ruta));
  const ext = path.extname(archivo);
  if (!archivo.startsWith(raiz + path.sep) || !tipos[ext]) { res.writeHead(403); res.end('No disponible'); return; }
  fs.readFile(archivo, (error, datos) => {
    if (error) { res.writeHead(404); res.end('Archivo no encontrado'); return; }
    res.writeHead(200, { 'Content-Type': tipos[ext], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(datos);
  });
}).listen(4173, '127.0.0.1', () => console.log('FerreReconstruye: http://localhost:4173'));
