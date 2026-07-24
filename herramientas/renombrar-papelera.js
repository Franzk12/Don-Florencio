/* ============================================================================
   RENOMBRAR PAPELERA — sacar "(unidad)" del nombre  —  Santa María Distribuidora
   ----------------------------------------------------------------------------
   Después de limpiar los duplicados, quedó un solo producto por ítem. El
   sufijo "(unidad)" en el nombre ya no aporta (la escala muestra "Por unidad"
   como etiqueta). Este script se lo saca a los 6 ítems ya consolidados.

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión como admin.
   - Consola (F12) → pegá todo → Enter (muestra el plan).
       await renombrarPapelera.aplicar();   // renombra (pide confirmación)
   - Recargá la home.
   ============================================================================ */
(function () {
  const LISTA = [
    { id: 'p_1780333401808_nx52', de: 'Papel Higiénico Elegante 6x30 m (unidad)',   a: 'Papel Higiénico Elegante 6x30 m' },
    { id: 'p_1780333401808_4ylp', de: 'Rollo de Cocina Elegante 200 Paños (unidad)', a: 'Rollo de Cocina Elegante 200 Paños' },
    { id: 'p_1780333401808_a6vf', de: 'Rollo de Cocina Elegante 3x50 (unidad)',      a: 'Rollo de Cocina Elegante 3x50' },
    { id: 'p_1780333401808_05vu', de: 'Rollo de Cocina New Dicha (unidad)',          a: 'Rollo de Cocina New Dicha' },
    { id: 'p_1780333401808_2hcf', de: 'Servilletas Elegante Big x150 (unidad)',      a: 'Servilletas Elegante Big x150' },
    { id: 'p_1780333401808_6svx', de: 'Pañuelos Elegante Pocket x6 (unidad)',        a: 'Pañuelos Elegante Pocket x6' },
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
    let ok = 0, warn = 0;
    console.log('%c── RENAME (simulación) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn(`❌ no existe ${it.id} (${it.de})`); warn++; continue; }
      const match = (p.nombre || '').trim() === it.de;
      console.log(`${match ? '✏️' : '⚠️ NOMBRE ACTUAL DISTINTO'}  "${p.nombre}"  →  "${it.a}"`);
      match ? ok++ : warn++;
    }
    console.log(`%c${ok} a renombrar · ${warn} para revisar`, 'font-weight:bold');
    console.log('%cPara aplicar:  await renombrarPapelera.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }

  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const cur = {}; snap.forEach(d => cur[d.id] = d.data());
    // Solo renombra si el nombre actual coincide con "de" (evita pisar cambios).
    const validos = LISTA.filter(it => cur[it.id] && (cur[it.id].nombre || '').trim() === it.de);
    const saltear = LISTA.filter(it => !validos.includes(it));
    if (saltear.length) console.warn('Se saltean (no existen o nombre distinto):', saltear.map(x => x.id + ' "' + (cur[x.id]?.nombre ?? '—') + '"'));
    if (!validos.length) { console.log('Nada para renombrar.'); return; }
    if (!confirm(`Renombrar ${validos.length} productos?`)) { console.log('Cancelado.'); return; }
    const batch = writeBatch(db);
    validos.forEach(it => batch.set(doc(db, 'productos', it.id), { nombre: it.a }, { merge: true }));
    await batch.commit();
    console.log(`%c✅ Renombrados ${validos.length}. Recargá la home.`, 'color:#2d7a4f;font-weight:bold');
  }

  window.renombrarPapelera = { simular, aplicar, LISTA };
  console.log('%crenombrarPapelera cargado.', 'font-weight:bold', '→ await renombrarPapelera.simular()');
  simular();
})();
