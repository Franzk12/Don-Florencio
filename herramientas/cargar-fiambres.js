/* ============================================================================
   CARGAR PRECIOS DE FIAMBRES (lista nueva de la dueña)  —  Santa María
   ----------------------------------------------------------------------------
   Actualiza el precio de lista (min) de 49 productos que matchearon CLARO
   contra el sitio (subconjunto LIMPIO de la revisión: match único por
   nombre+tamaño, sin OFERTA, sin EFECTIVO, sin bajas sospechosas).
   NO toca los OFERTA, EFECTIVO, nuevos ni dudosos → ver
   revisiones/fiambres-precios-revision.xlsx (pestañas Revisar/Nuevos).

   CÓMO USARLO:
   - admin.html EN VIVO (don-florencio.vercel.app/admin.html), iniciá sesión.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await cargarFiambres.aplicar();   // aplica (pide confirmación)
   - Al terminar REGENERA el snapshot solo (la home se actualiza).
   ============================================================================ */
(function () {
  const n0 = v => (v === undefined || v === null || v === '') ? 0 : Number(v);
  const LISTA = [
    { id: 'f615', nombre: 'Chorizo Candelario Bierzo', set: { min: 19299 } },
    { id: 'f1399', nombre: 'Leberwurst Calchaquí', set: { min: 1499 } },
    { id: 'f265', nombre: 'Longaniza Bastón Bierzo', set: { min: 19865 } },
    { id: 'f276', nombre: 'Longaniza Bastón Leandrin', set: { min: 13259 } },
    { id: 'f238', nombre: 'Longaniza Larga/Corta Bierzo', set: { min: 19299 } },
    { id: 'f210', nombre: 'Mortadela Bierzo', set: { min: 9865 } },
    { id: 'f212', nombre: 'Mortadela Bocha Calchaquí', set: { min: 9399 } },
    { id: 'f211', nombre: 'Mortadela Cañón Calchaquí', set: { min: 8115 } },
    { id: 'f5048', nombre: 'Mortadela Grasetto', set: { min: 6275 } },
    { id: 'f1400', nombre: 'Mortadela Piccola Calchaquí', set: { min: 2649 } },
    { id: 'f5046', nombre: 'Mortadela con Pistacho Grasetto', set: { min: 7629 } },
    { id: 'f285', nombre: 'Panceta Ahumada Calchaquí', set: { min: 20149 } },
    { id: 'f1637', nombre: 'Panceta Ahumada Cram', set: { min: 13740 } },
    { id: 'f491', nombre: 'Panceta Ahumada González', set: { min: 14320 } },
    { id: 'f32', nombre: 'Panceta Ahumada con Cuero Emezeta', set: { min: 19515 } },
    { id: 'f250', nombre: 'Panceta Salada Calchaquí', set: { min: 20959 } },
    { id: 'f1117', nombre: 'Panceta Salada Cram', set: { min: 14229 } },
    { id: 'f750', nombre: 'Panceta Salada Emezeta', set: { min: 19515 } },
    { id: 'f295', nombre: 'Panceta Salada González', set: { min: 13655 } },
    { id: 'f1189', nombre: 'Panceta Tiernizada Emezeta', set: { min: 9159 } },
    { id: 'f760', nombre: 'Salame 1154 Bierzo', set: { min: 11899 } },
    { id: 'f229', nombre: 'Salame Milán Leandrin', set: { min: 11115 } },
    { id: 'f255', nombre: 'Salamines Bierzo', set: { min: 18419 } },
    { id: 'f274', nombre: 'Salamines Leandrin', set: { min: 13899 } },
    { id: 'f218', nombre: 'Salchichón Bierzo', set: { min: 5389 } },
    { id: 'f202', nombre: 'Salchichón González', set: { min: 4385 } },
    { id: 'f5045', nombre: 'Salchichón Grasetto', set: { min: 6100 } },
    { id: 'f248', nombre: 'Bondiola Calchaquí', set: { min: 27760 } },
    { id: 'f1206', nombre: 'Bondiola Cram', set: { min: 21800 } },
    { id: 'f186', nombre: 'Bondiola González', set: { min: 18489 } },
    { id: 'f179', nombre: 'Jamón Cocido Calchaquí', set: { min: 13515 } },
    { id: 'f174', nombre: 'Jamón Cocido El Madrileño', set: { min: 6720 } },
    { id: 'f3965', nombre: 'Jamón Cocido Grasetto', set: { min: 11380 } },
    { id: 'f185', nombre: 'Jamón Crudo Coliqueo', set: { min: 22360 } },
    { id: 'f183', nombre: 'Jamón Crudo Valentín', set: { min: 16250 } },
    { id: 'f2860', nombre: 'Jamón Natural Grasetto', set: { min: 12169 } },
    { id: 'f492', nombre: 'Lomito Ahumado con Hierbas González', set: { min: 13819 } },
    { id: 'f1796', nombre: 'Lomo Grasetto', set: { min: 15200 } },
    { id: 'f930', nombre: 'Matambre Finca Dorada', set: { min: 11089 } },
    { id: 'f7', nombre: 'Matambre de Carne Novicer', set: { min: 14469 } },
    { id: 'f198', nombre: 'Paleta Cocida Calchaquí', set: { min: 11519 } },
    { id: 'f193', nombre: 'Paleta Cocida Madrileño', set: { min: 6240 } },
    { id: 'f245', nombre: 'Paleta Cocida Navarro', set: { min: 3499 } },
    { id: 'f3102', nombre: 'Paleta Piara', set: { min: 3799 } },
    { id: 'f5028', nombre: 'Paleta Sandwichera Grasetto', set: { min: 5180 } },
    { id: 'f644', nombre: 'Paleta Sandwichera Jetfood', set: { min: 5630 } },
    { id: 'f2550', nombre: 'Queso de Cerdo Bierzo', set: { min: 5389 } },
    { id: 'f2777', nombre: 'Queso de Cerdo Cram', set: { min: 5400 } },
    { id: 'f216', nombre: 'Queso de Cerdo González', set: { min: 4578 } },
  ];
  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  async function cargar() {
    const { db, fsMod } = await fb();
    const snap = await fsMod.getDocs(fsMod.collection(db, 'productos'));
    const cur = {}; snap.forEach(d => cur[d.id] = d.data()); return cur;
  }
  async function simular() {
    const cur = await cargar(); let ok = 0, warn = 0, camb = 0;
    console.log('%c── PLAN precios fiambres (simulación) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn('❌ NO EXISTE', it.id, it.nombre); warn++; continue; }
      const antes = n0(p.min), desp = it.set.min, chg = antes !== desp;
      if (chg) camb++;
      console.log(`${chg ? '✏️' : '  '} ${p.nombre}  ${fmt(antes)}${chg ? ' -> ' + fmt(desp) : ' (sin cambio)'}`);
      ok++;
    }
    console.log(`%c${ok} ok · ${warn} problemas · ${camb} con cambio · total ${LISTA.length}`, 'font-weight:bold');
    console.log('%cPara aplicar:  await cargarFiambres.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = LISTA.filter(it => existe.has(it.id));
    const faltan = LISTA.filter(it => !existe.has(it.id));
    if (faltan.length) console.warn('No existen (se saltean):', faltan.map(x => x.id + ' ' + x.nombre));
    if (!confirm('Actualizar precio de ' + validos.length + ' productos de fiambres?')) { console.log('Cancelado.'); return; }
    for (let i = 0; i < validos.length; i += 400) {
      const batch = writeBatch(db);
      validos.slice(i, i + 400).forEach(it => batch.set(doc(db, 'productos', it.id), it.set, { merge: true }));
      await batch.commit();
    }
    console.log('%c✅ ' + validos.length + ' precios actualizados. Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    // Regenerar snapshot (config/catalogo) — mismo criterio que admin.html
    const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fresco = await getDocs(collection(db, 'productos'));
    const arr = [];
    fresco.forEach(d => { const p = d.data(), o = { id: d.id };
      SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Listo. Snapshot regenerado: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.cargarFiambres = { simular, aplicar, LISTA };
  console.log('%ccargarFiambres cargado (49 productos).', 'font-weight:bold', '→ await cargarFiambres.simular()');
  simular();
})();
