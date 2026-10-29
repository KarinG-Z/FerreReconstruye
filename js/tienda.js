'use strict';
(() => {
  const $ = id => document.getElementById(id), D = FerreTiendaDatos;
  let productos = [], lista = [], pagina = 0, categoriaDestacada = 'todos', slide = 0, reloj, detalleActual;
  const porPagina = 12;
  const dinero = n => Ferre.dinero(n);
  function aviso(mensaje, error = false) {
    $('mensajePublico').textContent = mensaje; $('mensajePublico').className = 'toast-tienda visible' + (error ? ' error' : '');
    clearTimeout(aviso.fin); aviso.fin = setTimeout(() => $('mensajePublico').classList.remove('visible'), 5000);
  }
  function seguro(accion) { return (...args) => { try { return accion(...args); } catch (e) { aviso(e.message, true); } }; }
  function nodo(tag, texto, clase) { const n = document.createElement(tag); if (texto !== undefined) n.textContent = texto; if (clase) n.className = clase; return n; }
  function boton(texto, accion, clase) { const b = nodo('button', texto, clase); b.type = 'button'; b.addEventListener('click', seguro(accion)); return b; }
  function guardarLista(nueva) {
    const limpia = D.normalizar(nueva); D.resumen(limpia, productos);
    try { localStorage.setItem(D.CLAVE, JSON.stringify(limpia)); } catch { throw Error('No pudimos guardar tu lista en este navegador. Revisa el espacio disponible.'); }
    lista = limpia; contador();
  }
  function contador() { const n = lista.reduce((s, x) => s + x.cantidad, 0); $('contadorLista').textContent = n > 999 ? '999+' : n; $('abrirLista').setAttribute('aria-label', `Abrir mi cotización, ${lista.length} referencias`); }
  function agregar(codigo, cantidad = 1) {
    const p = productos.find(x => x.codigo === codigo && x.estado === 'Activo'); if (!p) throw Error('Este producto ya no está disponible.');
    guardarLista(D.agregar(lista, codigo, cantidad)); aviso(`${p.nombre} agregado a tu cotización.`);
  }
  function tarjeta(p) {
    const articulo = nodo('article', undefined, 'tarjeta-producto');
    const foto = boton('', () => abrirDetalle(p), 'tarjeta-foto'); foto.setAttribute('aria-label', `Ver ${p.nombre}`); foto.append(FerreFotos.crear(p.imagen, p.nombre, 'imagen-publica'));
    foto.append(nodo('span', 'Vista rápida ↗', 'vista-rapida'));
    const info = nodo('div', undefined, 'tarjeta-info'); info.append(nodo('p', p.categoria, 'categoria-producto'));
    const h = nodo('h3'); h.append(boton(p.nombre, () => abrirDetalle(p), 'nombre-producto')); info.append(h, nodo('small', p.codigo, 'codigo-producto'));
    const pie = nodo('div', undefined, 'tarjeta-precio'); pie.append(nodo('strong', dinero(p.precio)), nodo('span', p.cantidad > 0 ? 'Con existencias' : 'Consultar disponibilidad', 'stock-publico'));
    const b = boton('+ Cotizar', () => agregar(p.codigo), 'agregar-publico'); b.setAttribute('aria-label', `Agregar ${p.codigo} a mi cotización`); info.append(pie, b); articulo.append(foto, info); return articulo;
  }
  function filtros() { return { q: $('busquedaTienda').value, categoria: $('categoriaPublica').value, disponibles: $('soloDisponibles').checked, orden: $('ordenPublico').value }; }
  function actualizarUrl() {
    const url = new URL(location.href), f = filtros();
    for (const k of ['q', 'categoria', 'orden']) { if (f[k] && !(k === 'orden' && f[k] === 'nombre')) url.searchParams.set(k, f[k]); else url.searchParams.delete(k); }
    if (f.disponibles) url.searchParams.set('disponibles', '1'); else url.searchParams.delete('disponibles');
    url.searchParams.delete('producto'); history.replaceState(null, '', url);
  }
  function pintarCatalogo() {
    const resultado = D.filtrar(productos, filtros()), paginas = Math.max(1, Math.ceil(resultado.length / porPagina)); pagina = Math.max(0, Math.min(pagina, paginas - 1));
    $('productosPublicos').replaceChildren(...resultado.slice(pagina * porPagina, (pagina + 1) * porPagina).map(tarjeta));
    $('conteoCatalogo').textContent = `${resultado.length} ${resultado.length === 1 ? 'producto' : 'productos'}${$('busquedaTienda').value.trim() ? ' para «' + $('busquedaTienda').value.trim() + '»' : ''}`;
    $('sinProductos').hidden = !!resultado.length; $('paginaActual').textContent = `${pagina + 1} / ${paginas}`; $('paginaAnterior').disabled = pagina === 0; $('paginaSiguiente').disabled = pagina === paginas - 1;
    actualizarUrl();
  }
  function irCatalogo() { $('catalogo').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  function aplicarCategoria(categoria) { $('categoriaPublica').value = categoria; pagina = 0; $('busquedaTienda').value = ''; pintarCatalogo(); irCatalogo(); }
  function pintarCategorias() {
    const grupos = [['Herramientas eléctricas', 'POTENCIA PARA TU TALLER', 'HER-018'], ['Herramientas', 'LOS ESENCIALES DE SIEMPRE', 'HER-001'], ['Construcción', 'UNA BASE PARA CADA OBRA', 'HER-094'], ['Seguridad industrial', 'EQUÍPATE PARA AVANZAR', 'HER-058']];
    $('tarjetasCategorias').replaceChildren();
    for (const [categoria, ceja, codigo] of grupos) {
      const cantidad = productos.filter(x => x.estado === 'Activo' && x.categoria === categoria).length;
      const p = productos.find(x => x.codigo === codigo), a = nodo('a', undefined, 'categoria-visual'); a.href = '?categoria=' + encodeURIComponent(categoria) + '#catalogo';
      const imagen = FerreFotos.crear(p?.imagen || 'assets/producto-sin-imagen.svg', categoria, 'imagen-categoria'); a.append(imagen, nodo('span', ceja, 'categoria-ceja'));
      const pie = nodo('div', undefined, 'categoria-visual-pie'); pie.append(nodo('h3', categoria), nodo('small', cantidad ? `${cantidad} productos` : 'Explorar categoría'), nodo('span', '↗', 'flecha-categoria')); a.append(pie); a.addEventListener('click', e => { e.preventDefault(); aplicarCategoria(categoria); }); $('tarjetasCategorias').append(a);
    }
  }
  function pintarDestacados() {
    let elegidos = productos.filter(x => x.estado === 'Activo');
    if (categoriaDestacada === 'electricas') elegidos = elegidos.filter(x => x.categoria === 'Herramientas eléctricas');
    else if (categoriaDestacada === 'obra') elegidos = elegidos.filter(x => x.categoria === 'Construcción');
    else { const codigos = ['HER-016', 'HER-018', 'HER-001', 'HER-025', 'HER-058', 'HER-086', 'HER-094', 'HER-100']; elegidos = codigos.map(c => elegidos.find(x => x.codigo === c)).filter(Boolean); }
    $('destacados').replaceChildren(...elegidos.slice(0, 8).map(tarjeta));
    if (!elegidos.length) $('destacados').append(nodo('p', 'No hay productos disponibles en esta selección.', 'estado-productos'));
    $('destacados').scrollLeft = 0;
  }
  function abrirDetalle(p) {
    detalleActual = p; const cont = $('detallePublico'); cont.replaceChildren();
    const foto = nodo('div', undefined, 'detalle-foto'); foto.append(FerreFotos.crear(p.imagen, p.nombre, 'imagen-detalle'));
    const info = nodo('div', undefined, 'detalle-info'); info.append(nodo('p', p.categoria, 'ceja-tienda'));
    const titulo = nodo('h2', p.nombre); titulo.id = 'tituloDetalle'; info.append(titulo, nodo('p', p.codigo, 'codigo-producto'), nodo('strong', dinero(p.precio), 'precio-detalle'), nodo('p', 'Precio base · COP. Impuestos y condiciones se revisan al cotizar.', 'nota-detalle'));
    const dl = nodo('dl'); for (const [k, v] of [['Categoría', p.categoria], ['Existencias', `${p.cantidad} unidades`], ['Estado', p.estado]]) { const d = nodo('div'); d.append(nodo('dt', k), nodo('dd', v)); dl.append(d); } info.append(dl);
    const label = nodo('label', 'Cantidad para cotizar'); label.htmlFor = 'cantidadDetalle'; const cantidad = nodo('input'); Object.assign(cantidad, { id: 'cantidadDetalle', type: 'number', min: 1, max: 10000000, step: 1, value: 1 });
    const b = boton('Agregar a mi cotización ↗', () => { if (!cantidad.reportValidity()) return; agregar(p.codigo, Number(cantidad.value)); }, 'boton-tienda verde');
    info.append(label, cantidad, b, nodo('p', 'Fotografía de referencia. Marca o presentación pueden variar.', 'nota-detalle')); cont.append(foto, info); $('detalleDialogo').showModal();
  }
  function pintarLista() {
    const r = D.resumen(lista, productos); $('itemsLista').replaceChildren();
    if (!lista.length) { $('itemsLista').append(nodo('div', 'Tu lista está esperando su primera herramienta. Explora el catálogo y agrega productos para empezar.', 'lista-vacia')); }
    for (const item of r.lineas) {
      const p = item.producto, fila = nodo('div', undefined, 'item-lista'); fila.append(FerreFotos.crear(p?.imagen, p?.nombre || item.codigo, 'foto-lista'));
      const info = nodo('div', undefined, 'item-lista-info'); info.append(nodo('strong', p?.nombre || item.codigo), nodo('small', item.codigo));
      if (p) { info.append(nodo('span', dinero(p.precio) + ' / unidad')); if (item.cantidad > p.cantidad) info.append(nodo('small', 'La cantidad requiere confirmar disponibilidad.', 'aviso-disponibilidad')); } else info.append(nodo('small', 'Este producto ya no está disponible. Retíralo para continuar.', 'aviso-disponibilidad'));
      const ajustes = nodo('div', undefined, 'cantidad-lista');
      const menos = boton('−', () => { if (item.cantidad === 1) return; cambiarCantidad(item.codigo, item.cantidad - 1); }); menos.setAttribute('aria-label', `Reducir cantidad de ${item.codigo}`);
      const input = nodo('input'); Object.assign(input, { type: 'number', value: item.cantidad, min: 1, max: 10000000, step: 1 }); input.setAttribute('aria-label', `Cantidad de ${item.codigo}`);
      input.addEventListener('change', seguro(() => { if (!input.reportValidity()) { input.value = item.cantidad; return; } cambiarCantidad(item.codigo, Number(input.value)); }));
      const mas = boton('+', () => cambiarCantidad(item.codigo, item.cantidad + 1)); mas.setAttribute('aria-label', `Aumentar cantidad de ${item.codigo}`); ajustes.append(menos, input, mas);
      const quitar = boton('Quitar', () => { guardarLista(lista.filter(x => x.codigo !== item.codigo)); pintarLista(); }, 'quitar-lista'); quitar.setAttribute('aria-label', `Quitar ${item.codigo} de mi cotización`); info.append(ajustes, quitar); fila.append(info); $('itemsLista').append(fila);
    }
    $('subtotalLista').textContent = r.incompleta ? 'Revisar productos' : dinero(r.subtotalCentavos / 100); $('continuarCotizacion').disabled = !lista.length || r.incompleta; $('errorLista').textContent = '';
  }
  function cambiarCantidad(codigo, cantidad) { guardarLista(lista.map(x => x.codigo === codigo ? { codigo, cantidad } : x)); pintarLista(); }
  function abrirLista() { pintarLista(); $('listaDialogo').showModal(); }
  function cuenta() {
    try { const u = Ferre.sesion(); if (u) { $('accesoCuenta').href = 'dashboard.html'; $('accesoCuenta').setAttribute('aria-label', 'Abrir mi panel'); $('accesoGestion').href = 'dashboard.html'; $('accesoGestion').textContent = 'Mi panel ↗'; } } catch { /* El catálogo público sigue disponible sin una sesión válida. */ }
  }
  async function cargar() {
    $('reintentarCatalogo').hidden = true;
    try {
      const datos = await FerreApi.listarProductos(); if (!Array.isArray(datos.productos)) throw Error('No se pudo cargar el catálogo.'); productos = datos.productos;
      const categorias = [...new Set(productos.filter(p => p.estado === 'Activo').map(p => p.categoria))].sort((a, b) => a.localeCompare(b, 'es'));
      const previa = $('categoriaPublica').value; $('categoriaPublica').replaceChildren(new Option('Todas las categorías', ''), ...categorias.map(c => new Option(c, c)));
      const url = new URL(location.href); $('categoriaPublica').value = categorias.includes(previa) ? previa : (url.searchParams.get('categoria') || '');
      const producto = url.searchParams.get('producto'); pintarCatalogo(); pintarCategorias(); pintarDestacados();
      if ($('listaDialogo').open) pintarLista();
      if (producto) { const p = productos.find(x => x.codigo === producto && x.estado === 'Activo'); if (p) abrirDetalle(p); }
    } catch (e) { $('conteoCatalogo').textContent = 'El catálogo no está disponible en este momento. Vuelve a intentarlo.'; $('reintentarCatalogo').hidden = false; $('destacados').replaceChildren(nodo('p', 'Pronto podrás explorar nuestros productos desde aquí.', 'estado-productos')); pintarCategorias(); }
  }
  const url = new URL(location.href); $('busquedaTienda').value = url.searchParams.get('q') || ''; $('ordenPublico').value = ['precio-asc', 'precio-desc'].includes(url.searchParams.get('orden')) ? url.searchParams.get('orden') : 'nombre'; $('soloDisponibles').checked = url.searchParams.get('disponibles') === '1';
  try { lista = D.normalizar(JSON.parse(localStorage.getItem(D.CLAVE) || '[]')); } catch { aviso('No se pudo recuperar tu lista anterior. Puedes comenzar una nueva selección.', true); }
  $('buscarTienda').addEventListener('submit', e => { e.preventDefault(); pagina = 0; pintarCatalogo(); irCatalogo(); });
  for (const id of ['categoriaPublica', 'ordenPublico', 'soloDisponibles']) $(id).addEventListener('change', () => { pagina = 0; pintarCatalogo(); });
  $('limpiarFiltros').addEventListener('click', () => { $('busquedaTienda').value = ''; $('categoriaPublica').value = ''; $('ordenPublico').value = 'nombre'; $('soloDisponibles').checked = false; pagina = 0; pintarCatalogo(); });
  $('paginaAnterior').addEventListener('click', () => { pagina--; pintarCatalogo(); irCatalogo(); }); $('paginaSiguiente').addEventListener('click', () => { pagina++; pintarCatalogo(); irCatalogo(); });
  document.querySelectorAll('[data-destacados]').forEach(b => b.addEventListener('click', () => { categoriaDestacada = b.dataset.destacados; document.querySelectorAll('[data-destacados]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); pintarDestacados(); }));
  $('destacadosAnterior').addEventListener('click', () => $('destacados').scrollBy({ left: -$('destacados').clientWidth * .8, behavior: 'smooth' })); $('destacadosSiguiente').addEventListener('click', () => $('destacados').scrollBy({ left: $('destacados').clientWidth * .8, behavior: 'smooth' }));
  for (const id of ['abrirLista', 'listaDesdeFooter', 'cotizarProyecto']) $(id).addEventListener('click', seguro(abrirLista));
  $('continuarCotizacion').addEventListener('click', seguro(() => {
    guardarLista(lista); if (D.resumen(lista, productos).incompleta) throw Error('Revisa los productos no disponibles antes de continuar.');
    let sesion; try { sesion = Ferre.sesion(); } catch { sesion = null; }
    location.href = sesion ? 'cotizaciones.html?desde=tienda' : 'login.html?continuar=cotizaciones';
  }));
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => $(b.dataset.cerrar).close()));
  $('reintentarCatalogo').addEventListener('click', cargar);
  $('menuMovil').addEventListener('click', () => { const abierto = $('menuMovil').getAttribute('aria-expanded') !== 'true'; $('menuMovil').setAttribute('aria-expanded', String(abierto)); $('enlacesTienda').classList.toggle('abierto', abierto); });
  $('enlacesTienda').querySelectorAll('a').forEach(a => a.addEventListener('click', () => { $('enlacesTienda').classList.remove('abierto'); $('menuMovil').setAttribute('aria-expanded', 'false'); }));
  const slides = [['PARA QUIENES HACEN QUE LAS COSAS PASEN', 'GRANDES IDEAS.\nHERRAMIENTAS\nA SU ALTURA.', 'Todo empieza con una buena herramienta. Encuentra lo que necesitas y dale forma a tu próximo proyecto.', 'Explorar productos', '#catalogo'], ['DE LA PRIMERA REPARACIÓN A LA GRAN OBRA', 'LO QUE NECESITAS.\nPARA LO QUE\nTE PROPONES.', 'Herramientas, materiales y productos que puedes reunir en una sola lista para tu obra.', 'Explorar categorías', '#categorias'], ['TU PRÓXIMO PROYECTO, EN ORDEN', 'COTIZA EN GRANDE.\nCONSTRUYE\nCON CLARIDAD.', 'Organiza cantidades, reúne tus productos y prepara una PREFACTURA para tu proyecto.', 'Descubre cómo cotizar', '#como-cotizar']];
  function presentar(n) { slide = (n + slides.length) % slides.length; const s = slides[slide]; $('heroCeja').textContent = s[0]; $('heroTitulo').replaceChildren(); s[1].split('\n').forEach((texto, i) => { if (i) $('heroTitulo').append(document.createElement('br')); $('heroTitulo').append(nodo(i === 2 ? 'span' : 'span', texto, i === 2 ? 'acento-hero' : '')); }); $('heroDescripcion').textContent = s[2]; $('heroEnlace').firstChild.textContent = s[3] + ' '; $('heroEnlace').href = s[4]; $('numeroSlide').textContent = String(slide + 1).padStart(2, '0'); document.querySelectorAll('[data-slide]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.slide) === slide))); }
  function pausar() { clearInterval(reloj); reloj = null; $('pausarHero').textContent = '▶'; $('pausarHero').setAttribute('aria-label', 'Reanudar presentaciones'); $('pausarHero').setAttribute('aria-pressed', 'false'); }
  $('pausarHero').addEventListener('click', () => { if (reloj) { pausar(); return; } reloj = setInterval(() => presentar(slide + 1), 7000); $('pausarHero').textContent = 'Ⅱ'; $('pausarHero').setAttribute('aria-label', 'Pausar presentaciones'); $('pausarHero').setAttribute('aria-pressed', 'true'); });
  $('slideAnterior').addEventListener('click', () => { pausar(); presentar(slide - 1); }); $('slideSiguiente').addEventListener('click', () => { pausar(); presentar(slide + 1); }); document.querySelectorAll('[data-slide]').forEach(b => b.addEventListener('click', () => { pausar(); presentar(Number(b.dataset.slide)); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
  window.addEventListener('storage', e => { if (e.key === D.CLAVE) { try { lista = D.normalizar(JSON.parse(e.newValue || '[]')); contador(); if ($('listaDialogo').open) pintarLista(); } catch { aviso('La lista cambió en otra pestaña. Actualiza para continuar.', true); } } });
  $('anioTienda').textContent = new Date().getFullYear(); contador(); cuenta(); cargar();
})();
