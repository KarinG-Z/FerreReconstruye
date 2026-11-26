-- FerreReconstruye | Entregable 2 | MySQL 8.0.16 o posterior
-- Ejecutar en un servidor donde ferre_reconstruye_entregable2 aún no exista.
-- Cambios respecto al Entregable 1:
-- Se conservan las 14 tablas y 20 claves foráneas del diagrama.
-- clientes.id_cliente usa VARCHAR(36) según el SQL adjunto; el diagrama
-- indicaba CHAR(36). Conserva los UUID y las relaciones con las tablas hijas.
-- productos agrega imagen para almacenar la ruta o URL usada en el catálogo.
-- cotizaciones agrega uuid_cotizacion, numero, datos_cliente, datos_empresa,
-- asesor, transporte, revision y actualizado_en para conservar la prefactura.
-- detalle_cotizacion agrega codigo_producto, descuento_porcentaje e iva_porcentaje.
-- producto_proveedor impide repetir la pareja producto/proveedor.
-- Se concretan valores ENUM, restricciones CHECK y acciones de borrado.
-- Asesor de ventas, Auxiliar de inventario y Compras son roles de ejemplo
-- para cumplir el mínimo de la guía. La aplicación solo usa Administrador y Usuario.

-- Compatibilidad XAMPP: utf8mb4_unicode_ci en lugar de utf8mb4_0900_ai_ci.
-- Los mensajes comentados se capturaron en MySQL 8 y pueden variar en MariaDB.

-- Parte 1. Base de datos y tablas.
SET NAMES utf8mb4;
CREATE DATABASE ferre_reconstruye_entregable2
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ferre_reconstruye_entregable2;

CREATE TABLE roles (
  id_rol TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id_usuario CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY,
  id_rol TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  apellido VARCHAR(60) NOT NULL,
  correo VARCHAR(254) NOT NULL UNIQUE,
  credencial_hash VARCHAR(255) NOT NULL,
  credencial_salt VARCHAR(64),
  credencial_algoritmo VARCHAR(32) NOT NULL,
  credencial_iteraciones INT UNSIGNED,
  estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id_cliente VARCHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY,
  documento VARCHAR(30) UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(254),
  telefono VARCHAR(30),
  direccion VARCHAR(255),
  estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categorias (
  id_categoria SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE productos (
  id_producto CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY,
  id_categoria SMALLINT UNSIGNED NOT NULL,
  creado_por CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci,
  codigo VARCHAR(24) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500),
  unidad_medida VARCHAR(30) NOT NULL DEFAULT 'Unidad',
  precio_venta DECIMAL(14,2) NOT NULL,
  imagen TEXT,
  estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_productos_precio CHECK (precio_venta >= 0),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria),
  CONSTRAINT fk_productos_usuario FOREIGN KEY (creado_por) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE inventario (
  id_inventario BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_producto CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL UNIQUE,
  stock_actual INT UNSIGNED NOT NULL DEFAULT 0,
  stock_minimo INT UNSIGNED NOT NULL DEFAULT 0,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventario_producto FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proveedores (
  id_proveedor CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY,
  nit VARCHAR(30) UNIQUE,
  razon_social VARCHAR(120) NOT NULL,
  contacto VARCHAR(100),
  correo VARCHAR(254),
  telefono VARCHAR(30),
  estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE producto_proveedor (
  id_producto_proveedor BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_producto CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  id_proveedor CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  codigo_proveedor VARCHAR(50),
  costo_referencia DECIMAL(14,2),
  plazo_dias SMALLINT UNSIGNED,
  UNIQUE (id_producto, id_proveedor),
  CONSTRAINT ck_producto_proveedor_costo CHECK (costo_referencia >= 0),
  CONSTRAINT fk_producto_proveedor_producto FOREIGN KEY (id_producto) REFERENCES productos (id_producto),
  CONSTRAINT fk_producto_proveedor_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores (id_proveedor)
) ENGINE=InnoDB;

CREATE TABLE cotizaciones (
  id_cotizacion BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid_cotizacion CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci UNIQUE,
  numero VARCHAR(24) NOT NULL UNIQUE,
  id_cliente CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  id_usuario CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vencimiento DATE,
  estado ENUM('Borrador','Enviada','Aceptada','Anulada') NOT NULL DEFAULT 'Borrador',
  observaciones TEXT,
  -- Copias de los datos impresos para conservar el documento histórico.
  datos_cliente JSON,
  datos_empresa JSON,
  asesor VARCHAR(121),
  transporte DECIMAL(14,2) NOT NULL DEFAULT 0,
  revision INT UNSIGNED NOT NULL DEFAULT 0,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_cotizaciones_vencimiento CHECK (vencimiento >= DATE(fecha)),
  CONSTRAINT ck_cotizaciones_transporte CHECK (transporte >= 0),
  CONSTRAINT fk_cotizaciones_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente),
  CONSTRAINT fk_cotizaciones_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE detalle_cotizacion (
  id_detalle_cotizacion BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cotizacion BIGINT UNSIGNED NOT NULL,
  id_producto CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  codigo_producto VARCHAR(24) NOT NULL,
  nombre_producto VARCHAR(100) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(14,2) NOT NULL,
  descuento_porcentaje DECIMAL(17,14) NOT NULL DEFAULT 0,
  iva_porcentaje DECIMAL(17,14) NOT NULL DEFAULT 0,
  CONSTRAINT ck_detalle_cotizacion_cantidad CHECK (cantidad BETWEEN 1 AND 10000000),
  CONSTRAINT ck_detalle_cotizacion_precio CHECK (precio_unitario BETWEEN 0 AND 10000000000),
  CONSTRAINT ck_detalle_cotizacion_descuento CHECK (descuento_porcentaje BETWEEN 0 AND 100),
  CONSTRAINT ck_detalle_cotizacion_iva CHECK (iva_porcentaje BETWEEN 0 AND 100),
  CONSTRAINT fk_detalle_cotizacion_cabecera FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones (id_cotizacion) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_cotizacion_producto FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
) ENGINE=InnoDB;

CREATE TABLE pedidos (
  id_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  id_cotizacion BIGINT UNSIGNED UNIQUE,
  id_usuario CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('Pendiente','Confirmado','En preparación','Entregado','Cancelado') NOT NULL DEFAULT 'Pendiente',
  observaciones TEXT,
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente),
  CONSTRAINT fk_pedidos_cotizacion FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones (id_cotizacion),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE detalle_pedido (
  id_detalle_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pedido BIGINT UNSIGNED NOT NULL,
  id_producto CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  nombre_producto VARCHAR(100) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(14,2) NOT NULL,
  CONSTRAINT ck_detalle_pedido_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_detalle_pedido_precio CHECK (precio_unitario >= 0),
  CONSTRAINT fk_detalle_pedido_cabecera FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
) ENGINE=InnoDB;

CREATE TABLE ventas (
  id_venta BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pedido BIGINT UNSIGNED UNIQUE,
  id_cliente CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci,
  id_usuario CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago ENUM('Efectivo','Tarjeta','Transferencia','Otro') NOT NULL,
  estado ENUM('Pendiente','Pagada','Anulada') NOT NULL DEFAULT 'Pendiente',
  subtotal DECIMAL(14,2) NOT NULL,
  impuesto DECIMAL(14,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL,
  CONSTRAINT ck_ventas_importes CHECK (
    subtotal >= 0 AND impuesto >= 0 AND descuento BETWEEN 0 AND subtotal
    AND total = subtotal - descuento + impuesto
  ),
  CONSTRAINT fk_ventas_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido),
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente),
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE detalle_venta (
  id_detalle_venta BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_venta BIGINT UNSIGNED NOT NULL,
  id_producto CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  nombre_producto VARCHAR(100) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(14,2) NOT NULL,
  CONSTRAINT ck_detalle_venta_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_detalle_venta_precio CHECK (precio_unitario >= 0),
  CONSTRAINT fk_detalle_venta_cabecera FOREIGN KEY (id_venta) REFERENCES ventas (id_venta) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_venta_producto FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
) ENGINE=InnoDB;

-- Parte 2. Inserciones del catálogo.
-- Catálogo base de api/data/productos.js e imágenes de referencia.
DROP TEMPORARY TABLE IF EXISTS ferre_catalogo_inicial;
CREATE TEMPORARY TABLE ferre_catalogo_inicial (
  codigo VARCHAR(24) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  precio DECIMAL(14,2) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  imagen TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ferre_catalogo_inicial (codigo, nombre, categoria, precio, cantidad, imagen) VALUES
  ('HER-001', 'Martillo de uña 16 oz', 'Herramientas', 32500, 48, 'assets/productos/HER-001.png'),
  ('HER-002', 'Destornillador de estrella', 'Herramientas', 12000, 35, 'assets/productos/HER-002.jpg'),
  ('HER-003', 'Alicate universal de 8 pulgadas', 'Herramientas', 18500, 25, 'assets/productos/HER-003.jpg'),
  ('HER-004', 'Llave inglesa de 10 pulgadas', 'Herramientas', 28000, 18, 'assets/productos/HER-004.jpg'),
  ('HER-005', 'Taladro eléctrico de 600 W', 'Herramientas eléctricas', 185000, 12, 'assets/productos/HER-005.jpg'),
  ('HER-006', 'Cinta métrica de 5 metros', 'Medición', 15000, 40, 'assets/productos/HER-006.png'),
  ('HER-007', 'Destornillador plano', 'Herramientas', 9500, 32, 'assets/productos/HER-007.jpg'),
  ('HER-008', 'Juego de destornilladores x6', 'Herramientas', 35000, 20, 'assets/productos/HER-008.jpg'),
  ('HER-009', 'Alicate de punta larga', 'Herramientas', 22000, 17, 'assets/productos/HER-009.jpg'),
  ('HER-010', 'Llave Allen juego x9', 'Herramientas', 18000, 28, 'assets/productos/HER-010.jpg'),
  ('HER-011', 'Serrucho de mano 20 pulgadas', 'Herramientas', 27000, 14, 'assets/productos/HER-011.jpg'),
  ('HER-012', 'Arco de sierra metálico', 'Herramientas', 23000, 19, 'assets/productos/HER-012.jpg'),
  ('HER-013', 'Lima metálica plana', 'Herramientas', 11000, 26, 'assets/productos/HER-013.jpg'),
  ('HER-014', 'Cincel para metal 10 pulgadas', 'Herramientas', 16000, 15, 'assets/productos/HER-014.jpg'),
  ('HER-015', 'Prensa de banco 4 pulgadas', 'Herramientas', 145000, 6, 'assets/productos/HER-015.jpg'),
  ('HER-016', 'Taladro percutor 800 W', 'Herramientas eléctricas', 245000, 9, 'assets/productos/HER-016.jpg'),
  ('HER-017', 'Pulidora angular 4.5 pulgadas', 'Herramientas eléctricas', 210000, 11, 'assets/productos/HER-017.jpg'),
  ('HER-018', 'Sierra circular 7.25 pulgadas', 'Herramientas eléctricas', 390000, 5, 'assets/productos/HER-018.png'),
  ('HER-019', 'Lijadora orbital 240 W', 'Herramientas eléctricas', 175000, 8, 'assets/productos/HER-019.png'),
  ('HER-020', 'Extensión eléctrica 10 metros', 'Herramientas eléctricas', 42000, 22, 'assets/productos/HER-020.jpg'),
  ('HER-021', 'Nivel de burbuja 24 pulgadas', 'Medición', 38000, 16, 'assets/productos/HER-021.jpg'),
  ('HER-022', 'Flexómetro de 3 metros', 'Medición', 10000, 45, 'assets/productos/HER-022.jpg'),
  ('HER-023', 'Escuadra metálica 12 pulgadas', 'Medición', 14000, 24, 'assets/productos/HER-023.jpg'),
  ('HER-024', 'Calibrador Vernier 150 mm', 'Medición', 65000, 7, 'assets/productos/HER-024.png'),
  ('HER-025', 'Multímetro digital básico', 'Medición', 55000, 13, 'assets/productos/HER-025.webp'),
  ('HER-026', 'Tornillo para madera x100', 'Tornillería', 12000, 60, 'assets/productos/HER-026.jpg'),
  ('HER-027', 'Tornillo autorroscante x100', 'Tornillería', 15000, 42, 'assets/productos/HER-027.jpg'),
  ('HER-028', 'Pernos hexagonales x20', 'Tornillería', 18000, 30, 'assets/productos/HER-028.jpg'),
  ('HER-029', 'Tuercas galvanizadas x50', 'Tornillería', 9000, 38, 'assets/productos/HER-029.jpg'),
  ('HER-030', 'Arandelas metálicas x100', 'Tornillería', 7500, 50, 'assets/productos/HER-030.jpg'),
  ('HER-031', 'Chazos plásticos 1/4 x50', 'Tornillería', 8000, 34, 'assets/productos/HER-031.jpg'),
  ('HER-032', 'Juego de puntillas 1 pulgada', 'Tornillería', 6500, 55, 'assets/productos/HER-032.jpg'),
  ('HER-033', 'Bisagra metálica 3 pulgadas', 'Tornillería', 7000, 40, 'assets/productos/HER-033.jpg'),
  ('HER-034', 'Candado de seguridad 40 mm', 'Tornillería', 22000, 18, 'assets/productos/HER-034.png'),
  ('HER-035', 'Cerradura para puerta', 'Tornillería', 48000, 10, 'assets/productos/HER-035.jpg'),
  ('HER-036', 'Pintura blanca interior 1 galón', 'Pintura', 78000, 14, 'assets/productos/HER-036.jpg'),
  ('HER-037', 'Pintura azul interior 1 galón', 'Pintura', 82000, 9, 'assets/productos/HER-037.jpg'),
  ('HER-038', 'Pintura anticorrosiva 1 galón', 'Pintura', 95000, 7, 'assets/productos/HER-038.jpg'),
  ('HER-039', 'Brocha de 2 pulgadas', 'Pintura', 9000, 33, 'assets/productos/HER-039.jpg'),
  ('HER-040', 'Brocha de 4 pulgadas', 'Pintura', 16000, 21, 'assets/productos/HER-040.jpg'),
  ('HER-041', 'Rodillo para pintar 9 pulgadas', 'Pintura', 18000, 25, 'assets/productos/HER-041.png'),
  ('HER-042', 'Bandeja para pintura', 'Pintura', 12000, 17, 'assets/productos/HER-042.jpg'),
  ('HER-043', 'Espátula metálica 4 pulgadas', 'Pintura', 10000, 29, 'assets/productos/HER-043.jpg'),
  ('HER-044', 'Lija para madera grano 120 x10', 'Pintura', 8000, 44, 'assets/productos/HER-044.jpg'),
  ('HER-045', 'Cinta de enmascarar 48 mm', 'Pintura', 11000, 36, 'assets/productos/HER-045.png'),
  ('HER-046', 'Tubo PVC de 1/2 pulgada', 'Plomería', 12000, 30, 'assets/productos/HER-046.jpg'),
  ('HER-047', 'Tubo PVC de 2 pulgadas', 'Plomería', 28000, 16, 'assets/productos/HER-047.jpg'),
  ('HER-048', 'Codo PVC de 1/2 pulgada', 'Plomería', 2500, 60, 'assets/productos/HER-048.webp'),
  ('HER-049', 'Unión PVC de 1 pulgada', 'Plomería', 3500, 45, 'assets/productos/HER-049.jpg'),
  ('HER-050', 'Válvula de bola de 1/2 pulgada', 'Plomería', 18000, 14, 'assets/productos/HER-050.webp'),
  ('HER-051', 'Grifo metálico para lavaplatos', 'Plomería', 65000, 8, 'assets/productos/HER-051.jpg'),
  ('HER-052', 'Sifón plástico para lavamanos', 'Plomería', 22000, 13, 'assets/productos/HER-052.webp'),
  ('HER-053', 'Cinta de teflón', 'Plomería', 2500, 70, 'assets/productos/HER-053.png'),
  ('HER-054', 'Pegante para PVC 1/4 galón', 'Plomería', 24000, 12, 'assets/productos/HER-054.webp'),
  ('HER-055', 'Llave de tubo 14 pulgadas', 'Plomería', 42000, 10, 'assets/productos/HER-055.jpg'),
  ('HER-056', 'Guantes de carnaza', 'Seguridad industrial', 18000, 25, 'assets/productos/HER-056.jpg'),
  ('HER-057', 'Gafas de seguridad transparentes', 'Seguridad industrial', 12000, 31, 'assets/productos/HER-057.jpg'),
  ('HER-058', 'Casco de seguridad industrial', 'Seguridad industrial', 38000, 15, 'assets/productos/HER-058.jpg'),
  ('HER-059', 'Botas de seguridad talla 40', 'Seguridad industrial', 125000, 6, 'assets/productos/HER-059.jpg'),
  ('HER-060', 'Tapones auditivos par', 'Seguridad industrial', 4500, 50, 'assets/productos/HER-060.jpg'),
  ('HER-061', 'Mascarilla para polvo', 'Seguridad industrial', 6000, 40, 'assets/productos/HER-061.jpg'),
  ('HER-062', 'Chaleco reflectivo', 'Seguridad industrial', 22000, 18, 'assets/productos/HER-062.png'),
  ('HER-063', 'Arnés de seguridad', 'Seguridad industrial', 185000, 4, 'assets/productos/HER-063.webp'),
  ('HER-064', 'Careta para soldar', 'Seguridad industrial', 65000, 7, 'assets/productos/HER-064.jpg'),
  ('HER-065', 'Delantal de carnaza', 'Seguridad industrial', 48000, 9, 'assets/productos/HER-065.jpg'),
  ('HER-066', 'Manguera de jardín 15 metros', 'Jardinería', 55000, 11, 'assets/productos/HER-066.jpg'),
  ('HER-067', 'Pistola para riego', 'Jardinería', 22000, 17, 'assets/productos/HER-067.jpg'),
  ('HER-068', 'Tijera de podar', 'Jardinería', 28000, 13, 'assets/productos/HER-068.jpg'),
  ('HER-069', 'Pala redonda', 'Jardinería', 42000, 8, 'assets/productos/HER-069.jpg'),
  ('HER-070', 'Azadón agrícola', 'Jardinería', 38000, 10, 'assets/productos/HER-070.jpg'),
  ('HER-071', 'Rastrillo metálico', 'Jardinería', 35000, 9, 'assets/productos/HER-071.webp'),
  ('HER-072', 'Maceta plástica grande', 'Jardinería', 16000, 20, 'assets/productos/HER-072.jpg'),
  ('HER-073', 'Aspersor giratorio', 'Jardinería', 25000, 12, 'assets/productos/HER-073.jpg'),
  ('HER-074', 'Carretilla de construcción', 'Jardinería', 185000, 5, 'assets/productos/HER-074.jpg'),
  ('HER-075', 'Guadaña manual', 'Jardinería', 29000, 7, 'assets/productos/HER-075.png'),
  ('HER-076', 'Cable eléctrico calibre 12, metro', 'Electricidad', 4500, 100, 'assets/productos/HER-076.jpg'),
  ('HER-077', 'Interruptor sencillo', 'Electricidad', 6500, 35, 'assets/productos/HER-077.webp'),
  ('HER-078', 'Tomacorriente doble', 'Electricidad', 9000, 28, 'assets/productos/HER-078.jpg'),
  ('HER-079', 'Bombillo LED de 12 W', 'Electricidad', 8500, 45, 'assets/productos/HER-079.jpg'),
  ('HER-080', 'Portalámparas plástico', 'Electricidad', 3500, 32, 'assets/productos/HER-080.jpg'),
  ('HER-081', 'Cinta aislante negra', 'Electricidad', 4500, 40, 'assets/productos/HER-081.jpg'),
  ('HER-082', 'Breaker monopolar de 20 A', 'Electricidad', 18000, 16, 'assets/productos/HER-082.jpg'),
  ('HER-083', 'Tablero eléctrico de 8 circuitos', 'Electricidad', 95000, 5, 'assets/productos/HER-083.jpg'),
  ('HER-084', 'Clavija eléctrica industrial', 'Electricidad', 12000, 19, 'assets/productos/HER-084.jpg'),
  ('HER-085', 'Canaleta plástica de 2 metros', 'Electricidad', 10000, 26, 'assets/productos/HER-085.jpg'),
  ('HER-086', 'Cemento gris bolsa de 50 kg', 'Construcción', 38000, 35, 'assets/productos/HER-086.png'),
  ('HER-087', 'Mortero de pega bolsa de 25 kg', 'Construcción', 22000, 24, 'assets/productos/HER-087.jpg'),
  ('HER-088', 'Arena de construcción, bulto', 'Construcción', 18000, 20, 'assets/productos/HER-088.jpg'),
  ('HER-089', 'Ladrillo común unidad', 'Construcción', 1200, 300, 'assets/productos/HER-089.jpg'),
  ('HER-090', 'Bloque de concreto unidad', 'Construcción', 3500, 120, 'assets/productos/HER-090.jpg'),
  ('HER-091', 'Palustre de albañilería', 'Construcción', 16000, 18, 'assets/productos/HER-091.jpg'),
  ('HER-092', 'Llana metálica lisa', 'Construcción', 22000, 12, 'assets/productos/HER-092.jpg'),
  ('HER-093', 'Balde plástico de 20 litros', 'Construcción', 18000, 22, 'assets/productos/HER-093.jpg'),
  ('HER-094', 'Carretilla para mezcla', 'Construcción', 165000, 4, 'assets/productos/HER-094.png'),
  ('HER-095', 'Regla de aluminio 2 metros', 'Construcción', 35000, 9, 'assets/productos/HER-095.jpg'),
  ('HER-096', 'Disco de corte para metal 4.5 pulgadas', 'Herramientas', 6500, 45, 'assets/productos/HER-096.jpg'),
  ('HER-097', 'Broca para concreto 8 mm', 'Herramientas', 8500, 27, 'assets/productos/HER-097.jpg'),
  ('HER-098', 'Juego de llaves combinadas x8', 'Herramientas', 58000, 11, 'assets/productos/HER-098.webp'),
  ('HER-099', 'Pistola de silicona caliente', 'Herramientas eléctricas', 28000, 14, 'assets/productos/HER-099.jpg'),
  ('HER-100', 'Compresor de aire 24 litros', 'Herramientas eléctricas', 520000, 3, 'assets/productos/HER-100.webp');

START TRANSACTION;

INSERT INTO roles (id_rol, nombre) VALUES
  (1, 'Administrador'), (2, 'Usuario'), (3, 'Asesor de ventas'),
  (4, 'Auxiliar de inventario'), (5, 'Compras');

INSERT INTO categorias (nombre)
SELECT DISTINCT categoria FROM ferre_catalogo_inicial ORDER BY categoria;

INSERT INTO productos (id_producto, id_categoria, codigo, nombre, precio_venta, imagen)
SELECT UUID(), c.id_categoria, s.codigo, s.nombre, s.precio, NULLIF(s.imagen, '')
FROM ferre_catalogo_inicial AS s
JOIN categorias AS c ON c.nombre = s.categoria
ORDER BY s.codigo;

INSERT INTO inventario (id_producto, stock_actual)
SELECT p.id_producto, s.cantidad
FROM ferre_catalogo_inicial AS s
JOIN productos AS p ON p.codigo = s.codigo
ORDER BY s.codigo;

-- Parte 2. Datos académicos ficticios para la ferretería.
-- Las cuentas son de demostración y no tienen credenciales utilizables.
INSERT INTO usuarios (id_usuario, id_rol, nombre, apellido, correo, credencial_hash, credencial_algoritmo, estado) VALUES
  ('00000000-0000-4000-8000-000000000101', 1, 'Laura', 'Rojas', 'laura@ferre.example', 'CUENTA-DEMO-SIN-ACCESO', 'DEMO', 'Inactivo'),
  ('00000000-0000-4000-8000-000000000102', 2, 'Mateo', 'Gómez', 'mateo@ferre.example', 'CUENTA-DEMO-SIN-ACCESO', 'DEMO', 'Inactivo'),
  ('00000000-0000-4000-8000-000000000103', 3, 'Daniela', 'Torres', 'daniela@ferre.example', 'CUENTA-DEMO-SIN-ACCESO', 'DEMO', 'Inactivo'),
  ('00000000-0000-4000-8000-000000000104', 4, 'Andrés', 'León', 'andres@ferre.example', 'CUENTA-DEMO-SIN-ACCESO', 'DEMO', 'Inactivo'),
  ('00000000-0000-4000-8000-000000000105', 5, 'Valentina', 'Vargas', 'valentina@ferre.example', 'CUENTA-DEMO-SIN-ACCESO', 'DEMO', 'Inactivo');

INSERT INTO clientes (id_cliente, documento, nombre, correo, telefono, direccion) VALUES
  ('00000000-0000-4000-8000-000000000201', 'DEMO-C001', 'Obras Sierra SAS', 'contacto1@cliente.example', '6015550100', 'Calle 24 # 30-15, Bogotá'),
  ('00000000-0000-4000-8000-000000000202', 'DEMO-C002', 'Taller El Roble', NULL, '6015550101', 'Calle 30 # 31-15, Bogotá'),
  ('00000000-0000-4000-8000-000000000203', 'DEMO-C003', 'Carolina Méndez', 'contacto3@cliente.example', '6015550102', 'Calle 36 # 32-15, Bogotá'),
  ('00000000-0000-4000-8000-000000000204', 'DEMO-C004', 'Mantenimiento Horizonte', NULL, '6015550103', 'Calle 42 # 33-15, Bogotá'),
  ('00000000-0000-4000-8000-000000000205', 'DEMO-C005', 'Instalaciones Rivera', 'contacto5@cliente.example', '6015550104', 'Calle 48 # 34-15, Bogotá'),
  ('00000000-0000-4000-8000-000000000206', NULL, 'Proyecto Bodega Norte', NULL, NULL, NULL);

INSERT INTO proveedores (id_proveedor, nit, razon_social, contacto, correo, telefono) VALUES
  ('00000000-0000-4000-8000-000000000301', 'DEMO-P001', 'Suministros Andinos', 'Camila Díaz', 'ventas1@proveedor.example', '6015550200'),
  ('00000000-0000-4000-8000-000000000302', 'DEMO-P002', 'Herramientas del Centro', 'Jorge Cruz', 'ventas2@proveedor.example', '6015550201'),
  ('00000000-0000-4000-8000-000000000303', 'DEMO-P003', 'Distribuciones La Sabana', 'Sara Peña', 'ventas3@proveedor.example', '6015550202'),
  ('00000000-0000-4000-8000-000000000304', 'DEMO-P004', 'Ferroindustrial Capital', 'Felipe Ríos', 'ventas4@proveedor.example', '6015550203'),
  ('00000000-0000-4000-8000-000000000305', 'DEMO-P005', 'Equipos Eléctricos Norte', 'Luisa Mora', 'ventas5@proveedor.example', '6015550204'),
  ('00000000-0000-4000-8000-000000000306', 'DEMO-P006', 'Comercializadora Ruta Sur', NULL, NULL, NULL);

SET @producto1 = (SELECT id_producto FROM productos WHERE codigo = 'HER-001');
SET @producto2 = (SELECT id_producto FROM productos WHERE codigo = 'HER-002');
SET @producto3 = (SELECT id_producto FROM productos WHERE codigo = 'HER-003');
SET @producto4 = (SELECT id_producto FROM productos WHERE codigo = 'HER-004');
SET @producto5 = (SELECT id_producto FROM productos WHERE codigo = 'HER-005');

INSERT INTO producto_proveedor (id_producto, id_proveedor, codigo_proveedor, costo_referencia, plazo_dias) VALUES
  (@producto1, '00000000-0000-4000-8000-000000000301', 'REF-41', 22800, 2),
  (@producto2, '00000000-0000-4000-8000-000000000302', 'REF-42', 7800, 5),
  (@producto3, '00000000-0000-4000-8000-000000000303', 'REF-43', 13100, 3),
  (@producto4, '00000000-0000-4000-8000-000000000304', 'REF-44', 19900, 6),
  (@producto5, '00000000-0000-4000-8000-000000000305', 'REF-45', 148000, 9),
  (@producto1, '00000000-0000-4000-8000-000000000302', 'MART-16', 24300, 1);

INSERT INTO cotizaciones (id_cotizacion, numero, id_cliente, id_usuario, fecha, vencimiento, estado, observaciones, transporte) VALUES
  (1, 'COT-20261101-DEMO0001', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', '2026-11-01 09:30:00', '2026-11-15', 'Aceptada', 'Reposición de herramientas de obra', 0),
  (2, 'COT-20261102-DEMO0002', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000102', '2026-11-02 09:30:00', '2026-11-16', 'Aceptada', 'Mantenimiento de equipos', 0),
  (3, 'COT-20261103-DEMO0003', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000101', '2026-11-03 09:30:00', '2026-11-17', 'Aceptada', 'Kit para reparaciones', 0),
  (4, 'COT-20261104-DEMO0004', '00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000102', '2026-11-04 09:30:00', '2026-11-18', 'Aceptada', 'Servicio de plomería', 0),
  (5, 'COT-20261105-DEMO0005', '00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000101', '2026-11-05 09:30:00', '2026-11-19', 'Aceptada', 'Montaje de estantería', 0);

INSERT INTO detalle_cotizacion (id_cotizacion, id_producto, codigo_producto, nombre_producto, cantidad, precio_unitario, descuento_porcentaje, iva_porcentaje) VALUES
  (1, @producto1, 'HER-001', 'Martillo de uña 16 oz', 2, 32500, 0, 19),
  (2, @producto2, 'HER-002', 'Destornillador de estrella', 8, 12000, 5, 19),
  (3, @producto3, 'HER-003', 'Alicate universal de 8 pulgadas', 3, 18500, 0, 19),
  (4, @producto4, 'HER-004', 'Llave inglesa de 10 pulgadas', 4, 28000, 10, 19),
  (5, @producto5, 'HER-005', 'Taladro eléctrico de 600 W', 1, 185000, 5, 19);

INSERT INTO pedidos (id_pedido, id_cliente, id_cotizacion, id_usuario, fecha, estado) VALUES
  (1, '00000000-0000-4000-8000-000000000201', 1, '00000000-0000-4000-8000-000000000101', '2026-11-02 11:00:00', 'Entregado'),
  (2, '00000000-0000-4000-8000-000000000202', 2, '00000000-0000-4000-8000-000000000102', '2026-11-03 11:00:00', 'Entregado'),
  (3, '00000000-0000-4000-8000-000000000203', 3, '00000000-0000-4000-8000-000000000101', '2026-11-04 11:00:00', 'Entregado'),
  (4, '00000000-0000-4000-8000-000000000204', 4, '00000000-0000-4000-8000-000000000102', '2026-11-05 11:00:00', 'Entregado'),
  (5, '00000000-0000-4000-8000-000000000205', 5, '00000000-0000-4000-8000-000000000101', '2026-11-06 11:00:00', 'Entregado');

INSERT INTO detalle_pedido (id_pedido, id_producto, nombre_producto, cantidad, precio_unitario) VALUES
  (1, @producto1, 'Martillo de uña 16 oz', 2, 32500),
  (2, @producto2, 'Destornillador de estrella', 8, 12000),
  (3, @producto3, 'Alicate universal de 8 pulgadas', 3, 18500),
  (4, @producto4, 'Llave inglesa de 10 pulgadas', 4, 28000),
  (5, @producto5, 'Taladro eléctrico de 600 W', 1, 185000);

INSERT INTO ventas (id_venta, id_pedido, id_cliente, id_usuario, fecha, metodo_pago, estado, subtotal, impuesto, descuento, total) VALUES
  (1, 1, '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', '2026-11-03 15:30:00', 'Transferencia', 'Pagada', 65000, 12350, 0, 77350),
  (2, 2, '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000102', '2026-11-04 15:30:00', 'Efectivo', 'Pagada', 96000, 17328, 4800, 108528),
  (3, 3, '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000103', '2026-11-05 15:30:00', 'Tarjeta', 'Pagada', 55500, 10545, 0, 66045),
  (4, 4, '00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000104', '2026-11-06 15:30:00', 'Transferencia', 'Pagada', 112000, 19152, 11200, 119952),
  (5, 5, '00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000105', '2026-11-07 15:30:00', 'Tarjeta', 'Pagada', 185000, 33392.5, 9250, 209142.5);

INSERT INTO detalle_venta (id_venta, id_producto, nombre_producto, cantidad, precio_unitario) VALUES
  (1, @producto1, 'Martillo de uña 16 oz', 2, 32500),
  (2, @producto2, 'Destornillador de estrella', 8, 12000),
  (3, @producto3, 'Alicate universal de 8 pulgadas', 3, 18500),
  (4, @producto4, 'Llave inglesa de 10 pulgadas', 4, 28000),
  (5, @producto5, 'Taladro eléctrico de 600 W', 1, 185000);

-- Parte 3. Actualizaciones y borrados válidos.
-- Aumentar el mínimo de martillos para programar la próxima reposición.
UPDATE inventario SET stock_minimo = 12 WHERE id_producto = @producto1;

-- Registrar el plazo actualizado del proveedor de taladros.
UPDATE producto_proveedor SET plazo_dias = 7
WHERE id_producto = @producto5 AND id_proveedor = '00000000-0000-4000-8000-000000000305';

-- Eliminar un prospecto duplicado de la lista de contactos sin cotizaciones.
DELETE FROM clientes WHERE id_cliente = '00000000-0000-4000-8000-000000000206';

-- Retirar un proveedor de contacto preliminar sin referencias de catálogo.
DELETE FROM proveedores WHERE id_proveedor = '00000000-0000-4000-8000-000000000306';

COMMIT;
DROP TEMPORARY TABLE ferre_catalogo_inicial;

-- Parte 3. Borrado rechazado por una llave foránea.
-- DELETE FROM productos WHERE codigo = 'HER-001';
-- ERROR 1451 (23000) at line 1: Cannot delete or update a parent row: a foreign key constraint fails (`ferre_reconstruye_entregable2`.`detalle_cotizacion`, CONSTRAINT `fk_detalle_cotizacion_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`))
-- Las cotizaciones guardan la referencia al martillo. Para borrar físicamente el producto, primero habría que quitar todas sus filas hijas (detalle de cotización, pedido y venta,
-- y asociaciones con proveedores). El stock se elimina en cascada. Para conservar el historial comercial, conviene marcar el producto como Inactivo.

-- Parte 4. Cuatro inserciones inválidas de tipos distintos.
-- INSERT INTO roles (nombre) VALUES ('Usuario');
-- ERROR 1062 (23000) at line 1: Duplicate entry 'Usuario' for key 'roles.nombre'
-- UNIQUE en roles.nombre evita duplicar un perfil de permisos.

-- INSERT INTO clientes (id_cliente, nombre) VALUES (UUID(), NULL);
-- ERROR 1048 (23000) at line 1: Column 'nombre' cannot be null
-- NOT NULL exige un nombre para identificar al cliente en su cotización, pedido o venta.

-- INSERT INTO productos (id_producto, id_categoria, codigo, nombre, precio_venta)
-- SELECT UUID(), id_categoria, 'HER-NEG', 'Brocha plana de 2 pulgadas', -9000
-- FROM categorias WHERE nombre = 'Pintura';
-- ERROR 3819 (HY000) at line 1: Check constraint 'ck_productos_precio' is violated.
-- CHECK en productos.precio_venta rechaza un precio de catálogo negativo.

-- INSERT INTO productos (id_producto, id_categoria, codigo, nombre, precio_venta)
-- VALUES (UUID(), 65535, 'HER-FK', 'Rodillo de espuma', 12000);
-- ERROR 1452 (23000) at line 1: Cannot add or update a child row: a foreign key constraint fails (`ferre_reconstruye_entregable2`.`productos`, CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`))
-- FOREIGN KEY exige una categoría existente para poder clasificar el producto.

-- Parte 5. Ejecutar estas consultas para las capturas del PDF de evidencias.
SELECT * FROM roles ORDER BY 1;
SELECT * FROM usuarios ORDER BY 1;
SELECT * FROM clientes ORDER BY 1;
SELECT * FROM categorias ORDER BY 1;
SELECT * FROM productos ORDER BY 1;
SELECT * FROM inventario ORDER BY 1;
SELECT * FROM proveedores ORDER BY 1;
SELECT * FROM producto_proveedor ORDER BY 1;
SELECT * FROM cotizaciones ORDER BY 1;
SELECT * FROM detalle_cotizacion ORDER BY 1;
SELECT * FROM pedidos ORDER BY 1;
SELECT * FROM detalle_pedido ORDER BY 1;
SELECT * FROM ventas ORDER BY 1;
SELECT * FROM detalle_venta ORDER BY 1;
