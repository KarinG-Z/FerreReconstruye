const { Router } = require('express');
const { randomUUID } = require('node:crypto');
const pool = require('../database');
const { fallo, transaccion, validar } = require('../services/mysql');
const { validarProducto } = require('../../js/datos');
const { administrador } = require('./cuentas.routes');

const router = Router();
const ficha = `SELECT p.id_producto AS id, p.codigo, p.nombre, c.nombre AS categoria,
  p.precio_venta AS precio, COALESCE(i.stock_actual, 0) AS cantidad, p.estado, p.imagen
  FROM productos p JOIN categorias c USING (id_categoria)
  LEFT JOIN inventario i USING (id_producto)`;
const convertir = p => p && { ...p, precio: Number(p.precio), imagen: p.imagen || '' };

async function buscar(id, conexion = pool) {
  const [[fila]] = await conexion.execute(ficha + ' WHERE p.id_producto = ?', [id]);
  if (!fila) throw fallo(404, 'Producto no encontrado.');
  return convertir(fila);
}

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const categoria = String(req.query.categoria || '');
  const estado = String(req.query.estado || '');
  const [filas] = await pool.execute(ficha + `
    WHERE (LOCATE(?, CONCAT_WS(' ', p.id_producto, p.codigo, p.nombre, c.nombre)) > 0 OR ? = '')
      AND (c.nombre = ? OR ? = '') AND (p.estado = ? OR ? = '')
    ORDER BY p.codigo`, [q, q, categoria, categoria, estado, estado]);
  res.json({ total: filas.length, productos: filas.map(convertir) });
});
router.get('/:id', async (req, res) => res.json(await buscar(req.params.id)));

async function guardar(id, datos, existe) {
  return transaccion(async conexion => {
    if (existe) {
      await conexion.execute('SELECT id_producto FROM productos WHERE id_producto = ? FOR UPDATE', [id]);
      datos = { ...await buscar(id, conexion), ...datos };
    }
    const p = validar(() => validarProducto(datos, []));
    const [[categoria]] = await conexion.execute('SELECT id_categoria FROM categorias WHERE nombre = ?', [({ Pinturas: 'Pintura', Seguridad: 'Seguridad industrial' })[p.categoria] || p.categoria]);
    if (!categoria) throw fallo(400, 'La categoría no está registrada en MySQL.');
    const valores = [categoria.id_categoria, p.codigo, p.nombre, p.precio, p.estado, p.imagen || null, id];
    if (existe) {
      await conexion.execute(`UPDATE productos SET id_categoria=?, codigo=?, nombre=?,
        precio_venta=?, estado=?, imagen=? WHERE id_producto=?`, valores);
    } else {
      await conexion.execute(`INSERT INTO productos
        (id_categoria,codigo,nombre,precio_venta,estado,imagen,id_producto)
        VALUES (?,?,?,?,?,?,?)`, valores);
    }
    await conexion.execute(`INSERT INTO inventario (id_producto, stock_actual)
      VALUES (?, ?) ON DUPLICATE KEY UPDATE stock_actual = ?`, [id, p.cantidad, p.cantidad]);
    return buscar(id, conexion);
  });
}

router.post('/', administrador, async (req, res) => {
  const producto = await guardar(randomUUID(), { estado: 'Activo', ...req.body }, false);
  res.status(201).json({ mensaje: 'Producto registrado correctamente.', producto });
});
router.put('/:id', administrador, async (req, res) => {
  const producto = await guardar(req.params.id, req.body, true);
  res.json({ mensaje: 'Producto actualizado correctamente.', producto });
});
router.delete('/:id', administrador, async (req, res) => {
  const producto = await transaccion(async conexion => {
    await conexion.execute('SELECT id_producto FROM productos WHERE id_producto = ? FOR UPDATE', [req.params.id]);
    const actual = await buscar(req.params.id, conexion);
    await conexion.execute('DELETE FROM productos WHERE id_producto = ?', [req.params.id]);
    return actual;
  });
  res.json({ mensaje: 'Producto eliminado correctamente.', producto });
});

module.exports = router;
