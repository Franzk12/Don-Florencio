/* ============================================================================
   ALTA DE PRODUCTOS NUEVOS  —  Santa María
   ----------------------------------------------------------------------------
   Da de alta productos que la dueña confirmó que son nuevos. Mismo esquema que
   el alta del admin. Si el id ya existe, NO lo pisa (avisa y lo saltea).
   Actual: Paleta Emezeta (f673, fiambres, $8.355) — revisión fiambres 27/07.
   Nota: en su lista figura como OFERTA → el precio/flag de oferta se define el
   lunes; por ahora entra como producto normal a $8.355, sin foto.

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await altaProductos.aplicar();   // crea (pide confirmación)
   - Al terminar REGENERA el snapshot solo.
   ============================================================================ */
(function () {
  const NUEVOS = [
    { id: 'f673', nombre: 'Paleta Emezeta', cat: 'fiambres',
      desc: 'Fiambre de paleta, marca Emezeta.', min: 8355, stock: true },
  ];
  const DEF = { may: 0, orden: 0, enOferta: false, fotoUrl: '', tieneFoto: false, fotoPosX: 50, fotoPosY: 50 };
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }
  async function cargar() {
    const { db, fsMod } = await fb();
    const snap = await fsMod.getDocs(fsMod.collection(db, 'productos'));
    const ids = new Set(); snap.forEach(d => ids.add(d.id)); return ids;
  }
  async function simular() {
    const ids = await cargar();
    console.log('%c── ALTA productos (simulación) ──', 'font-weight:bold');
    for (const p of NUEVOS) {
      if (ids.has(p.id)) console.warn(`⚠️ YA EXISTE ${p.id} — se saltea`);
      else console.log(`🆕 crear ${p.id}  "${p.nombre}"  [${p.cat}]  ${fmt(p.min)}  ${p.stock ? 'con stock' : 'sin stock'}`);
    }
    console.log('%cPara aplicar:  await altaProductos.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const ids = new Set(); snap.forEach(d => ids.add(d.id));
    const crear = NUEVOS.filter(p => !ids.has(p.id));
    if (!crear.length) { console.log('Nada para crear (ya existen).'); return; }
    if (!confirm('Crear ' + crear.length + ' producto(s) nuevo(s)?')) { console.log('Cancelado.'); return; }
    const batch = writeBatch(db);
    crear.forEach(p => {
      const o = { ...DEF, ...p }; delete o.id;
      batch.set(doc(db, 'productos', p.id), o);
    });
    await batch.commit();
    console.log('%c✅ ' + crear.length + ' creado(s). Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fresco = await getDocs(collection(db, 'productos'));
    const arr = [];
    fresco.forEach(d => { const p = d.data(), o = { id: d.id };
      SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Listo. Snapshot regenerado: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.altaProductos = { simular, aplicar, NUEVOS };
  console.log('%caltaProductos cargado (' + NUEVOS.length + ' nuevo).', 'font-weight:bold', '→ await altaProductos.simular()');
  simular();
})();
