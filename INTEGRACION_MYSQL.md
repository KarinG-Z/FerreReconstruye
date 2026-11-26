# Integración de FerreReconstruye con Express y MySQL

Esta guía explica qué archivos intervienen, cómo preparar otro equipo y cómo demostrar la integración. El [guion de exposición](output/pdf/Exposicion_Integracion_FerreReconstruye.pdf) reparte la demostración entre los cuatro integrantes.

## 1. Qué componente hace cada trabajo

| Componente | Dirección o archivo | Responsabilidad |
|---|---|---|
| Web local | `http://localhost:4173` | Muestra formularios, catálogo, panel y pantallas de administración. |
| Cliente JavaScript | `js/api.js` | Envía solicitudes con `fetch`, incluye la cookie de sesión e interpreta el JSON o el mensaje de error. |
| API Express | `http://localhost:3000/api` | Selecciona la ruta, valida la entrada, controla permisos y envía SQL mediante `mysql2`. |
| MySQL en Ubuntu WSL 2 | `127.0.0.1:33919` | Ejecuta SQL y almacena las filas. Sus restricciones protegen la integridad de los datos. |
| Workbench | Conexión al puerto `33919` | Permite comprobar de forma independiente los cambios hechos por la aplicación. |

`api/app.js` monta las rutas y prueba `SELECT 1` antes de abrir el puerto HTTP. `api/database.js` lee la configuración privada de `.env` y crea un *pool* con hasta cinco conexiones reutilizables. `GET /api/conexion` devuelve la base activa y el puerto que reporta MySQL. La copia anterior de phpMyAdmin en Windows usa otra instancia, en el puerto `33918`.

## 2. Registro, login y permisos

1. `js/registro.js` lee los campos del formulario y llama a `POST /api/registro`. Express asigna el rol **Usuario**. Así el registro público no puede otorgar permisos de administrador.
2. `api/services/usuarios.js` valida nombre, apellido, correo, estado y rol. Genera un UUID y deriva la contraseña mediante PBKDF2-SHA256 con sal aleatoria, 210.000 iteraciones y una salida de 32 bytes. El `INSERT` guarda la credencial derivada, la sal y sus parámetros en `usuarios`. Una clave foránea en `id_rol` relaciona la cuenta con `roles`.
3. `js/login.js` llama a `POST /api/login`. El servicio busca por correo con un parámetro `?`, comprueba el estado, vuelve a derivar la contraseña y compara el resultado. La contraseña y las columnas de credencial se quedan en el servidor.
4. `api/routes/cuentas.routes.js` crea un identificador aleatorio de sesión y lo envía en una cookie `HttpOnly`. La sesión vive en la memoria de Express durante un máximo de ocho horas. El middleware consulta el rol y el estado actuales en MySQL al atender operaciones protegidas.
5. `js/sesion.js` consulta `GET /api/sesion` antes de inicializar el panel, los formularios protegidos y las cotizaciones. `POST /api/logout` invalida la sesión. Después de reiniciar Express se inicia sesión nuevamente con la cuenta que permanece en MySQL.

## 3. CRUD de usuarios

| Acción | API | SQL y efecto |
|---|---|---|
| Crear desde administración | `POST /api/usuarios` | `INSERT` de una cuenta con los campos validados. |
| Listar o buscar por ID | `GET /api/usuarios` o `GET /api/usuarios/:id` | `SELECT` con `JOIN roles`. Al buscar por ID, se filtra por la llave primaria. |
| Editar, activar o desactivar | `PUT /api/usuarios/:id` | `UPDATE ... WHERE id_usuario = ?`. Si el campo de contraseña se deja vacío, se conserva la credencial anterior. |
| Eliminar | `DELETE /api/usuarios/:id` | `DELETE ... WHERE id_usuario = ?`. Una clave foránea puede bloquear el borrado y la API devuelve un conflicto. |

El navegador usa `js/crud.js` para actualizar el listado después de cada petición. Las cuatro operaciones administrativas requieren un administrador activo. El servicio comprueba dentro de una transacción que no se desactive, degrade o elimine al último administrador activo.

## 4. CRUD de productos e inventario

`api/routes/producto.mysql.routes.js` implementa `GET /api/productos`, `GET /api/productos/:id`, `POST /api/productos`, `PUT /api/productos/:id` y `DELETE /api/productos/:id`. El catálogo público puede consultar. Las escrituras requieren el rol Administrador.

La lectura une `productos` con `categorias` por `id_categoria` y con `inventario` por `id_producto`. Las columnas se adaptan a la pantalla existente: `precio_venta AS precio` y `stock_actual AS cantidad`. Así el catálogo, el dashboard y el selector de productos de Cotizaciones siguen usando el mismo formato de respuesta.

Para guardar un producto, la API valida código, categoría, precio y stock. Dentro de una misma transacción escribe los datos del artículo en `productos` y las existencias en `inventario`. Si ambas operaciones salen bien, hace `COMMIT`. Si falla una, hace `ROLLBACK`. Si el producto tiene movimientos históricos que bloquean su borrado, se puede desactivar desde el editor.

## 5. Arrancar o reproducir en otro equipo

1. Abre Ubuntu con `wsl -d Ubuntu`. Dentro de Ubuntu inicia el servicio con `sudo systemctl start mysql` y deja la terminal abierta. En este equipo se configuró MySQL para escuchar en `33919`.
2. En una instalación nueva, importa [el SQL de la base](FerreReconstruye.mysql.sql) una vez en el MySQL de Ubuntu. En un servidor que ya tiene `ferre_reconstruye_entregable2`, usa esa base.
3. En la consola administrativa de MySQL crea la cuenta de la API si aún falta. MySQL mostrará la contraseña generada. Guárdala en el `.env` local.

```sql
CREATE USER 'ferre_api'@'localhost' IDENTIFIED BY RANDOM PASSWORD;
GRANT SELECT ON ferre_reconstruye_entregable2.roles TO 'ferre_api'@'localhost';
GRANT SELECT ON ferre_reconstruye_entregable2.categorias TO 'ferre_api'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON ferre_reconstruye_entregable2.usuarios TO 'ferre_api'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON ferre_reconstruye_entregable2.productos TO 'ferre_api'@'localhost';
GRANT SELECT, INSERT, UPDATE ON ferre_reconstruye_entregable2.inventario TO 'ferre_api'@'localhost';
```

4. En la raíz del repositorio, copia `.env.example` a `.env` y completa host, puerto, base, usuario y contraseña. Usa el puerto de tu servidor. Ejecuta `npm ci`, inicia Express con `npm run api` y abre `http://localhost:3000/api/conexion`.
5. En otra terminal ejecuta `npm start` y abre `http://localhost:4173`. Para crear un administrador inicial, usa PowerShell 7 con MySQL activo.

```powershell
$env:FERRE_ADMIN_EMAIL = Read-Host 'Correo del administrador'
$env:FERRE_ADMIN_PASSWORD = Read-Host -MaskInput 'Contraseña'
npm run admin
Remove-Item Env:FERRE_ADMIN_PASSWORD
```

## 6. Qué demostrar y qué queda local

| Integrante | Demostración | Qué debe explicar |
|---|---|---|
| Michael | Mostrar `/api/conexion` y Workbench | La diferencia entre el puerto HTTP de Express y el puerto SQL de MySQL. |
| Sirley | Crear, buscar, editar y eliminar un usuario temporal | Los métodos HTTP, sus operaciones SQL y la llave primaria. |
| Karina | Registrar otra cuenta, entrar y salir | La contraseña derivada, la cookie y cómo Express verifica el rol. |
| Santiago | Crear un producto temporal y editar su stock | La relación entre producto e inventario, la transacción y la persistencia. |

Para demostrar persistencia, consulta en Workbench el usuario o producto temporal, reinicia Express, abre sesión de nuevo y vuelve a consultar. La integración se probó contra MySQL de Ubuntu con ese recorrido. Las cotizaciones, sus borradores y la selección pública siguen en el navegador. Las cuentas antiguas de LocalStorage requieren un nuevo registro o una migración explícita que preserve sus IDs.
