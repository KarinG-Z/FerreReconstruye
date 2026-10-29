'use strict';
const router = require('express').Router();
const { guardarArchivo } = require('../services/imagenes');
router.post('/', (req, res) => {
  try { res.status(201).json({ imagen: guardarArchivo(req.body?.imagen) }); }
  catch (error) { res.status(400).json({ mensaje: error.message }); }
});
module.exports = router;
