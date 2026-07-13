/* ============================================================================
   CARGA MASIVA DE FOTOS DE PRODUCTOS  —  Santa María Distribuidora
   ----------------------------------------------------------------------------
   Qué hace:
   1) Abre un selector de archivos (podés elegir decenas de fotos a la vez).
   2) Matchea cada foto con su producto:
        · Por ID si el archivo se llama  loquesea__IDPRODUCTO.jpg
          (ej: "pan-rallado-preferido__p_imp_1783122342_0530.jpg")
        · Si no, por nombre: compara el nombre del archivo con el nombre del
          producto (sin tildes/mayúsculas/símbolos). Solo acepta match único.
   3) Comprime cada foto igual que el panel (máx 1200px, JPEG 85%) y si el
      resultado supera ~900KB la recomprime más chica (límite Firestore 1MB).
   4) Escribe fotoUrl + tieneFoto:true con merge:true en lotes chicos:
      nunca pisa otros campos del producto.

   CÓMO USARLO (importante):
   - Abrí admin.html en el navegador e INICIÁ SESIÓN como admin.
   - Sacá de la carpeta las fotos que NO haya que subir (ej: la del Gancia
     equivocada) antes de elegirlas.
   - Abrí la consola (F12 → Console), pegá TODO este archivo y luego:
       await subirFotos.elegir();     // abre el selector y matchea (no escribe nada)
       subirFotos.revisar();          // muestra el plan: qué foto va a qué producto
       await subirFotos.aplicar();    // sube (pide confirmación; salta los que ya tienen foto)
       await subirFotos.aplicar({ sobrescribir: true });  // idem pero pisa fotos existentes
   ============================================================================ */
(function () {
  const COL = 'productos';
  const MAX_PX = 1200, CALIDAD = 0.85;
  const MAX_DATAURL = 900 * 1024;      // margen bajo el límite de 1MiB/doc de Firestore
  const LOTE = 20;                     // fotos por batch (limita el tamaño del request)

  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const app = appMod.getApp();
    const db  = fsMod.getFirestore(app);
    return { db, fsMod };
  }

  const slug = s => (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  function comprimir(file, maxPx, calidad) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
          if (h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          res(canvas.toDataURL('image/jpeg', calidad));
        };
        img.onerror = rej;
        img.src = e.target.result;
      };
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function comprimirSeguro(file) {
    let dataUrl = await comprimir(file, MAX_PX, CALIDAD);
    if (dataUrl.length > MAX_DATAURL) dataUrl = await comprimir(file, 900, 0.8);
    if (dataUrl.length > MAX_DATAURL) dataUrl = await comprimir(file, 700, 0.75);
    if (dataUrl.length > MAX_DATAURL) throw new Error('imposible bajar de 900KB');
    return dataUrl;
  }

  let plan = null; // { matches: [{file, id, nombre, yaTiene}], sinMatch: [file], ambiguos: [{file, candidatos}] }

  const api = {
    async elegir() {
      // El file picker solo puede abrirse desde un click real del usuario
      // (user activation): mostramos un botón y el click del botón abre el
      // selector de forma sincrónica.
      console.log('👉 Hacé click en el botón verde que apareció arriba a la izquierda del panel.');
      const files = await new Promise(res => {
        const b = document.createElement('button');
        b.textContent = '📸 Elegir fotos para subir';
        b.style.cssText = 'position:fixed;top:16px;left:16px;z-index:99999;padding:14px 18px;font-size:16px;background:#2d7a4f;color:#fff;border:0;border-radius:10px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3)';
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
        inp.onchange = () => { b.remove(); res([...inp.files]); };
        b.onclick = () => inp.click();
        document.body.appendChild(b);
      });
      if (!files.length) { console.log('No elegiste archivos.'); return; }

      const { db, fsMod } = await fb();
      const snap = await fsMod.getDocs(fsMod.collection(db, COL));
      const prods = [];
      snap.forEach(d => { const x = d.data(); prods.push({ id: d.id, nombre: x.nombre || '', tieneFoto: !!x.tieneFoto, slug: slug(x.nombre) }); });
      console.log(`Catálogo: ${prods.length} productos (${prods.filter(p => !p.tieneFoto).length} sin foto).`);

      const porId = new Map(prods.map(p => [p.id, p]));
      plan = { matches: [], sinMatch: [], ambiguos: [] };

      for (const f of files) {
        const base = f.name.replace(/\.[^.]+$/, '');
        const m = base.match(/__([A-Za-z0-9_]+)$/);
        if (m && porId.has(m[1])) {
          const p = porId.get(m[1]);
          plan.matches.push({ file: f, id: p.id, nombre: p.nombre, yaTiene: p.tieneFoto });
          continue;
        }
        const s = slug(base.replace(/__.*$/, ''));
        const exactos = prods.filter(p => p.slug === s);
        const parciales = exactos.length ? exactos : prods.filter(p => p.slug.startsWith(s) || s.startsWith(p.slug));
        if (parciales.length === 1) {
          const p = parciales[0];
          plan.matches.push({ file: f, id: p.id, nombre: p.nombre, yaTiene: p.tieneFoto });
        } else if (parciales.length > 1) {
          plan.ambiguos.push({ file: f.name, candidatos: parciales.slice(0, 5).map(p => `${p.id} "${p.nombre}"`) });
        } else {
          plan.sinMatch.push(f.name);
        }
      }
      api.revisar();
    },

    revisar() {
      if (!plan) { console.log('Primero: await subirFotos.elegir()'); return; }
      console.log('%c===== PLAN — no se escribió nada =====', 'font-weight:bold');
      console.log(`Se subirían: ${plan.matches.length} fotos`);
      plan.matches.forEach(x => console.log(`   ${x.file.name}  →  "${x.nombre}" (${x.id})${x.yaTiene ? '  ⚠️ YA TIENE FOTO (se salta salvo sobrescribir:true)' : ''}`));
      if (plan.ambiguos.length) {
        console.log(`\n⚠️ Ambiguos (${plan.ambiguos.length}) — renombrá el archivo con __IDPRODUCTO al final:`);
        plan.ambiguos.forEach(x => { console.log(`   ${x.file}`); x.candidatos.forEach(c => console.log('      ¿' + c + '?')); });
      }
      if (plan.sinMatch.length) {
        console.log(`\n✗ Sin match (${plan.sinMatch.length}):`);
        plan.sinMatch.forEach(n => console.log('   ' + n));
      }
      console.log('\nSi está OK →  await subirFotos.aplicar()');
      return plan;
    },

    async aplicar(opts = {}) {
      if (!plan) { console.log('Primero: await subirFotos.elegir()'); return; }
      const sobrescribir = !!opts.sobrescribir;
      const lista = plan.matches.filter(x => sobrescribir || !x.yaTiene);
      const saltados = plan.matches.length - lista.length;
      if (!lista.length) { console.log('Nada para subir' + (saltados ? ` (${saltados} ya tenían foto; usá {sobrescribir:true})` : '.')); return; }
      if (!confirm(`Se van a subir ${lista.length} fotos${saltados ? ` (${saltados} saltados por tener foto)` : ''}.\n\n¿Aplicar ahora?`)) {
        console.log('Cancelado.'); return;
      }

      const { db, fsMod } = await fb();
      const { writeBatch, doc } = fsMod;
      let ok = 0, errores = [];
      for (let i = 0; i < lista.length; i += LOTE) {
        const grupo = lista.slice(i, i + LOTE);
        const batch = writeBatch(db);
        let enBatch = 0;
        for (const x of grupo) {
          try {
            const dataUrl = await comprimirSeguro(x.file);
            batch.set(doc(db, COL, x.id), { fotoUrl: dataUrl, tieneFoto: true }, { merge: true });
            enBatch++;
          } catch (e) {
            errores.push(`${x.file.name}: ${e.message || e}`);
          }
        }
        if (enBatch) { await batch.commit(); ok += enBatch; }
        console.log(`   ...${Math.min(i + LOTE, lista.length)}/${lista.length} procesadas (${ok} subidas)`);
      }
      console.log(`✅ Listo: ${ok} fotos subidas${saltados ? `, ${saltados} saltadas` : ''}.`);
      if (errores.length) { console.log(`⚠️ Errores (${errores.length}):`); errores.forEach(e => console.log('   ' + e)); }
      console.log('Recargá el catálogo público para verlas (las tarjetas cargan la foto al entrar en pantalla).');
    }
  };

  window.subirFotos = api;
  console.log('%csubirFotos cargado.', 'color:green;font-weight:bold');
  console.log('Pasos:  await subirFotos.elegir()  →  subirFotos.revisar()  →  await subirFotos.aplicar()');
})();
