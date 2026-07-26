/* ============================================================================
   ARREGLOS DE CATÁLOGO (recategorizar / correcciones puntuales)
   ----------------------------------------------------------------------------
   Correcciones puntuales indicadas por la dueña (audios 25/07).
   Por ahora: Burzot Sello de Oro estaba en "bebidas" como aperitivo, pero es un
   SALAMÍN (embutido) — se mueve a embutidos y se corrige la descripción.

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await arreglos.aplicar();   // aplica (pide confirmación)
   - Al final REGENERÁ el snapshot (botón "Publicar catálogo" tras recargar,
     o el one-liner de regenerar snapshot).
   ============================================================================ */
(function () {
  const CAMBIOS = [
    { id: 'p_imp_1783122342_0146', nombre: 'Burzot Sello de Oro',
      set: { cat: 'embutidos', desc: 'Salamín Burzot Sello de Oro.' } },
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
    const cur = await cargar();
    console.log('%c── ARREGLOS (simulación) ──', 'font-weight:bold');
    for (const it of CAMBIOS) {
      const p = cur[it.id];
      if (!p) { console.warn('❌ NO EXISTE', it.id, it.nombre); continue; }
      const cambios = Object.entries(it.set).map(([k, v]) => `${k}: ${p[k] ?? '—'} → ${v}`).join('  ·  ');
      console.log(`✏️ ${p.nombre}\n      ${cambios}`);
    }
    console.log('%cPara aplicar:  await arreglos.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = CAMBIOS.filter(it => existe.has(it.id));
    if (!validos.length) { console.log('Nada para cambiar.'); return; }
    if (!confirm('Aplicar ' + validos.length + ' cambio(s)?')) { console.log('Cancelado.'); return; }
    const batch = writeBatch(db);
    validos.forEach(it => batch.set(doc(db, 'productos', it.id), it.set, { merge: true }));
    await batch.commit();
    console.log('%c✅ Listo. Regenerá el snapshot (Publicar catálogo).', 'color:#2d7a4f;font-weight:bold');
  }
  window.arreglos = { simular, aplicar, CAMBIOS };
  console.log('%carreglos cargado.', 'font-weight:bold', '→ await arreglos.simular()');
  simular();
})();
