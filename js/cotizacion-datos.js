(function (root) {
  'use strict';
  const exigir = (condicion, mensaje) => { if (!condicion) throw Error(mensaje); };
  const centavos = n => Math.round((Number(n) + Number.EPSILON) * 100);
  function numero(valor, nombre, min, max, entero = false) {
    exigir(String(valor).trim() !== '', `${nombre}: falta el valor.`);
    const n = Number(valor);
    exigir(Number.isFinite(n) && n >= min && n <= max && (!entero || Number.isSafeInteger(n)), `${nombre}: ingresa ${entero ? 'un entero' : 'un número'} entre ${min} y ${max}.`);
    return n;
  }
  function linea(item) {
    const cantidad = numero(item.cantidad, 'Cantidad', 1, 10000000, true);
    const precio = numero(item.precio, 'Precio', 0, 1e10);
    exigir(Math.abs(precio * 100 - centavos(precio)) < 0.001, 'El precio admite hasta 2 decimales.');
    const descuento = numero(item.descuento ?? 0, 'Descuento', 0, 100);
    const iva = numero(item.iva ?? 0, 'Impuesto', 0, 100);
    const bruto = centavos(precio) * cantidad;
    exigir(Number.isSafeInteger(bruto) && bruto <= 1e13, 'El importe de una línea supera el límite permitido.');
    const rebaja = Math.round(bruto * descuento / 100);
    const base = bruto - rebaja;
    const impuesto = Math.round(base * iva / 100);
    return { bruto, rebaja, base, impuesto, total: base + impuesto };
  }
  function calcular(items, transporte = 0) {
    exigir(Array.isArray(items) && items.length <= 1000, 'Se permiten hasta 1.000 líneas por cotización.');
    const totales = items.reduce((s, item) => {
      const l = linea(item); for (const k of ['bruto', 'rebaja', 'base', 'impuesto', 'total']) s[k] += l[k]; return s;
    }, { bruto: 0, rebaja: 0, base: 0, impuesto: 0, total: 0 });
    totales.transporte = centavos(numero(transporte, 'Transporte', 0, 1e10));
    totales.total += totales.transporte;
    exigir(Number.isSafeInteger(totales.total) && totales.total <= 1e14, 'El total supera el límite permitido.');
    return totales;
  }
  function importar(texto, productos) {
    const filas = String(texto).replace(/^\uFEFF/, '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    exigir(filas.length <= 1001, 'La carga admite hasta 1.000 filas.');
    const resultado = [], errores = [];
    filas.forEach((fila, indice) => {
      const partes = fila.split(/[;,\t]/).map(x => x.trim());
      if (indice === 0 && /^c[oó]digo$/i.test(partes[0]) && /^cantidad$/i.test(partes[1])) return;
      try {
        exigir(partes.length === 2, 'Usa código y cantidad separados por punto y coma, coma o tabulación.');
        const producto = productos.find(p => p.codigo.toUpperCase() === partes[0].toUpperCase());
        exigir(producto, `Código no encontrado: ${partes[0]}.`);
        exigir(producto.estado === 'Activo', `Producto inactivo: ${partes[0]}.`);
        resultado.push({ producto, cantidad: numero(partes[1], 'Cantidad', 1, 10000000, true) });
      } catch (e) { errores.push(`Fila ${indice + 1}: ${e.message}`); }
    });
    exigir(!errores.length, errores.slice(0, 12).join('\n'));
    exigir(resultado.length, 'No hay productos para cargar.');
    return resultado;
  }
  function validarDocumento(doc) {
    exigir(doc.cliente?.nombre?.trim().length >= 2, 'Ingresa el nombre o razón social del cliente.');
    exigir(doc.items?.length > 0, 'Agrega al menos un producto.');
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(doc.fecha) && /^\d{4}-\d{2}-\d{2}$/.test(doc.vigencia) && doc.vigencia >= doc.fecha, 'La vigencia debe ser igual o posterior a la fecha de emisión.');
    const totales = calcular(doc.items, doc.transporte);
    return totales;
  }
  const api = { centavos, numero, linea, calcular, importar, validarDocumento };
  root.FerreCotDatos = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
