const express = require("express");
const router = express.Router();

const {
    listarProductos,
    buscarProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} = require("../controllers/producto.controller");

router.get("/", listarProductos);
router.get("/:id", buscarProducto);
router.post("/", crearProducto);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);


module.exports = router;