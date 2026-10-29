const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
test('API: listar, crear, editar y eliminar producto sin alterar el catálogo base',async()=>{
  const app=express(); app.use(express.json()); app.use('/api/productos',require('../api/routes/producto.routes'));
  const server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api/productos`;
  let id;
  try{
    const inicial=await (await fetch(base)).json(); assert.ok(inicial.productos.length>=100);
    const producto={codigo:'QA-'+Date.now(),nombre:'Producto ficticio QA',categoria:'Herramientas eléctricas',precio:12.5,cantidad:4,estado:'Activo'};
    let respuesta=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(producto)});
    assert.equal(respuesta.status,201); id=(await respuesta.json()).producto.id;
    respuesta=await fetch(base+'/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({cantidad:40})});
    assert.equal((await respuesta.json()).producto.cantidad,40);
    const duplicado=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(producto)}); assert.equal(duplicado.status,400);
    respuesta=await fetch(base+'/'+id,{method:'DELETE'}); assert.equal(respuesta.status,200);
    assert.equal((await fetch(base+'/'+id)).status,404);
    assert.equal((await (await fetch(base)).json()).total,inicial.total);
  }finally{ if(id) await fetch(base+'/'+id,{method:'DELETE'}); server.close(); }
});
