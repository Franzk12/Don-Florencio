/* ============================================================================
   CARGAR PRECIOS DE QUESOS (lista nueva de la dueña)  —  Santa María
   ----------------------------------------------------------------------------
   Actualiza el precio de lista (min) de los 44 quesos que matchearon
   CLARO contra el sitio (subconjunto seguro de la revisión). NO toca los
   efectivo, los productos nuevos ni los dudosos (quedan para la 2ª vuelta).

   CÓMO USARLO:
   - admin.html EN VIVO (don-florencio.vercel.app/admin.html), iniciá sesión.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await cargarQuesos.aplicar();   // aplica (pide confirmación)
   - El snapshot se actualiza solo; igual podés tocar "Publicar catálogo".
   ============================================================================ */
(function () {
  const n0 = v => (v === undefined || v === null || v === '') ? 0 : Number(v);
  const LISTA = [
    { id: 'q783', nombre: 'Cheddar La Quesera', set: { min: 30269 } },
    { id: 'q149', nombre: 'Cheddar La Serenísima', set: { min: 30399 } },
    { id: 'q298', nombre: 'Cheddar Pouch Milkaut', set: { min: 39975 } },
    { id: 'q35', nombre: 'Cheddar Spalen', set: { min: 8150 } },
    { id: 'q437', nombre: 'Cuartirolo Tremblay', set: { min: 7735 } },
    { id: 'q171', nombre: 'Fiambrín La Serenísima', set: { min: 18100 } },
    { id: 'q794', nombre: 'Fiambrín Spalen', set: { min: 7800 } },
    { id: 'q2150', nombre: 'Muzzarella Cilindro Barraza', set: { min: 12890 } },
    { id: 'q2629', nombre: 'Muzzarella Cilindro La Pastora', set: { min: 8829 } },
    { id: 'q151', nombre: 'Muzzarella Cilindro Silvia', set: { min: 10269 } },
    { id: 'q626', nombre: 'Muzzarella Don Genaro', set: { min: 8040 } },
    { id: 'q155', nombre: 'Muzzarella Plancha Silvia', set: { min: 9839 } },
    { id: 'q56', nombre: 'Provoleta Nonna Pia', set: { min: 24045 } },
    { id: 'q272', nombre: 'Queso Azul Verónica', set: { min: 19175 } },
    { id: 'q1222', nombre: 'Queso Blanco La Quesera', set: { min: 26699 } },
    { id: 'q138', nombre: 'Queso Cremoso La Internacional', set: { min: 8399 } },
    { id: 'q284', nombre: 'Queso Cremoso La Pastora', set: { min: 8099 } },
    { id: 'q140', nombre: 'Queso Cremoso Silvia', set: { min: 9535 } },
    { id: 'q157', nombre: 'Queso Gouda Verónica', set: { min: 21599 } },
    { id: 'q974', nombre: 'Queso Parrillero Monta', set: { min: 13780 } },
    { id: 'q165', nombre: 'Queso Pategras Santa María', set: { min: 9099 } },
    { id: 'q158', nombre: 'Queso Pategras Verónica', set: { min: 18920 } },
    { id: 'q168', nombre: 'Queso Por Salut con Sal Silvia', set: { min: 10325 } },
    { id: 'q89', nombre: 'Queso Por Salut sin Sal Silvia', set: { min: 10325 } },
    { id: 'q267', nombre: 'Queso Port Salut sin Sal Verónica', set: { min: 13049 } },
    { id: 'q296', nombre: 'Queso Provolone Silvia', set: { min: 19215 } },
    { id: 'q162', nombre: 'Queso Provolín Monta', set: { min: 12899 } },
    { id: 'q1530', nombre: 'Queso Rallado Individual La Quesera', set: { min: 17745 } },
    { id: 'q2613', nombre: 'Queso Romanito La Quesera', set: { min: 22175 } },
    { id: 'q163', nombre: 'Queso Romanito Monta', set: { min: 11999 } },
    { id: 'q160', nombre: 'Queso Sardo Pintado Monta', set: { min: 11899 } },
    { id: 'q880', nombre: 'Queso Sbrinz Monta', set: { min: 11999 } },
    { id: 'q746', nombre: 'Queso de Barra La Colonia', set: { min: 9159 } },
    { id: 'q130', nombre: 'Queso de Barra La Internacional', set: { min: 9480 } },
    { id: 'q132', nombre: 'Queso de Barra Silvia', set: { min: 11169 } },
    { id: 'q1470', nombre: 'Queso de Barra Sudamlac', set: { min: 9099 } },
    { id: 'q1106', nombre: 'Queso de Barra Tarantela', set: { min: 9599 } },
    { id: 'q129', nombre: 'Queso de Barra Verónica', set: { min: 13990 } },
    { id: 'q72', nombre: 'Queso de Campo', set: { min: 12599 } },
    { id: 'q1756', nombre: 'Ricota García', set: { min: 4370 } },
    { id: 'q1374', nombre: 'Ricota La Pastora', set: { min: 2340 } },
    { id: 'q182', nombre: 'Ricota al Vacío Silvia', set: { min: 4415 } },
    { id: 'q166', nombre: 'Roquefort La Quesera', set: { min: 16449 } },
    { id: 'q234', nombre: 'Sardo Estacionado La Quesera', set: { min: 22075 } },
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
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  async function simular() {
    const cur = await cargar(); let ok = 0, warn = 0, camb = 0;
    console.log('%c── PLAN precios quesos (simulación) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn('❌ NO EXISTE', it.id, it.nombre); warn++; continue; }
      const antes = n0(p.min), desp = it.set.min;
      const chg = antes !== desp;
      if (chg) camb++;
      console.log(`${chg ? '✏️' : '  '} ${p.nombre}  ${fmt(antes)}${chg ? ' -> ' + fmt(desp) : ' (sin cambio)'}`);
      ok++;
    }
    console.log(`%c${ok} ok · ${warn} problemas · ${camb} con cambio de precio · total ${LISTA.length}`, 'font-weight:bold');
    console.log('%cPara aplicar:  await cargarQuesos.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = LISTA.filter(it => existe.has(it.id));
    const faltan = LISTA.filter(it => !existe.has(it.id));
    if (faltan.length) console.warn('No existen (se saltean):', faltan.map(x => x.id + ' ' + x.nombre));
    if (!confirm('Actualizar precio de ' + validos.length + ' quesos?')) { console.log('Cancelado.'); return; }
    for (let i = 0; i < validos.length; i += 400) {
      const batch = writeBatch(db);
      validos.slice(i, i + 400).forEach(it => batch.set(doc(db, 'productos', it.id), it.set, { merge: true }));
      await batch.commit();
    }
    console.log('%c✅ Listo: ' + validos.length + ' quesos actualizados. Tocá "Publicar catálogo".', 'color:#2d7a4f;font-weight:bold');
  }
  window.cargarQuesos = { simular, aplicar, LISTA };
  console.log('%ccargarQuesos cargado.', 'font-weight:bold', '→ await cargarQuesos.simular()');
  simular();
})();
