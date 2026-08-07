/* ============================================================================
   CARGAR AUMENTOS — precios más altos escondidos en la lista OFERTA  —  Santa María
   ----------------------------------------------------------------------------
   Al revisar los precios (07/08) se detectó que ~44 productos que la dueña
   marcó "OFERTA" en realidad figuran MÁS CAROS que lo cargado: no son ofertas,
   son precios NUEVOS (aumentos) que no se habían aplicado -> los teníamos baratos.
   Este script sube el `min` de los 38 aumentos SANOS (+2% a +45%, match claro).
   FUERA: Aceite Bonoleo (typo +1006%) y 5 saltos grandes/ambiguos (yerbas +78/99%,
   Provolone Silvia +56%, Pategras Tregar +41% colisión) -> confirmar con la dueña.

   USO (admin en vivo, sesión iniciada, escudo Brave abajo + Ctrl+Shift+R):
     await aumentos.aplicar();
   Parche liviano de snapshot (getDoc config -> patch -> setDoc), sin getDocs.
   ============================================================================ */
(function () {
  const LISTA = [
    { id: 'p_imp_1783122342_0047', nombre: 'Alfajores Guaymallén - Caja', antes: 11519, min: 11900 },
    { id: 'p_imp_1783122342_0048', nombre: 'Bizcochuelo Ravana Chocolate', antes: 2570, min: 2670 },
    { id: 'p_imp_1783122342_0049', nombre: 'Bizcochuelo Ravana Vainilla', antes: 1750, min: 1870 },
    { id: 'p_imp_1783122342_0050', nombre: 'Cerveza 361 (1 L) - Pack', antes: 8729, min: 8999 },
    { id: 'p_1780333401808_gu7v', nombre: 'Danette Dulce de Leche x2', antes: 4050, min: 4530 },
    { id: 'p_imp_1783122342_0160', nombre: 'Fideos Ave María Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0161', nombre: 'Fideos Cabello de Ángel Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0162', nombre: 'Fideos Coditos Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0163', nombre: 'Fideos Dedalito Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0157', nombre: 'Fideos Mostachol Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0169', nombre: 'Fideos Mostachol Matarazzo', antes: 1399, min: 1455 },
    { id: 'p_imp_1783122342_0165', nombre: 'Fideos Municiones Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0166', nombre: 'Fideos Spaghetti Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0170', nombre: 'Fideos Spaghetti Matarazzo', antes: 1399, min: 1455 },
    { id: 'p_imp_1783122342_0171', nombre: 'Fideos Tallarín Matarazzo', antes: 1399, min: 1455 },
    { id: 'p_imp_1783122342_0167', nombre: 'Fideos Tirabuzón Lucchetti', antes: 1199, min: 1375 },
    { id: 'p_imp_1783122342_0172', nombre: 'Fideos Tirabuzón Matarazzo', antes: 1399, min: 1455 },
    { id: 'p_imp_1783122342_0177', nombre: 'Harina Leudante Blancaflor (1 kg)', antes: 1749, min: 1959 },
    { id: 'f177', nombre: 'Jamón Cocido Bierzo', antes: 10230, min: 10750 },
    { id: 'f2272', nombre: 'Jamón Cocido Cosenza', antes: 5895, min: 6200 },
    { id: 'f1894', nombre: 'Jamón Cocido Don Antonino', antes: 5939, min: 6240 },
    { id: 'f1659', nombre: 'Jamón Cocido Sello de Plata', antes: 9240, min: 9675 },
    { id: 'p_imp_1783122342_0179', nombre: 'Leche Descremada Armonía N°1', antes: 1870, min: 1999 },
    { id: 'p_imp_1783122342_0087', nombre: 'Levadura Orali (500 g)', antes: 3129, min: 3320 },
    { id: 'p_imp_1783122342_0180', nombre: 'Miel Pura Santa María (1 kg)', antes: 5999, min: 6999 },
    { id: 'p_imp_1783122342_0182', nombre: 'Miel Pura Santa María (500 g)', antes: 3199, min: 3999 },
    { id: 'f2802', nombre: 'Mortadela Sello de Plata', antes: 5635, min: 5899 },
    { id: 'f195', nombre: 'Paleta Especial Bierzo', antes: 9550, min: 9999 },
    { id: 'f204', nombre: 'Paleta Sandwichera Bierzo', antes: 5250, min: 5665 },
    { id: 'p_imp_1783122342_0518', nombre: 'Papas Fritas Cheddar Chil (250 g)', antes: 3379, min: 3780 },
    { id: 'f143', nombre: 'Queso Azul Silvia', antes: 21279, min: 21919 },
    { id: 'p_imp_1783122342_0189', nombre: 'Ravioles de Pollo Orali', antes: 1699, min: 2000 },
    { id: 'f227', nombre: 'Salame Sello de Plata', antes: 13560, min: 14299 },
    { id: 'f2926', nombre: 'Salamines 42 Los Calvos', antes: 19799, min: 23139 },
    { id: 'f2554', nombre: 'Salchichón Sello de Plata', antes: 5479, min: 5760 },
    { id: 'p_imp_1783122342_0094', nombre: 'Salsa Lista para Pizza Knorr (340 g)', antes: 980, min: 1200 },
    { id: 'p_imp_1783122342_0108', nombre: 'Yerba Mate Cruz de Malta (500 g)', antes: 1835, min: 2549 },
    { id: 'p_imp_1783122342_0045', nombre: 'Yogur Firme Frutilla Light La Serenísima', antes: 1965, min: 2225 },
  ];
  const fmt = n => '$' + Number(n||0).toLocaleString('es-AR');
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  async function actuales() {
    const { db, f } = await fb();
    const s = await f.getDoc(f.doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos); const m = {}; arr.forEach(p => m[p.id] = p.min); return m;
  }
  async function simular() {
    const cur = await actuales();
    console.log('%c-- CARGAR AUMENTOS (simulacion) --', 'font-weight:bold');
    let cambian = 0, iguales = 0;
    for (const it of LISTA) {
      const hoy = cur[it.id];
      if (hoy === it.min) { iguales++; continue; }
      const d = hoy ? ((it.min-hoy)/hoy*100).toFixed(0) : '?';
      console.log('  ' + it.nombre + '  ' + fmt(hoy) + ' -> ' + fmt(it.min) + ' (+' + d + '%)'); cambian++;
    }
    console.log('%c' + cambian + ' a subir, ' + iguales + ' ya iguales.  aplicar: await aumentos.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }
  async function aplicar() {
    const { db, f } = await fb(); const { doc, writeBatch, getDoc, setDoc } = f;
    const batch = writeBatch(db);
    LISTA.forEach(it => batch.set(doc(db,'productos',it.id), { min: it.min }, { merge:true }));
    await batch.commit();
    const nuevo = {}; LISTA.forEach(it => nuevo[it.id] = it.min);
    const s = await getDoc(doc(db,'config','catalogo'));
    const arr = JSON.parse(s.data().productos); let n = 0;
    arr.forEach(p => { if (p.id in nuevo && p.min !== nuevo[p.id]) { p.min = nuevo[p.id]; n++; } });
    await setDoc(doc(db,'config','catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c OK ' + LISTA.length + ' aumentos aplicados (snapshot: ' + n + ').', 'color:#2d7a4f;font-weight:bold');
  }
  window.aumentos = { simular, aplicar, LISTA };
  console.log('%caumentos cargado (' + LISTA.length + ' aumentos sanos).', 'font-weight:bold', '-> await aumentos.simular()');
  simular();
})();
