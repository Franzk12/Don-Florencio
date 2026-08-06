/* ============================================================================
   ALTA ALMACÉN — productos nuevos (revisión dueña 28/07)  —  Santa María
   ----------------------------------------------------------------------------
   Crea 6 productos nuevos + corrige el precio del Alfajor Escolar (ya existía).
   Sin confirm(). Regenera snapshot solo. Ids nuevos = p_nuevo_<cod de la dueña>.

       await altaAlmacen.aplicar();
   ============================================================================ */
(function () {
  const NUEVOS = [
    { id: 'p_nuevo_2825', nombre: 'Champiñones Enteros Cumaná (400 g)',        cat: 'encurtidos', min: 2895, desc: 'Champiñones enteros en conserva, marca Cumaná.' },
    { id: 'p_nuevo_1721', nombre: 'Savora Pomo (200 g)',                        cat: 'aderezos',   min: 2410, desc: 'Mostaza Savora en pomo.' },
    { id: 'p_nuevo_448',  nombre: 'Mr Músculo Extra Power Gatillo (500 cc)',    cat: 'limpieza',   min: 7470, desc: 'Limpiador Mr Músculo Extra Power con gatillo.' },
    { id: 'p_nuevo_104',  nombre: 'Pasas de Uva sin Semilla',                   cat: 'almacen',    min: 6789, desc: 'Pasas de uva sin semilla.' },
    { id: 'p_nuevo_5022', nombre: 'Tita (unidad)',                              cat: 'dulces',     min: 445,  desc: 'Galletita bañada Tita, por unidad.' },
    { id: 'p_nuevo_708',  nombre: 'Shampoo Sedal Balance Reparación (300 ml)',  cat: 'limpieza',   min: 2549, desc: 'Shampoo Sedal Balance Reparación.' },
  ];
  const AJUSTES = [
    { id: 'p_imp_1783122342_0212', nombre: 'Alfajores Escolares x5 (ya existía)', set: { min: 1150 } },
  ];
  const DEF = { may: 0, orden: 0, enOferta: false, fotoUrl: '', tieneFoto: false, fotoPosX: 50, fotoPosY: 50, stock: true };
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }
  async function ids() { const { db, fsMod } = await fb(); const s = await fsMod.getDocs(fsMod.collection(db, 'productos')); const set = new Set(); s.forEach(d => set.add(d.id)); return set; }
  async function simular() {
    const ex = await ids();
    console.log('%c── ALTA ALMACÉN (simulación) ──', 'font-weight:bold');
    for (const p of NUEVOS) console.log(ex.has(p.id) ? `⚠️ YA EXISTE ${p.id}` : `🆕 ${p.nombre}  [${p.cat}]  ${fmt(p.min)}`);
    for (const a of AJUSTES) console.log(`✏️ ${a.nombre}  → ${fmt(a.set.min)}`);
    console.log('%cAplicar:  await altaAlmacen.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
    const s = await getDocs(collection(db, 'productos')); const ex = new Set(); s.forEach(d => ex.add(d.id));
    const batch = writeBatch(db);
    let nuevos = 0;
    NUEVOS.filter(p => !ex.has(p.id)).forEach(p => { const o = { ...DEF, ...p }; delete o.id; batch.set(doc(db, 'productos', p.id), o); nuevos++; });
    AJUSTES.filter(a => ex.has(a.id)).forEach(a => batch.set(doc(db, 'productos', a.id), a.set, { merge: true }));
    await batch.commit();
    console.log('%c✅ ' + nuevos + ' creados + ' + AJUSTES.length + ' ajuste. Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fresco = await getDocs(collection(db, 'productos')); const arr = [];
    fresco.forEach(d => { const p = d.data(), o = { id: d.id }; SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Listo. Snapshot: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.altaAlmacen = { simular, aplicar, NUEVOS, AJUSTES };
  console.log('%caltaAlmacen cargado (' + NUEVOS.length + ' nuevos + ' + AJUSTES.length + ' ajuste).', 'font-weight:bold', '→ await altaAlmacen.simular()');
  simular();
})();
