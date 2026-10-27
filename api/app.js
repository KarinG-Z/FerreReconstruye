const express = require("express");
const cors = require("cors");

const productoRoutes = require("./routes/producto.routes"); 

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ mensaje: "API de inventario funcionando correctamente v2.0" });
});

app.use("/api/productos", productoRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});