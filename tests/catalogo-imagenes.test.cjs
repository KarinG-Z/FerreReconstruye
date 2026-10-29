const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('las 100 referencias tienen una fotografía local válida y correspondiente a su código',()=>{
  const mapa=require('../api/data/imagenes-catalogo.json');
  assert.equal(Object.keys(mapa).length,100);
  for(let n=1;n<=100;n++){
    const codigo='HER-'+String(n).padStart(3,'0'), ruta=mapa[codigo];
    assert.match(ruta,new RegExp('^assets/productos/'+codigo+'\\.(jpg|png|webp)$'));
    const foto=fs.readFileSync(path.join(__dirname,'..',ruta)); assert.ok(foto.length>500,codigo);
    const valida=foto.subarray(0,3).equals(Buffer.from([255,216,255])) || foto.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || (foto.toString('ascii',0,4)==='RIFF'&&foto.toString('ascii',8,12)==='WEBP');
    assert.ok(valida,codigo+': debe ser una imagen, no una respuesta HTML');
  }
});
