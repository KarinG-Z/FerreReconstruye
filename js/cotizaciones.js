'use strict';
(() => {
  if (!usuarioActual) return;
  const $ = id => document.getElementById(id);
  const D = FerreCotDatos;
  const CLAVE = 'ferreCotizaciones';
  const borradorClave = 'ferreBorrador:' + usuarioActual.id;
  let catalogo = [], pagina = 0, documento, temporizador, confirmarAccion, cargando = false;
  const campos = ['cliente', 'identificacion', 'telefono', 'correoCliente', 'direccion', 'fecha', 'vigencia', 'estadoCotizacion', 'observaciones', 'empresa', 'nitEmpresa', 'contactoEmpresa', 'direccionEmpresa'];
  const hoy = () => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const fechaLegible = fecha => new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  const dinero = centavos => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(centavos / 100);
  function exigirSesion() {
    const actual = Ferre.sesion();
    D.numero(actual ? 1 : 0, 'Sesión activa', 1, 1);
    if (documento && documento.creadorId !== actual.id && actual.rol !== 'Administrador') throw Error('Esta cotización pertenece a otro usuario.');
    return actual;
  }
  function proteger(accion) {
    return async (...args) => { try { exigirSesion(); await accion(...args); } catch (e) { Ferre.mensaje(e.message, true); } };
  }
  function crear() {
    const id = crypto.randomUUID(); const fecha = hoy(); const hasta = new Date(fecha + 'T12:00:00'); hasta.setDate(hasta.getDate() + 15);
    return { id, numero: `COT-${fecha.replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`, creadorId: usuarioActual.id, asesor: `${usuarioActual.nombre} ${usuarioActual.apellido}`, fecha, vigencia: `${hasta.getFullYear()}-${String(hasta.getMonth()+1).padStart(2,'0')}-${String(hasta.getDate()).padStart(2,'0')}`, estado: 'Borrador', cliente: {}, empresa: { nombre: 'FerreReconstruye' }, items: [], transporte: 0, observaciones: '' };
  }
  function sincronizar() {
    const valor = id => $(id).value.trim();
    Object.assign(documento, { cliente: { nombre: valor('cliente'), identificacion: valor('identificacion'), telefono: valor('telefono'), correo: valor('correoCliente'), direccion: valor('direccion') }, empresa: { nombre: valor('empresa'), nit: valor('nitEmpresa'), contacto: valor('contactoEmpresa'), direccion: valor('direccionEmpresa') }, fecha: valor('fecha'), vigencia: valor('vigencia'), estado: valor('estadoCotizacion'), observaciones: valor('observaciones'), transporte: $('transporte').value });
    documento.descuentoPredeterminado = $('descuentoGlobal').value;
    documento.impuestoPredeterminado = $('ivaGlobal').value;
  }
  function mostrarDocumento(doc) {
    clearTimeout(temporizador); documento = structuredClone(doc);
    const valores = [doc.cliente.nombre, doc.cliente.identificacion, doc.cliente.telefono, doc.cliente.correo, doc.cliente.direccion, doc.fecha, doc.vigencia, doc.estado, doc.observaciones, doc.empresa.nombre, doc.empresa.nit, doc.empresa.contacto, doc.empresa.direccion];
    campos.forEach((campo, i) => $(campo).value = valores[i] ?? ''); $('transporte').value = doc.transporte ?? 0;
    $('descuentoGlobal').value = doc.descuentoPredeterminado ?? 0;
    $('ivaGlobal').value = doc.impuestoPredeterminado ?? 0;
    $('numeroDocumento').textContent = doc.numero;
    $('autoguardado').textContent = doc.actualizado ? 'Documento recuperado' : 'Borrador local';
    pintarLineas();
  }
  function autoguardar() {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      try { exigirSesion(); sincronizar(); Ferre.guardar(borradorClave, documento); $('autoguardado').textContent = 'Borrador recuperable · ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }); }
      catch (e) { $('autoguardado').textContent = 'No se pudo guardar el borrador'; Ferre.mensaje(e.message, true); }
    }, 350);
  }
  function pedirConfirmacion(texto, accion) {
    confirmarAccion = accion; $('textoConfirmacion').textContent = texto; $('errorConfirmacion').textContent = ''; $('dialogoConfirmacion').showModal();
  }
  $('aceptarConfirmacion').addEventListener('click', () => {
    try { exigirSesion(); confirmarAccion(); $('dialogoConfirmacion').close(); }
    catch (e) { $('errorConfirmacion').textContent = e.message; }
  });
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => $(b.dataset.cerrar).close()));
  function boton(texto, accion, clase = 'accion') {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.className = clase; b.addEventListener('click', proteger(accion)); return b;
  }
  function textoNodo(tag, texto, clase) { const n = document.createElement(tag); n.textContent = texto; if (clase) n.className = clase; return n; }
  function totales() {
    try {
      const t = D.calcular(documento.items, $('transporte').value);
      for (const [id, k] of Object.entries({ subtotal: 'bruto', descuentos: 'rebaja', base: 'base', impuestos: 'impuesto', totalTransporte: 'transporte', totalCotizacion: 'total' })) $(id).textContent = dinero(t[k]);
      $('cantidadLineas').textContent = documento.items.length;
      $('detalleVacio').hidden = !!documento.items.length;
    } catch (e) { $('totalCotizacion').textContent = 'Revisa los valores'; Ferre.mensaje(e.message, true); }
  }
  function alertas() {
    let faltantes = 0, cambios = 0, retirados = 0;
    for (const item of documento.items) {
      const actual = catalogo.find(p => p.codigo === item.codigo);
      if (!actual || actual.estado !== 'Activo') retirados++;
      else { if (Number(item.cantidad) > actual.cantidad) faltantes++; if (Number(item.precio) !== Number(actual.precio)) cambios++; }
    }
    const mensajes = [];
    if (faltantes) mensajes.push(`${faltantes} referencia(s) superan las existencias disponibles; requieren reposición.`);
    if (cambios) mensajes.push(`${cambios} precio(s) difieren del catálogo: se conserva el precio cotizado.`);
    if (retirados && catalogo.length) mensajes.push(`${retirados} producto(s) están inactivos o ya no aparecen en el catálogo.`);
    $('alertaStock').textContent = mensajes.join(' '); $('alertaStock').hidden = !mensajes.length;
  }
  function pintarLineas() {
    $('lineasCotizacion').replaceChildren(); const fragmento = document.createDocumentFragment();
    documento.items.forEach((item, indice) => {
      const fila = document.createElement('tr');
      const producto = document.createElement('td'); producto.append(textoNodo('strong', item.nombre), textoNodo('small', item.codigo)); fila.append(producto);
      for (const [campo, etiqueta, max, paso] of [['cantidad','Cantidad',10000000,1],['precio','Precio',1e10,.01],['descuento','Descuento',100,.01],['iva','Impuesto',100,.01]]) {
        const td = document.createElement('td'), input = document.createElement('input');
        Object.assign(input, { type: 'number', min: campo === 'cantidad' ? '1' : '0', max: String(max), step: String(paso), value: item[campo] }); input.setAttribute('aria-label', `${etiqueta} de ${item.codigo}`);
        input.addEventListener('change', () => {
          try { exigirSesion(); const nuevo = { ...item, [campo]: input.value }; D.linea(nuevo); Object.assign(item, nuevo); totalLinea.textContent = dinero(D.linea(item).total); totales(); alertas(); autoguardar(); }
          catch (e) { input.value = item[campo]; Ferre.mensaje(e.message, true); }
        }); td.append(input); fila.append(td);
      }
      const totalLinea = textoNodo('td', dinero(D.linea(item).total), 'importe-linea'); fila.append(totalLinea);
      const acciones = document.createElement('td'); const quitar = boton('Quitar', () => { documento.items.splice(indice, 1); pintarLineas(); autoguardar(); }); quitar.setAttribute('aria-label', `Quitar ${item.codigo}`); acciones.append(quitar); fila.append(acciones); fragmento.append(fila);
    });
    $('lineasCotizacion').append(fragmento); totales(); alertas();
  }
  function agregar(entradas) {
    const copia = structuredClone(documento.items);
    for (const { producto: p, cantidad } of entradas) {
      const item = copia.find(x => x.codigo === p.codigo);
      if (item) { item.cantidad = Number(item.cantidad) + cantidad; D.linea(item); }
      else copia.push({ productoId: p.id, codigo: p.codigo, nombre: p.nombre, cantidad, precio: p.precio, descuento: D.numero($('descuentoGlobal').value, 'Descuento', 0, 100), iva: D.numero($('ivaGlobal').value, 'Impuesto', 0, 100) });
    }
    D.calcular(copia, $('transporte').value); documento.items = copia; pintarLineas(); autoguardar();
  }
  function pintarCatalogo() {
    const q = $('buscarCatalogo').value.trim().toLocaleLowerCase('es');
    const resultado = catalogo.filter(p => p.estado === 'Activo' && [p.codigo, p.nombre].some(x => x.toLocaleLowerCase('es').includes(q)));
    const paginas = Math.max(1, Math.ceil(resultado.length / 12)); pagina = Math.min(pagina, paginas - 1);
    $('listaCatalogo').replaceChildren();
    for (const p of resultado.slice(pagina * 12, pagina * 12 + 12)) {
      const div = document.createElement('div'); div.className = 'producto-cot';
      const info = document.createElement('div'); info.append(textoNodo('small', `${p.codigo} · ${p.cantidad} disponibles`), textoNodo('strong', p.nombre), textoNodo('span', Ferre.dinero(p.precio)));
      const b = boton('+', () => { agregar([{ producto: p, cantidad: 1 }]); Ferre.mensaje(`${p.codigo} agregado a la propuesta.`); }, 'agregar-producto'); b.setAttribute('aria-label', `Agregar ${p.codigo} ${p.nombre}`); div.append(FerreFotos.crear(p.imagen, p.nombre, 'foto-catalogo'), info, b); $('listaCatalogo').append(div);
    }
    $('paginaCatalogo').textContent = `${pagina + 1} / ${paginas}`;
    $('anteriorCatalogo').disabled = pagina === 0; $('siguienteCatalogo').disabled = pagina === paginas - 1;
    $('estadoCatalogo').textContent = `${resultado.length} productos activos · precios antes de impuestos`;
  }
  async function cargarCatalogo() {
    if (cargando) return false; cargando = true; $('recargarCatalogo').disabled = true;
    try {
      const respuesta = await FerreApi.listarProductos();
      if (!Array.isArray(respuesta.productos)) throw Error('El catálogo recibido no es válido.');
      catalogo = respuesta.productos; pintarCatalogo(); alertas(); mostrarSeleccionPublica(); return true;
    } catch (e) { $('estadoCatalogo').textContent = 'API sin conexión. Puedes consultar e imprimir propuestas guardadas.'; Ferre.mensaje(e.message, true); return false; }
    finally { cargando = false; $('recargarCatalogo').disabled = false; }
  }
  $('buscarCatalogo').addEventListener('input', () => { pagina = 0; pintarCatalogo(); });
  function mostrarSeleccionPublica() {
    const anterior = document.getElementById('seleccionPublica');
    if (anterior) anterior.remove();
    try {
      const seleccion = FerreTiendaDatos.normalizar(JSON.parse(localStorage.getItem(FerreTiendaDatos.CLAVE) || '[]'));
      if (!seleccion.length) return;
      const aviso = document.createElement('section'); aviso.id = 'seleccionPublica'; aviso.className = 'seleccion-publica'; aviso.setAttribute('aria-label','Productos seleccionados en el sitio público');
      aviso.append(textoNodo('strong', `Tu selección de la tienda: ${seleccion.length} referencia(s)`), textoNodo('p','Agrega estos productos a la cotización que tienes abierta. Puedes guardarla e iniciar una nueva antes de agregarlos.'));
      aviso.append(boton('Agregar selección de la tienda', () => {
        const actual = FerreTiendaDatos.normalizar(JSON.parse(localStorage.getItem(FerreTiendaDatos.CLAVE) || '[]'));
        const entradas = D.importar(actual.map(x => `${x.codigo};${x.cantidad}`).join('\n'), catalogo);
        agregar(entradas);
        localStorage.removeItem(FerreTiendaDatos.CLAVE); aviso.remove();
        Ferre.mensaje('Selección agregada. Completa los datos para preparar tu PREFACTURA.');
      }, 'primario'));
      document.querySelector('.contenido-protegido').prepend(aviso);
    } catch(e) { Ferre.mensaje(`No se pudo recuperar la selección de la tienda: ${e.message}`, true); }
  }
  $('anteriorCatalogo').addEventListener('click', () => { pagina--; pintarCatalogo(); });
  $('siguienteCatalogo').addEventListener('click', () => { pagina++; pintarCatalogo(); });
  $('recargarCatalogo').addEventListener('click', proteger(cargarCatalogo));
  $('aplicarPorcentajes').addEventListener('click', proteger(() => {
    const descuento = D.numero($('descuentoGlobal').value, 'Descuento', 0, 100), iva = D.numero($('ivaGlobal').value, 'Impuesto', 0, 100);
    pedirConfirmacion('Se reemplazarán el descuento y el impuesto de todas las líneas por los valores indicados.', () => { documento.items.forEach(x => Object.assign(x, { descuento, iva })); pintarLineas(); autoguardar(); });
  }));
  $('actualizarPrecios').addEventListener('click', proteger(async () => {
    if (!await cargarCatalogo()) return;
    pedirConfirmacion('Los precios unitarios de la propuesta se reemplazarán con los precios del catálogo disponible. Las cantidades y descuentos se conservarán.', () => {
      const copia = documento.items.map(x => { const p = catalogo.find(p => p.codigo === x.codigo && p.estado === 'Activo'); return p ? { ...x, productoId: p.id, precio: p.precio } : x; });
      D.calcular(copia, $('transporte').value); documento.items = copia; pintarLineas(); autoguardar();
    });
  }));
  $('cargaMasiva').addEventListener('click', () => { $('errorMasivo').textContent = ''; $('dialogoMasivo').showModal(); });
  $('archivoCSV').addEventListener('change', async event => {
    const archivo = event.target.files[0]; if (!archivo) return;
    if (archivo.size > 200000) { $('errorMasivo').textContent = 'El archivo debe pesar menos de 200 KB.'; return; }
    $('textoMasivo').value = await archivo.text();
  });
  $('importarLista').addEventListener('click', () => {
    try { exigirSesion(); agregar(D.importar($('textoMasivo').value, catalogo)); $('dialogoMasivo').close(); Ferre.mensaje('Lista validada y agregada. Los códigos repetidos se consolidaron.'); }
    catch (e) { $('errorMasivo').textContent = e.message; }
  });
  function guardar() {
    exigirSesion();
    for (const campo of $('datosCotizacion').querySelectorAll('input, select, textarea')) {
      if (!campo.checkValidity()) {
        const seccion = campo.closest('details'); if (seccion) seccion.open = true;
        campo.reportValidity(); throw Error('Revisa los datos obligatorios del cliente y las condiciones.');
      }
    }
    sincronizar(); documento.totales = D.validarDocumento(documento); documento.actualizado = new Date().toISOString();
    const guardadas = Ferre.leer(CLAVE), anterior = guardadas.find(x => x.id === documento.id);
    if (anterior && anterior.creadorId !== usuarioActual.id && usuarioActual.rol !== 'Administrador') throw Error('No tienes permiso para modificar esta propuesta.');
    documento.revision = (anterior?.revision || 0) + 1;
    Ferre.guardar(CLAVE, [...guardadas.filter(x => x.id !== documento.id), structuredClone(documento)]);
    clearTimeout(temporizador); Ferre.guardar(borradorClave, documento); $('autoguardado').textContent = 'Guardada · revisión ' + documento.revision;
    Ferre.mensaje(`${documento.numero} guardada correctamente.`);
  }
  $('guardarCotizacion').addEventListener('click', proteger(guardar));
  $('datosCotizacion').addEventListener('submit', event => event.preventDefault());
  $('datosCotizacion').addEventListener('input', autoguardar);
  $('descuentoGlobal').addEventListener('input', autoguardar);
  $('ivaGlobal').addEventListener('input', autoguardar);
  $('transporte').addEventListener('input', () => { totales(); autoguardar(); });
  $('nueva').addEventListener('click', proteger(() => {
    pedirConfirmacion('Se abrirá una propuesta vacía. Guarda la actual si quieres conservarla en el historial antes de continuar.', () => { mostrarDocumento(crear()); autoguardar(); });
  }));
  $('duplicar').addEventListener('click', proteger(() => {
    sincronizar(); const copia = structuredClone(documento), nueva = crear();
    Object.assign(copia, { id: nueva.id, numero: nueva.numero, creadorId: nueva.creadorId, asesor: nueva.asesor, fecha: nueva.fecha, vigencia: nueva.vigencia, estado: 'Borrador', actualizado: null, revision: 0 }); mostrarDocumento(copia); autoguardar(); Ferre.mensaje('Copia creada con un número nuevo. La propuesta original se conserva en el historial si fue guardada.');
  }));
  function pintarHistorial() {
    const q = $('buscarHistorial').value.trim().toLowerCase(); $('listaHistorial').replaceChildren();
    const guardadas = Ferre.leer(CLAVE).filter(x => (x.creadorId === usuarioActual.id || usuarioActual.rol === 'Administrador') && `${x.numero} ${x.cliente.nombre}`.toLowerCase().includes(q)).sort((a,b) => b.actualizado.localeCompare(a.actualizado));
    if (!guardadas.length) $('listaHistorial').append(textoNodo('p', 'No hay cotizaciones guardadas para esta búsqueda.', 'ayuda'));
    for (const x of guardadas) {
      const div = document.createElement('div'); div.className = 'historial-item'; div.append(textoNodo('strong', x.numero), textoNodo('p', `${x.cliente.nombre} · ${x.estado} · ${dinero(x.totales.total)}`));
      div.append(boton('Abrir', () => {
        if (documento.id === x.id) { mostrarDocumento(x); $('dialogoHistorial').close(); autoguardar(); return; }
        pedirConfirmacion(`Se abrirá ${x.numero}. Guarda la propuesta actual antes de continuar si quieres conservarla en el historial.`, () => {
          mostrarDocumento(x); $('dialogoHistorial').close(); autoguardar();
        });
      }));
      if (x.estado === 'Borrador') div.append(boton('Eliminar borrador', () => {
        pedirConfirmacion(`Se eliminará ${x.numero} del historial.`, () => {
          Ferre.guardar(CLAVE, Ferre.leer(CLAVE).filter(y => y.id !== x.id));
          if (documento.id === x.id) { mostrarDocumento(crear()); autoguardar(); } pintarHistorial();
        });
      })); $('listaHistorial').append(div);
    }
  }
  $('abrirHistorial').addEventListener('click', proteger(() => { pintarHistorial(); $('dialogoHistorial').showModal(); }));
  $('buscarHistorial').addEventListener('input', proteger(pintarHistorial));
  function comprobante() {
    const doc = documento, t = D.validarDocumento(doc), papel = $('comprobante'); papel.replaceChildren();
    const cabecera = document.createElement('header'); cabecera.className = 'recibo-cabecera';
    const logo = document.createElement('img'); logo.src = 'assets/marca.svg'; logo.alt = ''; cabecera.append(logo, textoNodo('h2', doc.empresa.nombre));
    if (doc.empresa.nit) cabecera.append(textoNodo('p', `NIT / ID: ${doc.empresa.nit}`));
    for (const v of [doc.empresa.direccion, doc.empresa.contacto]) if (v) cabecera.append(textoNodo('p', v));
    cabecera.append(textoNodo('h3', 'PREFACTURA'), textoNodo('strong', doc.numero), textoNodo('p', `Estado: ${doc.estado} · Revisión ${doc.revision}`)); papel.append(cabecera);
    const datos = document.createElement('section'); datos.className = 'recibo-datos';
    for (const [k,v] of [['Cliente',doc.cliente.nombre],['Identificación',doc.cliente.identificacion],['Contacto',[doc.cliente.telefono,doc.cliente.correo].filter(Boolean).join(' · ')],['Obra / dirección',doc.cliente.direccion],['Emisión',fechaLegible(doc.fecha)],['Válida hasta',fechaLegible(doc.vigencia)],['Asesor',doc.asesor]]) if (v) { const par = document.createElement('p'); par.append(textoNodo('strong', k + ': '), document.createTextNode(v)); datos.append(par); } papel.append(datos);
    const tabla = document.createElement('table'); tabla.className = 'recibo-tabla';
    const head = document.createElement('thead'), tr = document.createElement('tr');
    for (const texto of ['Descripción / código','Cant.','P. unitario','Desc.','Imp.','Importe']) { const th = textoNodo('th',texto); th.scope = 'col'; tr.append(th); } head.append(tr); tabla.append(head);
    const cuerpo = document.createElement('tbody');
    for (const item of doc.items) {
      const fila = document.createElement('tr'), descripcion = document.createElement('td'); descripcion.append(textoNodo('strong',item.nombre),textoNodo('small',item.codigo)); fila.append(descripcion);
      for (const v of [item.cantidad,Ferre.dinero(item.precio),`${item.descuento}%`,`${item.iva}%`,dinero(D.linea(item).total)]) fila.append(textoNodo('td', v)); cuerpo.append(fila);
    }
    tabla.append(cuerpo); papel.append(tabla);
    const resumen = document.createElement('dl'); resumen.className = 'recibo-totales';
    for (const [k,v] of [['Subtotal bruto',t.bruto],['Descuentos',t.rebaja],['Base neta',t.base],['Impuestos',t.impuesto],['Transporte / otros',t.transporte],['TOTAL PREFACTURA · COP',t.total]]) { const fila = document.createElement('div'); fila.append(textoNodo('dt',k),textoNodo('dd',dinero(v))); resumen.append(fila); } papel.append(resumen);
    if (doc.observaciones) { const notas = textoNodo('p', doc.observaciones, 'recibo-notas'); papel.append(notas); }
    papel.append(textoNodo('p', 'Precios unitarios antes de impuestos. Sujeto a disponibilidad. Esta prefactura no reserva existencias, no acredita pago y no es una factura fiscal.', 'recibo-aviso'),textoNodo('p', 'Gracias por construir con nosotros.', 'recibo-gracias'),textoNodo('p', doc.numero, 'recibo-folio'));
    $('importeImpresora').textContent = dinero(t.total);
  }
  $('vistaPrevia').addEventListener('click', proteger(() => { guardar(); comprobante(); $('dialogoImpresion').showModal(); animarImpresion(); }));
  function animarImpresion() {
    const dialogo = $('dialogoImpresion');
    dialogo.classList.remove('animando');
    dialogo.style.setProperty('--alto-papel', ($('comprobante').scrollHeight + 40) + 'px');
    void dialogo.offsetWidth;
    dialogo.classList.add('animando');
    $('estadoImpresion').textContent = 'Imprimiendo tu propuesta…';
    clearTimeout(animarImpresion.fin);
    animarImpresion.fin = setTimeout(() => { dialogo.classList.remove('animando'); $('estadoImpresion').textContent = 'Comprobante listo para entregar.'; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 3900);
  }
  $('repetirAnimacion').addEventListener('click', animarImpresion);
  $('formatoImpresion').addEventListener('change', () => { $('comprobante').className = 'comprobante ' + $('formatoImpresion').value; animarImpresion(); });
  $('imprimir').addEventListener('click', proteger(() => {
    clearTimeout(animarImpresion.fin); $('dialogoImpresion').classList.remove('animando');
    $('estadoImpresion').textContent = 'Comprobante listo para entregar.';
    document.body.dataset.impresion = $('formatoImpresion').value; window.print();
  }));
  window.addEventListener('afterprint', () => delete document.body.dataset.impresion);
  window.addEventListener('beforeunload', () => {
    try { if (Ferre.sesion()) { sincronizar(); Ferre.guardar(borradorClave, documento); } } catch { /* No impedir la salida del navegador. */ }
  });
  try {
    const almacenado = localStorage.getItem(borradorClave), doc = almacenado ? JSON.parse(almacenado) : crear();
    if (!doc?.id || !doc.cliente || !doc.empresa || !Array.isArray(doc.items)) throw Error('El borrador no es compatible. Se conservó sin sobrescribir.');
    mostrarDocumento(doc); cargarCatalogo();
  } catch (e) { documento = crear(); mostrarDocumento(documento); cargarCatalogo(); Ferre.mensaje(`No se pudo recuperar el borrador: ${e.message}`, true); }
})();
