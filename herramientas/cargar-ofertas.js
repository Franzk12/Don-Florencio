/* ============================================================================
   CARGAR OFERTAS — Fase 2 (descuentos reales)  —  Santa María
   ----------------------------------------------------------------------------
   La lista OFERTA de la dueña (231) resultó NO ser descuentos: 133 tenían el
   mismo precio, 44 más caras, 8 efectivo, 37 no están en el sitio. Solo 8 son
   descuentos reales (se sacó el typo de Fideos Letritas -89%). Este script
   carga el `precioOferta` de esos 8. NO los activa (enOferta queda en false):
   la dueña decide cuáles mostrar con el toggle "En oferta" del admin.

   USO (admin en vivo, sesión iniciada, escudo Brave abajo + Ctrl+Shift+R):
     await ofertas.aplicar();     // carga precioOferta en los 8
     await ofertas.probar();      // PRUEBA: enciende 3 (con foto) para ver el carrusel
     await ofertas.apagarPrueba();// apaga esas 3
   Usa parche liviano de snapshot (getDoc config -> patch -> setDoc), sin getDocs.
   ============================================================================ */
(function () {
  const LISTA = [
    { id: 'p_imp_1783122342_0188', nombre: 'Casancrem Clásico La Serenísima', min: 8025, precioOferta: 5475 },
    { id: 'p_imp_1783122342_0195', nombre: 'Yogur Bebible Tregar Arándanos', min: 2425, precioOferta: 2139 },
    { id: 'p_imp_1783122342_0180', nombre: 'Miel Pura Santa María (1 kg)', min: 5999, precioOferta: 5299 },
    { id: 'q3217', nombre: 'Queso Rallado La Serenísima (70 g)', min: 2969, precioOferta: 2720 },
    { id: 'f817', nombre: 'Lomo Ahumado con Hierbas', min: 15540, precioOferta: 14299 },
    { id: 'q1114', nombre: 'Queso Rallado La Serenísima (130 g)', min: 5420, precioOferta: 5055 },
    { id: 'q8', nombre: 'Muzzarella en Plancha La Pastora', min: 9100, precioOferta: 8649 },
    { id: 'f225', nombre: 'Salame Tipo Milán Bierzo', min: 14430, precioOferta: 13999 },
  ];
  const DEMO = ['f817','f225','q1114'];
  const fmt = n => '$' + Number(n||0).toLocaleString('es-AR');
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  async function patchSnap(cambios) {
    const { db, f } = await fb();
    const s = await f.getDoc(f.doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos); let n = 0;
    arr.forEach(p => { if (cambios[p.id]) { Object.assign(p, cambios[p.id]); n++; } });
    await f.setDoc(f.doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    return n;
  }
  function simular() {
    console.log('%c-- OFERTAS Fase 2 (descuentos reales) --', 'font-weight:bold');
    LISTA.forEach(o => { const d = ((o.precioOferta-o.min)/o.min*100).toFixed(0); console.log('  ' + o.nombre + ': ' + fmt(o.min) + ' -> ' + fmt(o.precioOferta) + ' (' + d + '%)'); });
    console.log('%caplicar: await ofertas.aplicar()  |  probar: await ofertas.probar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, f } = await fb(); const { doc, writeBatch } = f;
    const batch = writeBatch(db);
    LISTA.forEach(o => batch.set(doc(db,'productos',o.id), { precioOferta: o.precioOferta }, { merge:true }));
    await batch.commit();
    const cambios = {}; LISTA.forEach(o => cambios[o.id] = { precioOferta: o.precioOferta });
    const n = await patchSnap(cambios);
    console.log('%c OK ' + LISTA.length + ' precioOferta cargados (snapshot: ' + n + '). enOferta sigue en false.', 'color:#2d7a4f;font-weight:bold');
  }
  async function probar() {
    const { db, f } = await fb(); const { doc, writeBatch } = f;
    const sel = LISTA.filter(o => DEMO.includes(o.id));
    const batch = writeBatch(db);
    sel.forEach(o => batch.set(doc(db,'productos',o.id), { precioOferta: o.precioOferta, enOferta: true }, { merge:true }));
    await batch.commit();
    const cambios = {}; sel.forEach(o => cambios[o.id] = { precioOferta: o.precioOferta, enOferta: true });
    await patchSnap(cambios);
    console.log('%c OK PRUEBA: ' + sel.length + ' activadas (' + sel.map(x=>x.nombre).join(', ') + '). Mira "Ofertas destacadas" en la home.', 'color:#2d7a4f;font-weight:bold');
  }
  async function apagarPrueba() {
    const { db, f } = await fb(); const { doc, writeBatch } = f;
    const batch = writeBatch(db);
    DEMO.forEach(id => batch.set(doc(db,'productos',id), { enOferta: false }, { merge:true }));
    await batch.commit();
    const cambios = {}; DEMO.forEach(id => cambios[id] = { enOferta: false });
    await patchSnap(cambios);
    console.log('%c OK prueba apagada (' + DEMO.length + ').', 'color:#2d7a4f;font-weight:bold');
  }
  window.ofertas = { simular, aplicar, probar, apagarPrueba, LISTA };
  console.log('%cofertas cargado (' + LISTA.length + ' descuentos reales).', 'font-weight:bold', '-> await ofertas.simular()');
  simular();
})();
