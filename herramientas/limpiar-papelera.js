/* ============================================================================
   LIMPIAR DUPLICADOS DE PAPELERA  —  Santa María Distribuidora
   ----------------------------------------------------------------------------
   El catálogo tenía cada producto de papelera PARTIDO en 2-3 productos
   separados: "(unidad)", "(mayor)" y a veces "(bulto)". Con la escala nueva
   (un solo producto muestra unidad / por mayor / por mayor efectivo) esos
   duplicados sobran. Este script BORRA los duplicados y deja solo el
   "(unidad)" — que ya lleva la escala cargada por `cargar-precios.js`.

   ⚠️ CORRÉ PRIMERO `cargar-precios.js` (pone la escala en los "(unidad)")
      y recién después este, que borra los sobrantes.

   Solo borra los duplicados de los 7 ítems CONFIRMADOS por la dueña.
   Los NO confirmados (Papel Higiénico 120m/80m, Rollo 300/360 Paños,
   Servilletas x80) NO se tocan — faltan sus precios (ver "PENDIENTES").

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión como admin.
   - Consola (F12) → pegá todo → Enter (muestra qué borraría).
       await limpiarPapelera.aplicar();   // borra (pide confirmación)
   ============================================================================ */
(function () {
  // Duplicados a BORRAR (se mantiene el "(unidad)" de cada ítem).
  const BORRAR = [
    { id: 'p_1780333401808_qr8g', nombre: 'Papel Higiénico Elegante 6x30 m',       queda: 'nx52 (unidad)' },
    { id: 'p_1780333401808_y9jh', nombre: 'Rollo de Cocina Elegante 200 Paños (bulto)', queda: '4ylp (unidad)' },
    { id: 'p_1780333401808_ala2', nombre: 'Rollo de Cocina Elegante 3x50 (mayor)',  queda: 'a6vf (unidad)' },
    { id: 'p_1780333401808_8idz', nombre: 'Rollo de Cocina New Dicha (mayor)',      queda: '05vu (unidad)' },
    { id: 'p_1780333401808_whgv', nombre: 'Servilletas Elegante Big x150 (mayor)',  queda: '2hcf (unidad)' },
    { id: 'p_1780333401808_xvgy', nombre: 'Pañuelos Elegante x150 (mayor)',         queda: 'ay5u (unidad)' },
    { id: 'p_1780333401808_8e32', nombre: 'Pañuelos Elegante Pocket x6 (mayor)',    queda: '6svx (unidad)' },
  ];

  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }
  const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

  async function cargar() {
    const { db, fsMod } = await fb();
    const snap = await fsMod.getDocs(fsMod.collection(db, 'productos'));
    const cur = {}; snap.forEach(d => cur[d.id] = d.data()); return cur;
  }

  async function simular() {
    const cur = await cargar();
    let ok = 0, warn = 0;
    console.log('%c── SE BORRARÍAN estos duplicados (simulación) ──', 'font-weight:bold');
    for (const it of BORRAR) {
      const p = cur[it.id];
      if (!p) { console.log(`•  ${it.id}  ya no existe (¿ya borrado?) — ${it.nombre}`); continue; }
      const nameOk = norm(p.nombre).includes(norm(it.nombre)) || norm(it.nombre).includes(norm(p.nombre));
      console.log(`${nameOk ? '🗑' : '⚠️ NOMBRE DISTINTO'}  ${p.nombre}  (id ${it.id})  →  queda ${it.queda}`);
      nameOk ? ok++ : warn++;
    }
    console.log(`%c${ok} a borrar · ${warn} para revisar`, 'font-weight:bold');
    console.log('%cPara borrar:  await limpiarPapelera.aplicar()', 'color:#a11;font-weight:bold');
  }

  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = BORRAR.filter(it => existe.has(it.id));
    if (!validos.length) { console.log('No hay duplicados para borrar (¿ya limpiado?).'); return; }
    if (!confirm(`BORRAR ${validos.length} productos duplicados de papelera? (no se puede deshacer)`)) { console.log('Cancelado.'); return; }
    const batch = writeBatch(db);
    validos.forEach(it => batch.delete(doc(db, 'productos', it.id)));
    await batch.commit();
    console.log(`%c✅ Borrados ${validos.length} duplicados. Recargá la home.`, 'color:#2d7a4f;font-weight:bold');
  }

  window.limpiarPapelera = { simular, aplicar, BORRAR };
  console.log('%climpiarPapelera cargado.', 'font-weight:bold', '→ corré  await limpiarPapelera.simular()');
  simular();
})();
