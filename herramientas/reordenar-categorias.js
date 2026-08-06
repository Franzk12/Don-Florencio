/* ============================================================================
   REORDENAR CATEGORÍAS — 2ª ronda (cruces del catálogo)  —  Santa María
   ----------------------------------------------------------------------------
   Mueve productos que quedaron en una categoría distinta a la de sus pares
   (detectado buscando "tipos" repartidos entre categorías). La 1ª ronda (papel
   Limpieza→Papelera) YA se aplicó y no está acá.

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await reordenar.aplicar();   // aplica (pide confirmación)
   - Al terminar REGENERA el snapshot solo (la home se actualiza).
   Si querés sacar alguno "opinable", borrá su línea antes de correr.
   ============================================================================ */
(function () {
  const LISTA = [
    // ── Seguros ──
    { id: 'p_imp_1783122342_0371', nombre: 'Café El Pocillo Doypack (100 g)', cat: 'bebidas' },
    { id: 'p_imp_1783122342_0536', nombre: 'Puré de Tomate Inca (530 g)',     cat: 'aderezos' },
    { id: 'p_imp_1783122342_0596', nombre: 'Tomate Triturado Inca (910 g)',   cat: 'aderezos' },
    // ── Por consistencia (opinables) ──
    { id: 'p_1782160098639_veif',  nombre: 'Esencia de Vainilla Emeth (5 L)',  cat: 'aderezos' },
    { id: 'p_1782160098639_yrxv',  nombre: 'Esencia de Vainilla Emeth (2 L)',  cat: 'aderezos' },
    { id: 'p_imp_1783122342_0511', nombre: 'Obleas Oblitas Frutilla',          cat: 'dulces' },
    { id: 'p_imp_1783122342_0512', nombre: 'Obleas Oblitas Vainilla',          cat: 'dulces' },
    { id: 'p_1783027911563_j5lh',  nombre: 'Pionono Signo de Oro',             cat: 'panificados' },
    { id: 'p_imp_1783122342_0383', nombre: 'Porotos Manteca Elio',            cat: 'encurtidos' },
  ];
  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }
  async function cargar() {
    const { db, fsMod } = await fb();
    const snap = await fsMod.getDocs(fsMod.collection(db, 'productos'));
    const cur = {}; snap.forEach(d => cur[d.id] = d.data()); return cur;
  }
  async function simular() {
    const cur = await cargar(); let camb = 0, warn = 0;
    console.log('%c── REORDENAR categorías (simulación) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn('❌ NO EXISTE', it.id, it.nombre); warn++; continue; }
      const chg = p.cat !== it.cat; if (chg) camb++;
      console.log(`${chg ? '🔀' : '  '} ${p.nombre}   ${p.cat} ${chg ? '→ ' + it.cat : '(ya está)'}`);
    }
    console.log(`%c${camb} a mover · ${warn} problemas · total ${LISTA.length}`, 'font-weight:bold');
    console.log('%cPara aplicar:  await reordenar.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = LISTA.filter(it => existe.has(it.id));
    if (!confirm('Mover ' + validos.length + ' productos de categoría?')) { console.log('Cancelado.'); return; }
    const batch = writeBatch(db);
    validos.forEach(it => batch.set(doc(db, 'productos', it.id), { cat: it.cat }, { merge: true }));
    await batch.commit();
    console.log('%c✅ ' + validos.length + ' movidos. Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fresco = await getDocs(collection(db, 'productos'));
    const arr = [];
    fresco.forEach(d => { const p = d.data(), o = { id: d.id };
      SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Listo. Snapshot regenerado: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.reordenar = { simular, aplicar, LISTA };
  console.log('%creordenar cargado (' + LISTA.length + ' movimientos de categoría).', 'font-weight:bold', '→ await reordenar.simular()');
  simular();
})();
