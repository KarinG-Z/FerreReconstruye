'use strict';
window.FerreFotos = (() => {
  const provisional = 'assets/producto-sin-imagen.svg';
  let version = 0, subiendo = false;
  function crear(imagen, nombre, clase = 'foto-producto') {
    const img = document.createElement('img');
    img.alt = nombre; img.className = clase; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onerror = () => { img.onerror = null; img.src = provisional; img.alt = `Sin imagen disponible: ${nombre}`; };
    img.src = imagen ? FerreApi.urlImagen(imagen) : provisional;
    return img;
  }
  function configurar() {
    const url = document.getElementById('imagen'), archivo = document.getElementById('archivoImagen'), contenedor = document.getElementById('vistaImagen'), estado = document.getElementById('estadoImagen');
    const pintar = () => contenedor.replaceChildren(crear(url.value.trim(), 'Vista previa del producto', 'foto-preview'));
    url.addEventListener('change', () => { estado.textContent = ''; pintar(); });
    document.getElementById('quitarImagen').addEventListener('click', () => { version++; subiendo = false; url.disabled = false; url.value = ''; archivo.value = ''; estado.textContent = 'Se quitará la foto al guardar el producto.'; pintar(); });
    archivo.addEventListener('change', async () => {
      const fichero = archivo.files[0]; if (!fichero) return;
      const turno = ++version; subiendo = true; url.disabled = true;
      estado.textContent = 'Preparando y subiendo imagen…';
      let bitmap;
      try {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichero.type)) throw Error('Selecciona una foto PNG, JPEG o WebP.');
        if (fichero.size > 8 * 1024 * 1024) throw Error('La foto original no debe superar 8 MB.');
        bitmap = await createImageBitmap(fichero);
        if (bitmap.width * bitmap.height > 40000000) throw Error('La resolución de la imagen es demasiado grande. Reduce la foto antes de subirla.');
        const escala = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * escala)); canvas.height = Math.max(1, Math.round(bitmap.height * escala));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const datos = canvas.toDataURL('image/webp', .82);
        if (datos.length > 1398200) throw Error('No se pudo reducir la imagen a 1 MB. Selecciona una foto más pequeña.');
        const respuesta = await FerreApi.subirImagen(datos);
        if (turno !== version) return;
        url.value = respuesta.imagen; pintar(); estado.textContent = 'Imagen cargada. Guarda el producto para asociarla.';
      } catch (e) { if (turno === version) estado.textContent = e.message; }
      finally { bitmap?.close(); if (turno === version) { subiendo = false; url.disabled = false; archivo.value = ''; } }
    });
    return {
      restablecer(imagen = '') { version++; subiendo = false; url.disabled = false; url.value = imagen; archivo.value = ''; estado.textContent = ''; pintar(); },
      validar() { if (subiendo) throw Error('Espera a que termine la carga de la imagen.'); }
    };
  }
  return { crear, configurar };
})();
