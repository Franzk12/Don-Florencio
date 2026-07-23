/* ============================================================================
   MIGRACIÓN / LIMPIEZA DEL CATÁLOGO  —  Don Florencio
   ----------------------------------------------------------------------------
   Qué hace:
   1) Limpia nombres: saca prefijos de oferta (*OFERTA*, *(OFT)*, ...) y
      sufijos de variante (X Mayor / X Unidad / X Bulto / X Pack / Efectivo).
   2) Fusiona variantes del mismo producto en UN solo producto:
        · min = precio de la variante "Unidad" (minorista)
        · may = precio de la variante "Mayor / Bulto / Pack" (mayorista)
        · la variante "Efectivo" se DESCARTA (el modelo tiene solo 2 precios)
      y borra los documentos sobrantes.
   3) Los productos sin variantes solo se les limpia el nombre (si hace falta).

   CÓMO USARLO (importante):
   - Abrí admin.html en el navegador y INICIÁ SESIÓN como admin.
   - Abrí la consola (F12 → Console) y pegá TODO este archivo. Luego:
       await migrarCatalogo.backup();   // descarga un JSON de respaldo (hacelo SIEMPRE primero)
       await migrarCatalogo.simular();   // muestra qué cambiaría, SIN escribir nada
       await migrarCatalogo.aplicar();   // aplica los cambios (pide confirmación)
   ============================================================================ */
(function () {
  const COL = 'productos';

  // ---- Reglas de limpieza de nombre (mismas que se usaron en el Excel) ----
  const OFERTA = /^\s*\*+\s*\(?\s*OF(?:ERTA|T)\.?\s*\)?\s*\*+\s*/i;
  // OJO: "pack" / "caja" NO se tocan: son un producto distinto (bundle), no un precio.
  const TRAIL_VAR = /\s+x?\s*(mayor|unidad|bulto)\b\.?/ig;
  const TRAIL_EFE = /\s+efect(ivo)?\b\.?/ig;
  function limpiarNombre(nombre) {
    let n = (nombre || '').toString();
    n = n.replace(OFERTA, '').replace(/^\**\s*/, '');
    let prev; do { prev = n; n = n.replace(TRAIL_EFE, '').replace(TRAIL_VAR, ''); } while (n !== prev);
    return n.replace(/\s+/g, ' ').trim();
  }
  const esEfectivo  = s => /\befect(ivo)?\b/i.test(s || '');
  const esMayorista = s => /\b(mayor|bulto)\b/i.test(s || '');

  // ---- Firebase (reutiliza la app ya inicializada por la página) ----
  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const app = appMod.getApp();
    const db  = fsMod.getFirestore(app);
    return { db, fsMod };
  }

  async function leerTodo() {
    const { db, fsMod } = await fb();
    const snap = await fsMod.getDocs(fsMod.collection(db, COL));
    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
    return docs;
  }

  // ---- Planificar los cambios (sin escribir) ----
  function planificar(docs) {
    // agrupar por (categoría + nombre limpio)
    const groups = new Map();
    for (const d of docs) {
      const limpio = limpiarNombre(d.nombre);
      const key = (d.cat || '') + '||' + limpio.toUpperCase();
      if (!groups.has(key)) groups.set(key, { limpio, items: [] });
      groups.get(key).items.push(d);
    }

    const renames = [];   // {id, de, a}
    const fusiones = [];  // {keepId, nombre, min, may, borrar:[ids], detalle}
    const dudas = [];     // posibles duplicados sin marcador (no se tocan)

    for (const g of groups.values()) {
      const items = g.items.map(d => ({
        d, price: Number(d.min || 0),
        isEfe: esEfectivo(d.nombre), isMay: esMayorista(d.nombre)
      }));

      if (items.length === 1) {
        const it = items[0];
        if (g.limpio !== it.d.nombre) renames.push({ id: it.d.id, de: it.d.nombre, a: g.limpio });
        continue;
      }

      // grupo con varias filas → variantes del mismo producto
      const conMarcador = items.some(x => x.isEfe || x.isMay || /\bunidad\b/i.test(x.d.nombre));
      if (!conMarcador) {
        // mismo nombre sin ninguna marca de variante → posible duplicado real: NO tocar
        dudas.push({ nombre: g.limpio, ids: items.map(x => x.d.id) });
        // igual normalizamos el nombre de cada uno si cambió
        items.forEach(x => { if (g.limpio !== x.d.nombre) renames.push({ id: x.d.id, de: x.d.nombre, a: g.limpio }); });
        continue;
      }

      const noEfe   = items.filter(x => !x.isEfe);
      const pool    = noEfe.length ? noEfe : items;
      const unidad  = pool.find(x => !x.isMay);
      const mayor   = pool.find(x => x.isMay);
      const keep    = unidad || mayor || pool[0];
      const newMin  = (unidad || keep).price;
      const newMay  = mayor ? mayor.price : Number(keep.d.may || 0);
      // conservar una foto si el elegido no tiene y otra variante sí
      let foto = keep.d.fotoUrl;
      if (!foto) { const conFoto = items.find(x => x.d.fotoUrl); if (conFoto) foto = conFoto.d.fotoUrl; }

      fusiones.push({
        keepId: keep.d.id, cat: keep.d.cat, nombre: g.limpio,
        min: newMin, may: newMay,
        setFoto: (!keep.d.fotoUrl && foto) ? foto : null,
        borrar: items.filter(x => x !== keep).map(x => x.d.id),
        detalle: items.map(x => `"${x.d.nombre}" ($${x.price})${x === keep ? '  ← se conserva' : x.isEfe ? '  ✗ efectivo' : '  → borrar'}`)
      });
    }
    return { renames, fusiones, dudas };
  }

  function resumen(plan) {
    console.log('%c===== SIMULACIÓN — no se escribió nada =====', 'font-weight:bold');
    console.log(`Renombrar (solo limpiar nombre): ${plan.renames.length}`);
    console.log(`Fusionar variantes (min/may):    ${plan.fusiones.length}  → borra ${plan.fusiones.reduce((a, f) => a + f.borrar.length, 0)} docs`);
    console.log(`Posibles duplicados (NO se tocan): ${plan.dudas.length}`);

    if (plan.fusiones.length) {
      console.log('\n--- FUSIONES ---');
      plan.fusiones.forEach(f => {
        console.log(`\n• [${f.cat}] ${f.nombre}   → min $${f.min} / may $${f.may}`);
        f.detalle.forEach(t => console.log('     ' + t));
      });
    }
    if (plan.renames.length) {
      console.log('\n--- RENOMBRES (primeros 40) ---');
      plan.renames.slice(0, 40).forEach(r => console.log(`   "${r.de}"  →  "${r.a}"`));
      if (plan.renames.length > 40) console.log(`   ...y ${plan.renames.length - 40} más`);
    }
    if (plan.dudas.length) {
      console.log('\n--- POSIBLES DUPLICADOS (revisá a mano, no se tocan) ---');
      plan.dudas.forEach(d => console.log(`   "${d.nombre}"  (${d.ids.length} docs: ${d.ids.join(', ')})`));
    }
    console.log('\nSi está OK →  await migrarCatalogo.aplicar()');
    return plan;
  }

  // ---- API pública ----
  const api = {
    async backup() {
      const docs = await leerTodo();
      const blob = new Blob([JSON.stringify(docs, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `backup-productos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      a.click();
      console.log(`✅ Backup descargado: ${docs.length} productos.`);
      return docs.length;
    },

    async simular() {
      const docs = await leerTodo();
      return resumen(planificar(docs));
    },

    async aplicar() {
      const docs = await leerTodo();
      const plan = planificar(docs);
      resumen(plan);
      const totalDel = plan.fusiones.reduce((a, f) => a + f.borrar.length, 0);
      if (!confirm(`Se van a MODIFICAR ${plan.renames.length + plan.fusiones.length} productos y BORRAR ${totalDel} documentos.\n\n¿Descargaste el backup? Esto no se puede deshacer solo.\n\n¿Aplicar ahora?`)) {
        console.log('Cancelado.'); return;
      }
      const { db, fsMod } = await fb();
      const { writeBatch, doc } = fsMod;
      const ops = [];
      plan.renames.forEach(r => ops.push(b => b.set(doc(db, COL, r.id), { nombre: r.a }, { merge: true })));
      plan.fusiones.forEach(f => {
        const data = { nombre: f.nombre, min: f.min, may: f.may };
        if (f.setFoto) data.fotoUrl = f.setFoto;
        ops.push(b => b.set(doc(db, COL, f.keepId), data, { merge: true }));
        f.borrar.forEach(id => ops.push(b => b.delete(doc(db, COL, id))));
      });
      // ejecutar en lotes de 400 (límite Firestore = 500)
      let done = 0;
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db);
        ops.slice(i, i + 400).forEach(fn => fn(batch));
        await batch.commit();
        done += Math.min(400, ops.length - i);
        console.log(`   ...${done}/${ops.length} operaciones`);
      }
      console.log(`✅ Listo. ${plan.renames.length} renombrados, ${plan.fusiones.length} fusionados, ${totalDel} borrados.`);
    }
  };

  window.migrarCatalogo = api;
  console.log('%cmigrarCatalogo cargado.', 'color:green;font-weight:bold');
  console.log('Pasos:  await migrarCatalogo.backup()  →  await migrarCatalogo.simular()  →  await migrarCatalogo.aplicar()');
})();
