# FerreReconstruye · productos y cotizaciones

Proyecto académico de ferretería. Se incorporó `origin/main` hasta el commit `8897ee9` (API del compañero) y se integró el módulo de cotizaciones. Cambios del nuevo módulo guardados localmente, sin publicar en GitHub.

## Abrir con Live Server

1. Abre esta carpeta en VS Code y ejecuta Live Server en `index.html` para el sitio público o en `login.html` para ingresar al sistema.
2. Ejecuta `IniciarAPI.cmd` y deja abierta su ventana. La primera vez instala las dependencias. Alternativa desde la raíz: `npm ci --ignore-scripts` y después `npm run api`.
3. Inicia sesión con tu cuenta habitual. Usa siempre el mismo host y puerto de Live Server para conservar cuentas y cotizaciones.
4. En el menú aparece **Cotizaciones**. También hay un acceso desde el dashboard.

Sin Live Server: `npm start` sirve las páginas en `http://localhost:4173`; la API requiere otra terminal con `npm run api`. Node.js 18 o posterior.

## Preparar una cotización grande

1. Ingresa nombre/razón social del cliente, identificación, contacto y dirección de obra. Ajusta emisión, vigencia, condiciones y estado.
2. Opcionalmente completa los datos reales de tu ferretería para el comprobante. No se inventaron un NIT ni datos comerciales.
3. Busca por código o nombre y agrega productos del catálogo de la API. Volver a agregar la misma referencia suma cantidades.
4. Para listas grandes, pulsa **Pegar lista / importar CSV**. Pega dos columnas de Excel o importa un archivo CSV/TXT (hasta 200 KB). Usa código y cantidad; se admiten punto y coma, coma o tabulación. Ejemplo:

```csv
codigo;cantidad
HER-001;20
HER-002;50
HER-005;3
```

Se valida toda la lista antes de agregarla. Un código desconocido, inactivo o una cantidad inválida rechaza la carga completa; se informa la fila. Los duplicados se consolidan. Se admiten hasta **1.000 referencias**.

5. Ajusta cantidades, precios unitarios, descuentos e impuestos por línea. Los precios se interpretan **antes de impuestos**. El impuesto empieza en 0%; configura los porcentajes que correspondan a tu ejercicio. Puedes aplicar descuento/impuesto a todas las líneas con confirmación. Los valores del bloque masivo también se usan para productos nuevos.
6. Agrega transporte u otros cargos finales si corresponde. No se les calcula otro impuesto automáticamente.
7. **Guardar cotización** agrega o actualiza el documento en Historial. El borrador se recupera automáticamente al recargar, incluso si aún falta completar el cliente.
8. **Vista e impresión** guarda y despliega una impresora con el total: el papel sale por la ranura con una animación de aproximadamente cuatro segundos. **Repetir animación** la vuelve a ejecutar. Se respeta la preferencia de movimiento reducido del sistema.
9. Elige **A4** para propuestas de muchas líneas o **Recibo** para un comprobante angosto. Luego pulsa **Imprimir / guardar PDF** y selecciona la impresora o Guardar como PDF. Para papel térmico configura también el tamaño de 80 mm en el controlador/diálogo de tu impresora; la aplicación prepara un contenido de 72 mm. El formato A4 permite varias páginas con encabezados de tabla repetidos.

## Automatización y cálculos

- Importes calculados en centavos, con redondeo por línea: precio × cantidad; después descuento; después impuesto sobre la base descontada. Al final se suma transporte.
- Se avisa cuando la cantidad supera las existencias. Una cotización puede incluir material pendiente de reposición; **no reserva ni descuenta inventario**.
- Se conservan código, descripción y precio cotizado aunque cambie el catálogo o se reinicie la API. **Actualizar precios de API** requiere confirmación y reemplaza solamente precios de productos activos encontrados por código.
- Cada propuesta tiene un número basado en fecha y una parte de su UUID. **Crear copia** genera otro número y conserva cliente y detalle; no modifica el documento original guardado.
- Historial permite buscar, abrir y editar. Solo se eliminan borradores con confirmación; otros documentos se pueden marcar **Anulada**. Los estados Enviada y Aceptada son registros manuales; no envían correos ni confirman pagos.
- Administrador consulta las propuestas locales de todos los usuarios; Usuario consulta las propias. La protección sigue siendo la del prototipo académico del proyecto.

## Persistencia y alcance

| Información | Almacenamiento |
|---|---|
| Productos | API Express del compañero, puerto 3000; datos en memoria |
| Usuarios / sesión | LocalStorage (`usuarios`, `usuarioSesion`) |
| Cotizaciones guardadas | LocalStorage (`ferreCotizaciones`) |
| Borrador recuperable | LocalStorage, clave por usuario `ferreBorrador:<id>` |

La API actual no usa base de datos: sus cambios se restablecen al reiniciarla. Las cotizaciones conservan sus precios y datos localmente. No se sincronizan entre computadores ni distintos orígenes del navegador. Evita editar la misma cotización en varias pestañas. Cada guardado incrementa su revisión, pero no crea un historial completo de revisiones anteriores. Guarda antes de abrir otra propuesta. Exporta PDF para conservar una copia independiente del navegador.

**El módulo se llama Cotizaciones. El documento generado se titula PREFACTURA; no es una factura fiscal ni un comprobante de pago.** El prototipo no incorpora emisión fiscal, cobros, descuentos de inventario por venta ni envío a terceros. No se guardan contraseñas en texto plano: se conserva la derivación PBKDF2 original. Usuarios y autorización en LocalStorage, y la API de productos sin autenticación de servidor, son exclusivamente académicos; no son un sistema de seguridad de producción.

## Pruebas

`npm test` ejecuta 37 pruebas automáticas: validaciones previas, contraseñas y sesión, importación masiva, cantidades y porcentajes, redondeo, límites de 1.000 líneas, selección pública, filtros, totales y ciclo real GET/POST/PUT/DELETE de productos con una API efímera aislada.

En Edge se verificaron catálogo de 100 productos, carga masiva y consolidación, descuentos/impuestos, transporte, aviso de existencias, guardado, recuperación al recargar, historial, duplicación y vistas de recibo/A4 con doce referencias. Se comprobó la animación en la página. Se invocó el diálogo de impresión; no se verificó una impresión física ni la exportación final desde el diálogo nativo del equipo.

## Integración corregida

- El dashboard carga una sola vez cada script.
- Eliminar producto ahora llama DELETE de la API, en vez de borrar una copia local.
- Las categorías ampliadas del catálogo del compañero se pueden seleccionar y editar en productos.
- La API cliente tiene un tiempo máximo de espera de 12 segundos.

CSS y JavaScript de cotizaciones se mantienen separados en `css/cotizaciones.css`, `js/cotizaciones.js` y `js/cotizacion-datos.js`. Las descripciones y datos del cliente se insertan como texto, sin interpretar HTML. Se incluyen mensajes accesibles, etiquetas de campos, navegación por teclado y diálogos cancelables con Escape.


## Fotografías de productos

Las 100 referencias iniciales incluyen fotografías de referencia guardadas en `assets/productos/`, asociadas por código en `api/data/imagenes-catalogo.json`. Se muestran en Inventario y en el catálogo de Cotizaciones. Su procedencia está registrada en `FUENTES_IMAGENES.md`. Marca y presentación de la foto pueden variar frente al artículo genérico del ejercicio.

En **Productos → Editar** puedes subir tu propia imagen PNG/JPEG/WebP (original hasta 8 MB, optimizada automáticamente a 900 px y menos de 1 MB) o pegar un enlace HTTP/HTTPS. Guarda el producto para asociar la fotografía. Las imágenes subidas y sus asociaciones se guardan en `api/data/imagenes/` y se conservan al reiniciar la API; esa carpeta se excluye de Git y debe copiarse aparte al mover el proyecto. Tus imágenes tienen prioridad sobre las fotografías iniciales. Quitar imagen se conserva como una elección explícita.

Se validan formato, contenido, tamaño, rutas y protocolos. Si una imagen no carga, se muestra una ilustración provisional. Se añadieron pruebas de subida/almacenamiento, validación de URLs y cobertura de fotografías para las 100 referencias.

## Sitio público de FerreReconstruye

`index.html` es la entrada pública: portada con presentaciones controlables, categorías, productos destacados, catálogo, explicación de cotizaciones, información del proyecto y preguntas frecuentes. El diseño toma como referencia la organización comercial del demo Workbench de Shopify (`https://retailer-main.myshopify.com/`), con implementación propia y la identidad verde y dorada de FerreReconstruye. No requiere Shopify. La fotografía principal de `assets/tienda/taller-ferre.png` se generó para este proyecto; las fotos del catálogo conservan sus fuentes documentadas.

El catálogo consulta la misma API de Productos: muestra únicamente artículos activos, búsqueda por nombre/código/categoría, filtros por categoría y existencias, orden por nombre o precio y paginación. La vista rápida permite seleccionar cantidades. Los precios públicos son precios base en COP; no se inventaron promociones, reseñas, garantías comerciales ni tarifas de entrega.

**Mi cotización** guarda códigos y cantidades en LocalStorage (`ferreListaPublica`). Permite ajustar y quitar productos, consultar el subtotal y continuar a Cotizaciones. Si hace falta iniciar sesión o registrarse, se conserva la selección y después se abre el módulo. Allí pulsa **Agregar selección de la tienda**: se validan las referencias contra la API y se incorporan a la propuesta abierta, sumando duplicados y conservando el borrador anterior. Se usan los precios vigentes de la API; no se confía en precios guardados en el navegador. Completa los datos del cliente y usa la vista animada de la **PREFACTURA** existente. No hay pasarela de pagos ni reserva de inventario.

Usa el mismo host y puerto durante todo el recorrido. Para abrirlo con el servidor incluido: deja `npm start` y `npm run api` ejecutándose en terminales separadas y visita `http://localhost:4173/`. El enlace de cuenta permite ingresar al panel administrativo.

Los archivos públicos están separados en `index.html`, `css/tienda.css`, `js/tienda.js` y `js/tienda-datos.js`. Incluyen menú móvil, diálogos nativos accesibles, etiquetas de formulario, mensajes de estado, foco visible, enlace para saltar al contenido y respeto por movimiento reducido. El carrusel comienza pausado y puede controlarse manualmente.

