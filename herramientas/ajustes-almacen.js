/* ============================================================================
   AJUSTES ALMACÉN — revisión de la dueña (28/07)  —  Santa María
   ----------------------------------------------------------------------------
   61 productos SIN STOCK + 5 correcciones de precio (Cropp Maní) + 2 "mismo
   producto" confirmados (Perejil 537 sobres x5 $2.430, Acond. Sedal $2.549).
   NO usa confirm() (evita el bug de "no permitir diálogos"): simular muestra el
   plan; aplicar escribe directo. Regenera el snapshot solo.

   CÓMO USARLO:
   - admin.html EN VIVO, iniciá sesión (con escudo de Brave BAJO para el sitio).
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await ajustesAlmacen.aplicar();
   ============================================================================ */
(function () {
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  const LISTA = [
    { id: 'p_imp_1783122342_0204', nombre: "Aceite Bonoleo (900 cc)", set: { stock: false } },
    { id: 'p_imp_1783122342_0205', nombre: "Aceite Caracas Bidón Chico", set: { stock: false } },
    { id: 'p_imp_1783122342_0023', nombre: "Granas Celestes 537 (sobres x5)", set: { stock: false } },
    { id: 'p_imp_1783122342_0178', nombre: "Ketchup La Campagnola (250 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0262', nombre: "Arroz Largo Fino Poramba (500 g)", set: { stock: false } },
    { id: 'p_1782160090279_m13o', nombre: "Azúcar Negra", set: { stock: false } },
    { id: 'p_imp_1783122342_0098', nombre: "Yerba Mate CBSé Dubái (250 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0101', nombre: "Yerba Mate Don Arregui con Boldo y Poleo", set: { stock: false } },
    { id: 'p_imp_1783122342_0102', nombre: "Yerba Mate Don Arregui con Burrito (500 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0142', nombre: "Bebida Arcor Multifruta (1 L)", set: { stock: false } },
    { id: 'p_imp_1783122342_0143', nombre: "Bebida Arcor Naranja (1 L)", set: { stock: false } },
    { id: 'p_imp_1783122342_0088', nombre: "Naranjú - Caja", set: { stock: false } },
    { id: 'p_imp_1783122342_0322', nombre: "Chupetín Crazy Pop Frutilla", set: { stock: false } },
    { id: 'p_imp_1783122342_0420', nombre: "Georgalos Nucrem", set: { stock: false } },
    { id: 'p_imp_1783122342_0421', nombre: "Gomitas Misky Fantasía", set: { stock: false } },
    { id: 'p_imp_1783122342_0506', nombre: "Maní con Chocolate Namur", set: { stock: false } },
    { id: 'p_imp_1783122342_0488', nombre: "Obleas Maná Chocolate", set: { stock: false } },
    { id: 'p_imp_1783122342_0487', nombre: "Obleas Maná Vainilla", set: { stock: false } },
    { id: 'p_imp_1783122342_0504', nombre: "Palotes Picantes Mogul - Caja", set: { stock: false } },
    { id: 'p_imp_1783122342_0519', nombre: "Papas Clásicas Ronda (55 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0520', nombre: "Papas Clásicas Ronda (95 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0528', nombre: "Postre de Maní Lheritier", set: { stock: false } },
    { id: 'p_imp_1783122342_0092', nombre: "Postre Árabe Caviwa", set: { stock: false } },
    { id: 'p_imp_1783122342_0146', nombre: "Burzot Sello de Oro", set: { stock: false } },
    { id: 'p_imp_1783122342_0558', nombre: "Salchichas Comarca Súper x18", set: { stock: false } },
    { id: 'p_imp_1783122342_0559', nombre: "Salchichas La Comarca x6", set: { stock: false } },
    { id: 'p_imp_1783122342_0463', nombre: "Champiñones Enteros La Banda (400 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0316', nombre: "Choclo Amarillo La Banda (300 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0314', nombre: "Choclo Blanco Cremoso La Banda", set: { stock: false } },
    { id: 'p_imp_1783122342_0368', nombre: "Durazno La Colina (820 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0441', nombre: "Durazno en Mitades Inca (820 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0369', nombre: "Durazno en Mitades Sabio (820 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0409', nombre: "Garbanzos La Banda (350 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0485', nombre: "Lentejas La Banda (350 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0596', nombre: "Tomate Triturado Inca (910 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0335', nombre: "Crema para Cocinar Las Tres Niñas", set: { stock: false } },
    { id: 'p_imp_1783122342_0489', nombre: "Maná Leche", set: { stock: false } },
    { id: 'p_imp_1783122342_0529', nombre: "Postre Suelto", set: { stock: false } },
    { id: 'p_imp_1783122342_0533', nombre: "Pudding de Chocolate", set: { stock: false } },
    { id: 'p_imp_1783122342_0534', nombre: "Pudding de Vainilla", set: { stock: false } },
    { id: 'p_imp_1783122342_0615', nombre: "Yogur Ser con Cereal Probióticos", set: { stock: false } },
    { id: 'p_imp_1783122342_0263', nombre: "Desodorante Axe Bzrp Black (97 g)", set: { stock: false } },
    { id: 'p_imp_1783122342_0507', nombre: "Desodorante Nivea Black & White", set: { stock: false } },
    { id: 'p_imp_1783122342_0508', nombre: "Desodorante Nivea Dry Comfort", set: { stock: false } },
    { id: 'p_imp_1783122342_0509', nombre: "Desodorante Nivea Pearl & Beauty Roll-On", set: { stock: false } },
    { id: 'p_imp_1783122342_0363', nombre: "Jabón Dove Fresh Care Pomelo (150 ml)", set: { stock: false } },
    { id: 'p_imp_1783122342_0330', nombre: "Copos de Maíz Morixe", set: { stock: false } },
    { id: 'p_imp_1783122342_0402', nombre: "Galletitas de Salvado sin Sal Bagley", set: { stock: false } },
    { id: 'p_imp_1783122342_0090', nombre: "Pan Dulce Don Satur sin Fruta", set: { stock: false } },
    { id: 'p_imp_1783122342_0185', nombre: "Pan Lactal Blanco Malu", set: { stock: false } },
    { id: 'p_imp_1783122342_0516', nombre: "Pan Rallado Mama Cocina", set: { stock: false } },
    { id: 'p_imp_1783122342_0184', nombre: "Pan de Miga Santa María", set: { stock: false } },
    { id: 'p_imp_1783122342_0532', nombre: "Prepizza con Tomate x2", set: { stock: false } },
    { id: 'p_imp_1783122342_0598', nombre: "Tostaditas Clásicas Molinos Ala", set: { stock: false } },
    { id: 'p_imp_1783122342_0052', nombre: "Fideos Coditos Sol Pampeano", set: { stock: false } },
    { id: 'p_imp_1783122342_0389', nombre: "Fideos Mostachol 308", set: { stock: false } },
    { id: 'p_imp_1783122342_0173', nombre: "Fideos Mostachol Sol Pampeano", set: { stock: false } },
    { id: 'p_imp_1783122342_0390', nombre: "Fideos Nido N°1 308", set: { stock: false } },
    { id: 'p_imp_1783122342_0053', nombre: "Fideos Tallarín Sol Pampeano", set: { stock: false } },
    { id: 'p_imp_1783122342_0054', nombre: "Fideos Tirabuzón Sol Pampeano", set: { stock: false } },
    { id: 'p_imp_1783122342_0589', nombre: 'Té Crysf (25 saquitos)', set: { stock: false } },
    { id: 'p_imp_1783122342_0338', nombre: "Maní Cropp Chilli Pepper", set: { min: 1070 } },
    { id: 'p_imp_1783122342_0340', nombre: "Maní Cropp Crocante Jamón", set: { min: 1070 } },
    { id: 'p_imp_1783122342_0341', nombre: "Maní Cropp Frito con Sal", set: { min: 839 } },
    { id: 'p_imp_1783122342_0342', nombre: "Maní Cropp Jalapeño", set: { min: 1070 } },
    { id: 'p_imp_1783122342_0343', nombre: "Maní Cropp Parmesano", set: { min: 1070 } },
    { id: 'p_imp_1783122342_0026', nombre: 'Perejil 537 (sobres x5)', set: { min: 2430 } },
    { id: 'p_imp_1783122342_0567', nombre: 'Acondicionador Sedal Restauración (300 ml)', set: { min: 2549 } },
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
    const cur = await cargar(); let camb = 0, warn = 0;
    console.log('%c── AJUSTES ALMACÉN (simulación) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn('NO EXISTE', it.id, it.nombre); warn++; continue; }
      const k = Object.keys(it.set)[0], v = it.set[k];
      const desc = k === 'stock' ? (v === false ? 'SIN STOCK' : 'con stock') : fmt(v);
      console.log(`  ${p.nombre}  →  ${desc}`); camb++;
    }
    console.log(`%c${camb} cambios · ${warn} no existen`, 'font-weight:bold');
    console.log('%cAplicar:  await ajustesAlmacen.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = LISTA.filter(it => existe.has(it.id));
    console.log('Aplicando ' + validos.length + ' ajustes (sin confirm)...');
    for (let i = 0; i < validos.length; i += 400) {
      const batch = writeBatch(db);
      validos.slice(i, i + 400).forEach(it => batch.set(doc(db, 'productos', it.id), it.set, { merge: true }));
      await batch.commit();
    }
    console.log('%c✅ ' + validos.length + ' aplicados. Regenerando snapshot...', 'color:#2d7a4f;font-weight:bold');
    const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fresco = await getDocs(collection(db, 'productos'));
    const arr = [];
    fresco.forEach(d => { const p = d.data(), o = { id: d.id };
      SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; }); arr.push(o); });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Listo. Snapshot regenerado: ' + arr.length + ' productos.', 'color:#2d7a4f;font-weight:bold');
  }
  window.ajustesAlmacen = { simular, aplicar, LISTA };
  console.log('%cajustesAlmacen cargado (' + LISTA.length + ' ajustes).', 'font-weight:bold', '→ await ajustesAlmacen.simular()');
  simular();
})();
