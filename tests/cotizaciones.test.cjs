const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../js/cotizacion-datos.js');
const item={codigo:'HER-001',nombre:'Martillo',cantidad:3,precio:32500,descuento:10,iva:19};
test('descuento antes del impuesto y transporte final en centavos',()=>{
  assert.deepEqual(D.calcular([item],5000),{bruto:9750000,rebaja:975000,base:8775000,impuesto:1667250,transporte:500000,total:10942250});
});
test('redondea cada línea a dos decimales sin perder centavos',()=>{
  assert.equal(D.calcular([{...item,precio:.1,cantidad:3,descuento:0,iva:0},{...item,precio:.2,cantidad:1,descuento:0,iva:0}]).total,50);
});
test('descuento completo y precio cero',()=>{
  assert.equal(D.linea({...item,descuento:100}).total,0);
  assert.equal(D.linea({...item,precio:0}).total,0);
});
test('rechaza cantidades inválidas y porcentajes fuera de rango',()=>{
  for(const cambio of [{cantidad:0},{cantidad:-1},{cantidad:1.5},{cantidad:''},{cantidad:Infinity},{descuento:101},{descuento:-1},{iva:101},{precio:-1},{precio:1.234}]) assert.throws(()=>D.linea({...item,...cambio}));
});
test('limita propuestas grandes e importes seguros',()=>{
  assert.throws(()=>D.calcular(Array(1001).fill(item)),/1.000/);
  assert.throws(()=>D.linea({...item,precio:1e10,cantidad:1e7}),/límite/);
  assert.throws(()=>D.calcular([], -1));
});
const catalogo=[{id:'1',codigo:'HER-001',nombre:'Martillo',precio:32500,estado:'Activo'},{id:'2',codigo:'HER-002',estado:'Inactivo'}];
test('importa Excel, CSV con encabezado, BOM y separadores admitidos',()=>{
  assert.equal(D.importar('\uFEFFcodigo;cantidad\nher-001;20',catalogo)[0].cantidad,20);
  assert.equal(D.importar('HER-001\t4',catalogo)[0].cantidad,4);
  assert.equal(D.importar('HER-001,5',catalogo)[0].cantidad,5);
});
test('importación rechaza toda la lista si una fila falla',()=>{
  assert.throws(()=>D.importar('HER-001;4\nNO-EXISTE;2',catalogo),/Fila 2/);
  assert.throws(()=>D.importar('HER-002;4',catalogo),/inactivo/);
  assert.throws(()=>D.importar('HER-001;0',catalogo),/Cantidad/);
  assert.throws(()=>D.importar('codigo;cantidad',catalogo),/No hay/);
});
test('cotización exige cliente, productos y vigencia coherente',()=>{
  const doc={cliente:{nombre:'Obra Demo'},items:[item],fecha:'2026-10-29',vigencia:'2026-11-13',transporte:0};
  assert.equal(D.validarDocumento(doc).total,10442250);
  assert.throws(()=>D.validarDocumento({...doc,cliente:{nombre:''}}));
  assert.throws(()=>D.validarDocumento({...doc,items:[]}));
  assert.throws(()=>D.validarDocumento({...doc,vigencia:'2026-10-01'}));
});
test('cálculo de 1.000 líneas no altera las entradas',()=>{
  const items=Array.from({length:1000},()=>({...item,precio:100,cantidad:1,descuento:0,iva:0}));
  const original=JSON.stringify(items); assert.equal(D.calcular(items).total,10000000); assert.equal(JSON.stringify(items),original);
});
