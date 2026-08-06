/* ============================================================================
   AJUSTES PUNTUALES DE CATÁLOGO  —  Santa María
   ----------------------------------------------------------------------------
   Correcciones sueltas que va confirmando la dueña (stock, precio, etc.).
   Actual: Jamón Crudo Grasetto (f2735) → SIN STOCK (la dueña lo marcó en la
   revisión de fiambres, 27/07).

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await ajustes.aplicar();   // aplica (pide confirmación)
   - Al terminar REGENERA el snapshot solo.
   ============================================================================ */
(function () {
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  const LISTA = [
    // Sin stock (revisión fiambres de la dueña, 27/07) — línea Grasetto + Jetfood
    { id: 'f2735', nombre: 'Jamón Crudo Grasetto',        set: { stock: false } }, // ya aplicado antes (idempotente)
    { id: 'f5048', nombre: 'Mortadela Grasetto',          set: { stock: false } },
    { id: 'f5045', nombre: 'Salchichón Grasetto',         set: { stock: false } },
    { id: 'f3965', nombre: 'Jamón Cocido Grasetto',       set: { stock: false } },
    { id: 'f1796', nombre: 'Lomo Grasetto',               set: { stock: false } },
    { id: 'f5028', nombre: 'Paleta Sandwichera Grasetto', set: { stock: false } },
    { id: 'f644',  nombre: 'Paleta Sandwichera Jetfood',  set: { stock: false } },
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
  function descColor(k, v, antes) {
    if (k === 'stock') return `${antes === false ? 'sin stock' : 'con stock'} → ${v === false ? 'SIN STOCK' : 'con stock'}`;
    return `${fmt(antes)} → ${fmt(v)}`;
  }
  async function simular() {
    const cur = await cargar(); let camb = 0, warn = 0;
    console.log('%c── AJUSTES (simulación) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn('❌ NO EXISTE', it.id, it.nombre); warn++; continue; }
      const cambios = Object.entries(it.set).map(([k, v]) => `${k}: ${descColor(k, v, p[k])}`).join('  ·  ');
      console.log(`✏️ ${p.nombre}   ${cambios}`); camb++;
    }
    console.log(`%c${camb} cambios · ${warn} problemas`, 'font-weight:bold');
    console.log('%cPara aplicar:  await ajustes.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = LISTA.filter(it => existe.has(it.id));
    if (!validos.length) { console.log('Nada que cambiar.'); return; }
    if (!confirm('Aplicar ' + validos.length + ' ajuste(s)?')) { console.log('Cancelado.'); return; }
    const batch = writeBatch(db);
    validos.forEach(it => batch.set(doc(db, 'productos', it.id), it.set, { merge: true }));
    await batch.commit();
    console.log('%c✅ ' + validos.length + ' aplicados. Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fresco = await getDocs(collection(db, 'productos'));
    const arr = [];
    fresco.forEach(d => { const p = d.data(), o = { id: d.id };
      SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Listo. Snapshot regenerado: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.ajustes = { simular, aplicar, LISTA };
  console.log('%cajustes cargado (' + LISTA.length + ' ajuste).', 'font-weight:bold', '→ await ajustes.simular()');
  simular();
})();
