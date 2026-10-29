(function(root){
  'use strict';
  const CLAVE='ferreListaPublica';
  function normalizar(lista){
    if(!Array.isArray(lista)||lista.length>1000) throw Error('La lista de cotización no es válida.');
    const mapa=new Map();
    for(const item of lista){
      const codigo=String(item?.codigo||'').trim().toUpperCase(),cantidad=Number(item?.cantidad);
      if(!codigo||codigo.length>24||!Number.isSafeInteger(cantidad)||cantidad<1||cantidad>10000000) throw Error('Revisa los códigos y cantidades de tu lista.');
      const total=(mapa.get(codigo)||0)+cantidad;
      if(total>10000000) throw Error('La cantidad supera el máximo permitido.');
      mapa.set(codigo,total);
    }
    return [...mapa].map(([codigo,cantidad])=>({codigo,cantidad}));
  }
  function agregar(lista,codigo,cantidad=1){return normalizar([...lista,{codigo,cantidad}]);}
  function filtrar(productos,{q='',categoria='',disponibles=false,orden='nombre'}={}){
    const texto=String(q).trim().toLocaleLowerCase('es');
    const salida=productos.filter(p=>p.estado==='Activo'&&(!categoria||p.categoria===categoria)&&(!disponibles||p.cantidad>0)&&[p.codigo,p.nombre,p.categoria].some(x=>String(x).toLocaleLowerCase('es').includes(texto)));
    salida.sort(orden==='precio-asc'?(a,b)=>a.precio-b.precio:orden==='precio-desc'?(a,b)=>b.precio-a.precio:(a,b)=>a.nombre.localeCompare(b.nombre,'es'));
    return salida;
  }
  function resumen(lista,productos){
    const lineas=normalizar(lista).map(item=>({...item,producto:productos.find(p=>p.codigo===item.codigo&&p.estado==='Activo')}));
    const subtotalCentavos=lineas.reduce((n,x)=>n+(x.producto?Math.round(x.producto.precio*100)*x.cantidad:0),0);
    if(!Number.isSafeInteger(subtotalCentavos)||subtotalCentavos>1e14)throw Error('La lista supera el importe máximo permitido. Reduce las cantidades.');
    return {lineas,referencias:lineas.length,unidades:lineas.reduce((n,x)=>n+x.cantidad,0),subtotalCentavos,incompleta:lineas.some(x=>!x.producto)};
  }
  const api={CLAVE,normalizar,agregar,filtrar,resumen}; root.FerreTiendaDatos=api;
  if(typeof module!=='undefined') module.exports=api;
})(typeof window==='undefined'?globalThis:window);
