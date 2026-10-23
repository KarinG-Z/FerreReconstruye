'use strict';
(() => {
  const esUsuario = document.body.dataset.pagina === 'usuarios';
  const clave = esUsuario ? 'usuarios' : 'productos';
  const singular = esUsuario ? 'Usuario' : 'Producto';
  const formulario = document.getElementById('formulario');
  const dialogo = document.getElementById('editor');
  const confirmar = document.getElementById('confirmar');
  let editando = null;
  let eliminando = null;
  const puedeEditar = () => Ferre.sesion()?.rol === 'Administrador';
  function autorizar() { FerreDatos.exigir(puedeEditar(), 'Solo un administrador puede realizar cambios.'); }
  function celda(fila, valor) { const td = document.createElement('td'); td.textContent = valor; fila.append(td); return td; }
  function boton(fila, texto, accion, clase = '') {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.className = `accion ${clase}`;
    b.addEventListener('click', accion); fila.append(b);
  }
  function cargar() {
    if (!usuarioActual) return;
    try {
      if (esUsuario && !puedeEditar()) return;
      const todos = Ferre.leer(clave);
      const q = document.getElementById('buscar').value.trim().toLocaleLowerCase('es');
      const filtro = document.getElementById('filtro').value;
      const estado = document.getElementById('filtroEstado').value;
      const datos = todos.filter(x => {
        const busqueda = esUsuario ? [x.id, x.nombre, x.apellido, x.correo] : [x.id, x.codigo, x.nombre, x.categoria];
        return busqueda.some(v => String(v).toLocaleLowerCase('es').includes(q)) && (!filtro || x[esUsuario ? 'rol' : 'categoria'] === filtro) && (!estado || x.estado === estado);
      });
      document.getElementById('resultados').textContent = `${datos.length} de ${todos.length} ${clave}`;
      const cuerpo = document.getElementById('filas'); cuerpo.replaceChildren();
      document.getElementById('vacio').hidden = datos.length > 0;
      document.querySelector('#vacio p').textContent = puedeEditar() ? 'Agrega tu primer registro o ajusta la búsqueda y los filtros.' : 'Ajusta la búsqueda y los filtros. Un administrador puede agregar productos al catálogo.';
      document.getElementById('nuevo').hidden = !puedeEditar();
      for (const x of datos) {
        const fila = document.createElement('tr');
        const id = celda(fila, x.id.slice(0, 8)); id.title = x.id; id.className = 'codigo';
        if (esUsuario) {
          celda(fila, `${x.nombre} ${x.apellido}`); celda(fila, x.correo); celda(fila, x.rol);
        } else {
          celda(fila, x.codigo).className = 'codigo'; celda(fila, x.nombre); celda(fila, x.categoria);
          celda(fila, Ferre.dinero(x.precio)); const stock = celda(fila, x.cantidad); if (x.cantidad <= 5) stock.className = 'stock-bajo';
        }
        const estadoTd = celda(fila, ''); const etiqueta = document.createElement('span');
        etiqueta.className = `etiqueta ${x.estado === 'Activo' ? 'activo' : 'inactivo'}`; etiqueta.textContent = x.estado; estadoTd.append(etiqueta);
        const acciones = celda(fila, ''); acciones.className = 'acciones';
        if (puedeEditar()) {
          boton(acciones, 'Editar', () => abrir(x));
          if (esUsuario) boton(acciones, x.estado === 'Activo' ? 'Desactivar' : 'Activar', () => cambiarEstado(x));
          boton(acciones, 'Eliminar', () => pedirEliminar(x), 'peligro');
        } else acciones.textContent = 'Solo lectura';
        cuerpo.append(fila);
      }
    } catch (e) { Ferre.mensaje(e.message, true); }
  }
  function protegerAdministrador(datos, id, reemplazo) {
    if (!esUsuario) return;
    const anterior = datos.find(x => x.id === id);
    if (anterior?.rol === 'Administrador' && anterior.estado === 'Activo' && !(reemplazo?.rol === 'Administrador' && reemplazo.estado === 'Activo')) {
      FerreDatos.exigir(datos.some(x => x.id !== id && x.rol === 'Administrador' && x.estado === 'Activo'), 'Debe permanecer al menos un administrador activo.');
    }
  }
  function abrir(x = null) {
    try {
      autorizar(); editando = x?.id || null; formulario.reset();
      document.getElementById('errorFormulario').textContent = '';
      document.getElementById('tituloEditor').textContent = `${x ? 'Editar' : 'Nuevo'} ${singular.toLowerCase()}`;
      if (x) for (const campo of formulario.elements) if (campo.name && campo.name !== 'password' && x[campo.name] !== undefined) campo.value = x[campo.name];
      if (esUsuario) { formulario.elements.password.required = !x; document.getElementById('ayudaPassword').textContent = x ? 'Déjala vacía para conservar la contraseña actual.' : 'Entre 8 y 128 caracteres.'; }
      dialogo.showModal();
    } catch (e) { Ferre.mensaje(e.message, true); }
  }
  formulario.addEventListener('submit', async event => {
    event.preventDefault(); const b = event.submitter; b.disabled = true;
    try {
      autorizar();
      const datos = Object.fromEntries(new FormData(formulario));
      let todos = Ferre.leer(clave);
      let nuevo = esUsuario ? FerreDatos.validarUsuario(datos, todos, editando) : FerreDatos.validarProducto(datos, todos, editando);
      let credencial;
      if (esUsuario && (!editando || datos.password)) credencial = await Ferre.credencial(datos.password);
      autorizar(); todos = Ferre.leer(clave);
      nuevo = esUsuario ? FerreDatos.validarUsuario(datos, todos, editando) : FerreDatos.validarProducto(datos, todos, editando);
      if (editando) {
        FerreDatos.exigir(todos.some(x => x.id === editando), 'El registro ya no existe. Cierra este formulario y actualiza la lista.');
        protegerAdministrador(todos, editando, nuevo);
        todos = todos.map(x => x.id === editando ? { ...x, ...nuevo, ...(credencial ? { credencial } : {}) } : x);
      } else todos.push({ ...nuevo, id: crypto.randomUUID(), ...(credencial ? { credencial } : {}) });
      Ferre.guardar(clave, todos);
      dialogo.close(); Ferre.mensaje(`${singular} ${editando ? 'actualizado' : 'registrado'} correctamente.`);
      comprobarSesion(); cargar();
    } catch (e) { document.getElementById('errorFormulario').textContent = e.message; }
    finally { b.disabled = false; }
  });
  function cambiarEstado(x) {
    try {
      autorizar(); const datos = Ferre.leer(clave); const actual = datos.find(u => u.id === x.id);
      FerreDatos.exigir(actual, 'El usuario ya no existe.');
      const nuevo = { ...actual, estado: actual.estado === 'Activo' ? 'Inactivo' : 'Activo' };
      protegerAdministrador(datos, x.id, nuevo);
      Ferre.guardar(clave, datos.map(u => u.id === x.id ? nuevo : u));
      Ferre.mensaje('Estado actualizado correctamente.'); comprobarSesion(); cargar();
    } catch (e) { Ferre.mensaje(e.message, true); }
  }
  function pedirEliminar(x) {
    eliminando = x.id;
    document.getElementById('detalleEliminar').textContent = `Se eliminará ${x.nombre}${esUsuario ? ' ' + x.apellido : ' (' + x.codigo + ')'}. Esta acción no se puede deshacer.`;
    document.getElementById('errorEliminar').textContent = ''; confirmar.showModal();
  }
  document.getElementById('eliminarDefinitivo').addEventListener('click', () => {
    try {
      autorizar(); const datos = Ferre.leer(clave); protegerAdministrador(datos, eliminando, null);
      Ferre.guardar(clave, datos.filter(x => x.id !== eliminando)); confirmar.close();
      Ferre.mensaje(`${singular} eliminado correctamente.`); comprobarSesion(); cargar();
    } catch (e) { document.getElementById('errorEliminar').textContent = e.message; }
  });
  document.getElementById('nuevo').addEventListener('click', () => abrir());
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.cerrar).close()));
  document.getElementById('buscar').addEventListener('input', cargar);
  document.getElementById('filtro').addEventListener('change', cargar);
  document.getElementById('filtroEstado').addEventListener('change', cargar);
  window.addEventListener('storage', cargar);
  cargar();
})();
