const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../js/tienda-datos.js');
const productos=[{codigo:'HER-001',nombre:'Martillo',categoria:'Herramientas',precio:32500,cantidad:4,estado:'Activo'},{codigo:'HER-002',nombre:'Destornillador',categoria:'Herramientas',precio:12000,cantidad:0,estado:'Activo'},{codigo:'HER-003',nombre:'Taladro',categoria:'Herramientas eléctricas',precio:185000,cantidad:12,estado:'Inactivo'}];
test('la lista pública consolida códigos y cantidades sin mutar el original',()=>{
  const lista=[{codigo:'her-001',cantidad:2}];assert.deepEqual(D.agregar(lista,'HER-001',3),[{codigo:'HER-001',cantidad:5}]);assert.equal(lista[0].cantidad,2);
});
test('rechaza listas corruptas, cantidades fraccionarias y fuera de rango',()=>{
  for(const lista of [null,{},[{codigo:'',cantidad:1}],[{codigo:'HER-001',cantidad:0}],[{codigo:'HER-001',cantidad:1.2}],[{codigo:'HER-001',cantidad:10000001}],Array(1001).fill({codigo:'HER-001',cantidad:1})])assert.throws(()=>D.normalizar(lista));
  assert.throws(()=>D.agregar([{codigo:'HER-001',cantidad:10000000}],'HER-001',1));
});
test('el catálogo público oculta inactivos y combina búsqueda, categoría y disponibilidad',()=>{
  assert.equal(D.filtrar(productos).length,2);
  assert.equal(D.filtrar(productos,{q:'MARTILLO',categoria:'Herramientas',disponibles:true})[0].codigo,'HER-001');
  assert.equal(D.filtrar(productos,{q:'taladro'}).length,0);
  assert.equal(D.filtrar(productos,{disponibles:true}).length,1);
});
test('ordena por precio y por nombre sin cambiar el arreglo original',()=>{
  assert.equal(D.filtrar(productos,{orden:'precio-asc'})[0].codigo,'HER-002');
  assert.equal(D.filtrar(productos,{orden:'precio-desc'})[0].codigo,'HER-001');
  assert.equal(productos[0].codigo,'HER-001');
});
test('subtotal en centavos mantiene importes y marca productos ausentes',()=>{
  const r=D.resumen([{codigo:'HER-001',cantidad:3},{codigo:'HER-002',cantidad:2}],productos);assert.equal(r.subtotalCentavos,12150000);assert.equal(r.unidades,5);assert.equal(r.incompleta,false);
  assert.equal(D.resumen([{codigo:'HER-999',cantidad:1}],productos).incompleta,true);
  assert.equal(D.resumen([{codigo:'HER-003',cantidad:1}],productos).incompleta,true);
});
test('la lista vacía es válida y el total excesivo se rechaza',()=>{
  assert.equal(D.resumen([],productos).subtotalCentavos,0);
  assert.throws(()=>D.resumen([{codigo:'HER-001',cantidad:10000000}],[{...productos[0],precio:1e10}]),/máximo/);
});
