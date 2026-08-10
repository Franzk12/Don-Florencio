/* ============================================================================
   LIMPIAR TODAS LAS OFERTAS (arrancar de cero)  —  Santa María
   ----------------------------------------------------------------------------
   Modelo nuevo y simple: el `precioOferta` es lo único que manda. Si un
   producto tiene precio de oferta > 0, aparece en "Ofertas destacadas" con el
   precio de lista tachado + el de oferta. Sin toggle.
   Este script deja el carrusel VACÍO: borra las ofertas personalizadas viejas
   y limpia el precioOferta/enOferta de TODOS los productos que lo tengan
   (las 5 custom + los 8 precargados). Después la dueña carga las que quiera
   desde el editor (Precio de oferta más bajo que el de lista).

   USO (admin en vivo, sesión iniciada, escudo Brave abajo + Ctrl+Shift+R):
     await limpiarOfertas.aplicar();
   Parche liviano de snapshot (getDoc config -> patch -> setDoc), sin getDocs.
   ============================================================================ */
(function () {
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  async function aplicar() {
    const { db, f } = await fb();
    const { getDocs, collection, deleteDoc, doc, setDoc, getDoc } = f;
    // 1) borrar todas las ofertas personalizadas (colección vieja)
    const snap = await getDocs(collection(db, 'ofertas'));
    let borradas = 0;
    for (const d of snap.docs) { await deleteDoc(d.ref); borradas++; }
    // 2) buscar en el snapshot los productos con precioOferta o enOferta y limpiarlos
    const s = await getDoc(doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos);
    const ids = arr.filter(p => (Number(p.precioOferta) > 0) || p.enOferta).map(p => p.id);
    for (const id of ids) {
      await setDoc(doc(db, 'productos', id), { precioOferta: 0, enOferta: false }, { merge: true });
    }
    // 3) parche liviano del snapshot
    let n = 0;
    arr.forEach(p => { if ((Number(p.precioOferta) > 0) || p.enOferta) { p.precioOferta = 0; p.enOferta = false; n++; } });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c OK ' + borradas + ' ofertas viejas borradas + ' + n + ' productos limpiados. El carrusel arranca vacío. Cargá ofertas desde el editor (Precio de oferta).', 'color:#2d7a4f;font-weight:bold');
  }
  window.limpiarOfertas = { aplicar };
  console.log('%climpiarOfertas cargado.', 'font-weight:bold', '-> await limpiarOfertas.aplicar()');
})();
