const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const temporal=fs.mkdtempSync(path.join(os.tmpdir(),'ferre-imagenes-test-'));
process.env.FERRE_IMAGENES_DIR=temporal;
const imagenes=require('../api/services/imagenes');
const {validarProducto}=require('../js/datos.js');
after(()=>fs.rmSync(temporal,{recursive:true,force:true}));
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const p={codigo:'HER-TEST',nombre:'Producto test',categoria:'Herramientas',precio:100,cantidad:1,estado:'Activo'};
test('foto opcional mantiene compatibilidad y acepta enlaces y rutas locales',()=>{
  assert.equal(validarProducto(p,[]).imagen,undefined);
  assert.equal(validarProducto({...p,imagen:'https://example.test/foto.jpg'},[]).imagen,'https://example.test/foto.jpg');
  const ruta=imagenes.guardarArchivo(png);
  assert.equal(validarProducto({...p,imagen:ruta},[]).imagen,ruta);
  assert.ok(fs.existsSync(path.join(temporal,path.basename(ruta))));
});
test('rechaza protocolos, rutas y credenciales no permitidas',()=>{
  for(const imagen of ['javascript:alert(1)','data:image/svg+xml,<svg/>','file:///foto.png','https://usuario:clave@example.test/foto.png','/imagenes/../productos.json']) assert.throws(()=>validarProducto({...p,imagen},[]));
});
test('la subida valida formato, contenido y tamaño',()=>{
  assert.throws(()=>imagenes.guardarArchivo('data:image/svg+xml;base64,PHN2Zy8+'));
  assert.throws(()=>imagenes.guardarArchivo('data:image/png;base64,aG9sYQ=='));
  assert.throws(()=>imagenes.guardarArchivo('data:image/png;base64,'+Buffer.alloc(1048577).toString('base64')),/1 MB/);
});
test('la asociación se conserva en disco, admite cambiar código y quitar foto',()=>{
  const ruta=imagenes.guardarArchivo(png); imagenes.asociar('HER-001',ruta);
  assert.equal(imagenes.leerIndice()['HER-001'],ruta);
  imagenes.asociar('HER-002',ruta,'HER-001');
  assert.equal(imagenes.leerIndice()['HER-001'],undefined); assert.equal(imagenes.leerIndice()['HER-002'],ruta);
  imagenes.asociar('HER-002',''); assert.equal(imagenes.leerIndice()['HER-002'],'');
});
