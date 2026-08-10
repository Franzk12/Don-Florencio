/* ============================================================================
   CARGAR REVISIÓN DE LA DUEÑA (10/08)  —  Santa María
   ----------------------------------------------------------------------------
   Aplica lo que la dueña marcó en ofertas-para-completar.xlsx (revisado):
     · 6 OFERTAS reales  -> precioOferta + enOferta (aparecen en el carrusel)
     · 8 SIN STOCK       -> stock=false
     · 6 EFECTIVO        -> min (lista) + efectivo (precio contado)
     · 4 CORRECCIONES    -> min (precio nuevo)
   El de aumentos quedó cerrado (los 6 "chequear" eran tamaños/productos
   distintos, no aumentos). Dudosos afuera: Yogur Natural LS, Puré Del Valle,
   Cerveza 361 (se revisan aparte).

   USO (admin en vivo, sesión iniciada, escudo Brave abajo + Ctrl+Shift+R):
     await revision.aplicar();
   Parche liviano de snapshot (getDoc config -> patch -> setDoc), sin getDocs.
   ============================================================================ */
(function () {
  const OFERTAS = [
    { id:'f225', nombre:'Salame Tipo Milán Bierzo', precioOferta:13999 },
    { id:'p_imp_1783122342_0188', nombre:'Casancrem Clásico La Serenísima', precioOferta:5475 },
    { id:'q8', nombre:'Muzzarella en Plancha La Pastora', precioOferta:8649 },
    { id:'q1114', nombre:'Queso Rallado La Serenísima (130 g)', precioOferta:5055 },
    { id:'q3217', nombre:'Queso Rallado La Serenísima (70 g)', precioOferta:2720 },
    { id:'p_imp_1783122342_0195', nombre:'Yogur Bebible Tregar Arándanos', precioOferta:2139 },
  ];
  const SINSTOCK = [
    { id:'p_imp_1783122342_0146', nombre:'Burzot Sello de Oro' },
    { id:'q157', nombre:'Queso Gouda Verónica' },
    { id:'p_imp_1783122342_0055', nombre:'Flan Clásico de Vainilla La Serenísima' },
    { id:'p_imp_1783122342_0196', nombre:'Yogurísimo Frutilla' },
    { id:'p_imp_1783122342_0142', nombre:'Bebida Arcor Multifruta (1 L)' },
    { id:'p_imp_1783122342_0197', nombre:'Ravioles de Pollo y Espinaca' },
    { id:'p_imp_1783122342_0090', nombre:'Pan Dulce Don Satur sin Fruta' },
    { id:'p_imp_1783122342_0190', nombre:'Repelente Above Protect (150 ml)' },
  ];
  const EFECTIVO = [
    { id:'f3102', nombre:'Paleta Piara', min:3799, efectivo:3499 },
    { id:'q141', nombre:'Queso Cremoso Punta del Agua', min:10800, efectivo:9150 },
    { id:'q144', nombre:'Queso Cremón La Serenísima', min:12499, efectivo:10599 },
    { id:'q133', nombre:'Queso de Barra Punta del Agua', min:12720, efectivo:10750 },
    { id:'p_imp_1783122342_0545', nombre:'Queso Sardo Estacionado Punta del Agua', min:19200, efectivo:16250 },
    { id:'f2017', nombre:'Jamón Madrileño', min:6720, efectivo:5280 },
  ];
  const CORREC = [
    { id:'p_imp_1783122342_0164', nombre:'Fideos Letritas Lucchetti', antes:1199, min:1375 },
    { id:'p_imp_1783122342_0158', nombre:'Fideos Moño Lucchetti', antes:1599, min:1375 },
    { id:'p_imp_1783122342_0092', nombre:'Postre Árabe Caviwa', antes:31145, min:31519 },
    { id:'p_imp_1783122342_0114', nombre:'Yerba Mate Mañanita (500 g)', antes:1799, min:1815 },
  ];
  const fmt = n => '$' + Number(n||0).toLocaleString('es-AR');
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  function simular() {
    console.log('%c-- REVISIÓN dueña (simulación) --', 'font-weight:bold');
    console.log('🔥 Ofertas:', OFERTAS.length); OFERTAS.forEach(o => console.log('   ', o.nombre, '-> oferta ' + fmt(o.precioOferta)));
    console.log('📦 Sin stock:', SINSTOCK.length); SINSTOCK.forEach(o => console.log('   ', o.nombre));
    console.log('💵 Efectivo:', EFECTIVO.length); EFECTIVO.forEach(o => console.log('   ', o.nombre, fmt(o.min) + ' / ' + fmt(o.efectivo)));
    console.log('✏️ Correcciones:', CORREC.length); CORREC.forEach(o => console.log('   ', o.nombre, fmt(o.antes) + ' -> ' + fmt(o.min)));
    console.log('%caplicar: await revision.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, f } = await fb();
    const { doc, setDoc, writeBatch, getDoc } = f;
    const batch = writeBatch(db);
    OFERTAS.forEach(o => batch.set(doc(db,'productos',o.id), { precioOferta:o.precioOferta, enOferta:true }, { merge:true }));
    SINSTOCK.forEach(o => batch.set(doc(db,'productos',o.id), { stock:false }, { merge:true }));
    EFECTIVO.forEach(o => batch.set(doc(db,'productos',o.id), { min:o.min, efectivo:o.efectivo }, { merge:true }));
    CORREC.forEach(o => batch.set(doc(db,'productos',o.id), { min:o.min }, { merge:true }));
    await batch.commit();
    // parche liviano del snapshot
    const cambios = {};
    OFERTAS.forEach(o => cambios[o.id] = Object.assign(cambios[o.id]||{}, { precioOferta:o.precioOferta, enOferta:true }));
    SINSTOCK.forEach(o => cambios[o.id] = Object.assign(cambios[o.id]||{}, { stock:false }));
    EFECTIVO.forEach(o => cambios[o.id] = Object.assign(cambios[o.id]||{}, { min:o.min, efectivo:o.efectivo }));
    CORREC.forEach(o => cambios[o.id] = Object.assign(cambios[o.id]||{}, { min:o.min }));
    const s = await getDoc(doc(db,'config','catalogo'));
    const a = JSON.parse(s.data().productos); let n = 0;
    a.forEach(p => { if (cambios[p.id]) { Object.assign(p, cambios[p.id]); n++; } });
    await setDoc(doc(db,'config','catalogo'), { productos: JSON.stringify(a), count: a.length, updatedAt: Date.now() });
    console.log('%c OK aplicado: ' + OFERTAS.length + ' ofertas, ' + SINSTOCK.length + ' sin stock, ' + EFECTIVO.length + ' efectivo, ' + CORREC.length + ' correcciones (snapshot: ' + n + ').', 'color:#2d7a4f;font-weight:bold');
  }
  window.revision = { simular, aplicar, OFERTAS, SINSTOCK, EFECTIVO, CORREC };
  console.log('%crevision cargada.', 'font-weight:bold', '-> await revision.simular()');
  simular();
})();
