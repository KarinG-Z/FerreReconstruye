const crypto = require("node:crypto");

// Reutilizamos las mismas validaciones que usa el frontend (js/datos.js)
const { validarProducto } = require("../../js/datos.js");

const productos = require("../data/productos");
const { asociar } = require('../services/imagenes');

const STOCK_BAJO = 5;          // 5 unidades o menos se considera stock bajo
const MAX_CANTIDAD = 10000000; // mismo límite que la validación del frontend

const buscarPorId = (id) => productos.find(p => p.id === id);

// GET /api/productos?q=&categoria=&estado=
const listarProductos = (req, res) => {
  const q = String(req.query.q || "").trim().toLocaleLowerCase("es");
  const { categoria, estado } = req.query;

  const resultado = productos.filter(p =>
    [p.id, p.codigo, p.nombre, p.categoria].some(
      valor => String(valor).toLocaleLowerCase("es").includes(q)
    )
    && (!categoria || p.categoria === categoria)
    && (!estado || p.estado === estado)
  );

  res.json({ total: resultado.length, productos: resultado });
};

// GET /api/productos/:id
const buscarProducto = (req, res) => {
  const producto = buscarPorId(req.params.id);

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  res.json(producto);
};

// POST /api/productos
const crearProducto = (req, res) => {
  try {
    const datos = { ...(req.body || {}) };
    if (!datos.estado) datos.estado = "Activo";

    const nuevo = validarProducto(datos, productos);
    const producto = { ...nuevo, id: crypto.randomUUID() };
    if (producto.imagen) asociar(producto.codigo, producto.imagen);
    productos.push(producto);

    res.status(201).json({
      mensaje: "Producto registrado correctamente",
      producto
    });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// PUT /api/productos/:id  (acepta datos completos o solo los que cambian)
const actualizarProducto = (req, res) => {
  const actual = buscarPorId(req.params.id);

  if (!actual) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  try {
    const datos = { ...actual, ...(req.body || {}) };
    const cambios = validarProducto(datos, productos, actual.id);
    if (cambios.imagen !== actual.imagen || cambios.codigo !== actual.codigo) asociar(cambios.codigo, cambios.imagen || '', actual.codigo);
    Object.assign(actual, cambios);

    res.json({
      mensaje: "Producto actualizado correctamente",
      producto: actual
    });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// PATCH /api/productos/:id/stock   Body: { "cambio": 5 } entrada, { "cambio": -3 } salida
const ajustarStock = (req, res) => {
  const producto = buscarPorId(req.params.id);

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  const cambio = req.body ? req.body.cambio : undefined;

  if (!Number.isInteger(cambio) || cambio === 0) {
    return res.status(400).json({
      mensaje: "El cambio debe ser un número entero distinto de 0 (positivo = entrada, negativo = salida)"
    });
  }

  const nuevaCantidad = producto.cantidad + cambio;

  if (nuevaCantidad < 0) {
    return res.status(400).json({
      mensaje: "No hay suficientes existencias. Disponibles: " + producto.cantidad
    });
  }

  if (nuevaCantidad > MAX_CANTIDAD) {
    return res.status(400).json({
      mensaje: "Las existencias no pueden superar " + MAX_CANTIDAD
    });
  }

  producto.cantidad = nuevaCantidad;

  res.json({
    mensaje: cambio > 0 ? "Entrada registrada correctamente" : "Salida registrada correctamente",
    producto
  });
};

// DELETE /api/productos/:id
const eliminarProducto = (req, res) => {
  const indice = productos.findIndex(p => p.id === req.params.id);

  if (indice === -1) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  try { if (productos[indice].imagen) asociar(productos[indice].codigo, ''); }
  catch (error) { return res.status(500).json({ mensaje: error.message }); }
  const eliminado = productos.splice(indice, 1);

  res.json({
    mensaje: "Producto eliminado correctamente",
    producto: eliminado[0]
  });
};

// GET /api/resumen  (lo mismo que calcula el dashboard)
const resumen = (req, res) => {
  const activos = productos.filter(p => p.estado === "Activo");
  const valor = activos.reduce((suma, p) => suma + p.precio * p.cantidad, 0);

  res.json({
    totalProductos: productos.length,
    stockBajo: activos.filter(p => p.cantidad <= STOCK_BAJO).length,
    valorInventario: Math.round(valor * 100) / 100
  });
};

module.exports = {
  listarProductos,
  buscarProducto,
  crearProducto,
  actualizarProducto,
  ajustarStock,
  eliminarProducto,
  resumen
};
