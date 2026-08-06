/* ============================================================================
   QUESOS — bajas + alta (revisión dueña 28/07)  —  Santa María
   ----------------------------------------------------------------------------
   BORRA 3 productos que la dueña dejó de trabajar + CREA Cremoso San Lorenzo.
   Sin confirm(). Regenera snapshot. ⚠️ Correr con escudo de Brave ABAJO + F5.
   OJO: el borrado NO se deshace.

       await quesosAB.aplicar();
   ============================================================================ */
(function () {
  const BORRAR = [
    { id: 'q1765', nombre: 'Mini Queso Azul Verónica' },
    { id: 'q268',  nombre: 'Queso Port Salut Entero Verónica' },
    { id: 'q477',  nombre: 'Queso Por Salut sin Lactosa' },
  ];
  const NUEVOS = [
    { id: 'p_nuevo_cremoso_sanlorenzo', nombre: 'Queso Cremoso San Lorenzo', cat: 'quesos', min: 7699, desc: 'Queso cremoso San Lorenzo.' },
  ];
  const DEF = { may: 0, orden: 0, enOferta: false, fotoUrl: '', tieneFoto: false, fotoPosX: 50, fotoPosY: 50, stock: true };
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), fsMod: f };
  }
  async function ids() { const { db, fsMod } = await fb(); const s = await fsMod.getDocs(fsMod.collection(db, 'productos')); const set = new Set(); s.forEach(d => set.add(d.id)); return set; }
  async function simular() {
    const ex = await ids();
    console.log('%c── QUESOS bajas/alta (simulación) ──', 'font-weight:bold');
    for (const b of BORRAR) console.log(ex.has(b.id) ? `🗑️ BORRAR ${b.nombre} (${b.id})` : `⚠️ ya no existe ${b.id}`);
    for (const p of NUEVOS) console.log(ex.has(p.id) ? `⚠️ YA EXISTE ${p.id}` : `🆕 CREAR ${p.nombre} [${p.cat}] ${fmt(p.min)}`);
    console.log('%cAplicar:  await quesosAB.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc, deleteDoc } = fsMod;
    const s = await getDocs(collection(db, 'productos')); const ex = new Set(); s.forEach(d => ex.add(d.id));
    let borrados = 0, creados = 0;
    for (const b of BORRAR) { if (ex.has(b.id)) { await deleteDoc(doc(db, 'productos', b.id)); borrados++; console.log('🗑️ borrado', b.nombre); } }
    const batch = writeBatch(db);
    NUEVOS.filter(p => !ex.has(p.id)).forEach(p => { const o = { ...DEF, ...p }; delete o.id; batch.set(doc(db, 'productos', p.id), o); creados++; });
    await batch.commit();
    console.log('%c✅ ' + borrados + ' borrados + ' + creados + ' creados. Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    const F = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fr = await getDocs(collection(db, 'productos')); const arr = [];
    fr.forEach(d => { const p = d.data(), o = { id: d.id }; F.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Snapshot: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.quesosAB = { simular, aplicar, BORRAR, NUEVOS };
  console.log('%cquesosAB cargado (' + BORRAR.length + ' bajas + ' + NUEVOS.length + ' alta).', 'font-weight:bold', '→ await quesosAB.simular()');
  simular();
})();
