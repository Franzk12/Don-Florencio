/* ============================================================================
   CARGAR PRECIOS — ciclo AGOSTO 2026  —  Santa María
   ----------------------------------------------------------------------------
   Actualiza el `min` (precio de lista) de 35 productos de Almacén/Quesos que la
   dueña subió en ALMACEN.xlsx / QUESOS.xlsx (06/08) y que matchearon claro con
   un cambio de precio real. FIAMBRES no cambió ningún precio (solo ofertas).
   Composición: 28 originales + 2 recuperados (Cappuccino/Té Boldo La Virginia)
   + 3 Punta del Agua (cod↔q-id verificado: q154/q133/q141)
   + 2 correcciones de typos de catálogo (Puré Del Valle, Dulce de Batata).
   Si ya corriste una tanda, al re-correr solo cambian los nuevos (el resto igual).

   NO incluye: OFERTA/EFECTIVO (231, decide la dueña), "a verificar" (132) ni el
   Papel Higiénico Elegante (baja rara, quedó a verificar). Roquefort Emperador
   se actualiza SOLO en `min` (su `efectivo` queda intacto).

   CÓMO USARLO:
   - admin.html EN VIVO, con sesión iniciada. Escudo de Brave ABAJO + Ctrl+Shift+R.
   - Consola (F12) → pegá TODO → Enter (muestra el plan, no escribe).
       await preciosAgo.aplicar();
   - Regenera el snapshot con PARCHE LIVIANO (getDoc config → parchear → setDoc).
     NO usa getDocs de toda la colección (con ~900 fotos base64 se cuelga).
   ============================================================================ */
(function () {
  const LISTA = [
    { id: 'p_imp_1783122342_0213', nombre: 'Alfajores Guaymallén x5', antes: 1559, min: 1620 },
    { id: 'p_imp_1783122342_0257', nombre: 'Arroz Dos Hermanos (500 g)', antes: 775, min: 829 },
    { id: 'p_imp_1783122342_0279', nombre: 'Cacao Nesquik (180 g)', antes: 1889, min: 2200 },
    { id: 'p_imp_1783122342_0280', nombre: 'Cacao Nesquik (360 g)', antes: 3330, min: 4850 },
    { id: 'p_imp_1783122342_0469', nombre: 'Café Instantáneo La Virginia Clásico (100 g)', antes: 4550, min: 4825 },
    { id: 'p_imp_1783122342_0466', nombre: 'Café Instantáneo La Virginia Clásico (170 g)', antes: 7155, min: 7545 },
    { id: 'p_imp_1783122342_0470', nombre: 'Café Instantáneo La Virginia Clásico (50 g)', antes: 2719, min: 2859 },
    { id: 'p_imp_1783122342_0467', nombre: 'Café Instantáneo La Virginia Selección (170 g)', antes: 11170, min: 11859 },
    { id: 'p_imp_1783122342_0468', nombre: 'Café Instantáneo La Virginia Suave (100 g)', antes: 4550, min: 4825 },
    { id: 'p_imp_1783122342_0471', nombre: 'Café Instantáneo La Virginia Suave (170 g)', antes: 7155, min: 7545 },
    { id: 'p_imp_1783122342_0472', nombre: 'Café Instantáneo La Virginia Suave (50 g)', antes: 2719, min: 2859 },
    { id: 'p_imp_1783122342_0465', nombre: 'Café La Virginia en Saquitos', antes: 4620, min: 4989 },
    { id: 'p_imp_1783122342_0473', nombre: 'Cappuccino La Virginia', antes: 4650, min: 4889 },
    { id: 'p_imp_1783122342_0474', nombre: 'Té de Boldo La Virginia', antes: 1830, min: 1899 },
    { id: 'p_imp_1783122342_0416', nombre: 'Gelatina Ravana Manzana', antes: 849, min: 970 },
    { id: 'p_imp_1783122342_0430', nombre: 'Harina 0000 Pureza (1 kg)', antes: 1099, min: 1235 },
    { id: 'p_imp_1783122342_0359', nombre: 'Palmitos Enteros Cumaná (400 g)', antes: 3689, min: 3839 },
    { id: 'p_imp_1783122342_0544', nombre: 'Roquefort Emperador', antes: 13835, min: 14250 },
    { id: 'p_imp_1783122342_0479', nombre: 'Té La Virginia Fluir', antes: 2059, min: 2125 },
    { id: 'p_imp_1783122342_0480', nombre: 'Té La Virginia Inspirar', antes: 2059, min: 2125 },
    { id: 'p_imp_1783122342_0475', nombre: 'Té de Frutilla La Virginia', antes: 1965, min: 2169 },
    { id: 'p_imp_1783122342_0476', nombre: 'Té de Manzanilla La Virginia', antes: 1465, min: 1895 },
    { id: 'p_imp_1783122342_0592', nombre: 'Té de Manzanilla con Anís La Virginia (25 saquitos)', antes: 1820, min: 1895 },
    { id: 'p_imp_1783122342_0478', nombre: 'Té de Tilo La Virginia', antes: 2935, min: 3049 },
    { id: 'p_imp_1783122342_0616', nombre: 'Yogur Tregar sabor durazno', antes: 1340, min: 1450 },
    { id: 'p_imp_1783122342_0614', nombre: 'Yogur con Cereal Light Tregar', antes: 1480, min: 1539 },
    { id: 'q56', nombre: 'Provoleta Nonna Pia', antes: 24045, min: 25750 },
    { id: 'q152', nombre: 'Queso Pategras Monta', antes: 11699, min: 12350 },
    { id: 'q36', nombre: 'Ricota Silvia (5 kg)', antes: 16975, min: 17499 },
    { id: 'q826', nombre: 'Ricota Silvia (500 g)', antes: 2235, min: 2299 },
    // ── Punta del Agua (cod↔q-id verificado; los EFECT/Light quedan afuera) ──
    { id: 'q154', nombre: 'Queso Por Salut Punta del Agua', antes: 10799, min: 11000 },
    { id: 'q133', nombre: 'Queso de Barra Punta del Agua', antes: 11179, min: 12720 },
    { id: 'q141', nombre: 'Queso Cremoso Punta del Agua', antes: 9750, min: 10800 },
    // ── Correcciones de typos de catálogo (confirmados con la lista de la dueña) ──
    { id: 'p_imp_1783122342_0540', nombre: 'Puré de Tomate Del Valle (520 g) [FIX typo $6084→$608]', antes: 6084, min: 608 },
    { id: 'p_1782160098639_9ium', nombre: 'Dulce de Batata La Campagnola [FIX typo $95→$2939]', antes: 95, min: 2939 },
  ];
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  // lee el snapshot (1 doc) → mapa id→min actual (liviano, no baja la colección)
  async function actuales() {
    const { db, f } = await fb();
    const s = await f.getDoc(f.doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos);
    const m = {}; arr.forEach(p => m[p.id] = p.min);
    return m;
  }
  async function simular() {
    const cur = await actuales();
    console.log('%c── CARGAR PRECIOS AGO (simulación) ──', 'font-weight:bold');
    let cambian = 0, iguales = 0, faltan = 0;
    for (const it of LISTA) {
      if (!(it.id in cur)) { console.warn('❌ NO EXISTE en snapshot', it.id, it.nombre); faltan++; continue; }
      const hoy = cur[it.id];
      if (hoy === it.min) { iguales++; continue; }
      const dif = hoy ? ((it.min - hoy) / hoy * 100).toFixed(1) + '%' : '—';
      console.log(`✏️ ${it.nombre}   ${fmt(hoy)} → ${fmt(it.min)}  (${dif})`);
      cambian++;
    }
    console.log(`%c${cambian} a cambiar · ${iguales} ya iguales · ${faltan} no existen`, 'font-weight:bold');
    console.log('%cPara aplicar:  await preciosAgo.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, f } = await fb();
    const { doc, setDoc, getDoc, writeBatch } = f;
    // 1) escribir min en cada doc (merge → no toca fotos ni efectivo)
    const batch = writeBatch(db);
    LISTA.forEach(it => batch.set(doc(db, 'productos', it.id), { min: it.min }, { merge: true }));
    await batch.commit();
    console.log('%c✅ ' + LISTA.length + ' precios escritos. Parcheando snapshot...', 'color:#2d7a4f;font-weight:bold');
    // 2) PARCHE LIVIANO del snapshot: getDoc config → actualizar min → setDoc
    const nuevo = {}; LISTA.forEach(it => nuevo[it.id] = it.min);
    const s = await getDoc(doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos); let n = 0;
    arr.forEach(p => { if (p.id in nuevo && p.min !== nuevo[p.id]) { p.min = nuevo[p.id]; n++; } });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c✅ Snapshot parcheado: ' + n + ' precios actualizados. Listo.', 'color:#2d7a4f;font-weight:bold');
  }
  window.preciosAgo = { simular, aplicar, LISTA };
  console.log('%cpreciosAgo cargado (' + LISTA.length + ' precios).', 'font-weight:bold', '→ await preciosAgo.simular()');
  simular();
})();
