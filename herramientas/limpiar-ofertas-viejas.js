/* ============================================================================
   LIMPIAR OFERTAS PERSONALIZADAS VIEJAS  —  Santa María
   ----------------------------------------------------------------------------
   Modelo nuevo: el precio de oferta se pone en el editor del producto, y en la
   pestaña "🔥 Ofertas" del admin prendés/apagás cuáles se muestran (interruptor).
   Este script borra las ofertas "personalizadas" viejas (colección `ofertas`,
   ya no se usan) y limpia un precio de oferta basura (Paleta San Diego = $5).
   Los 8 descuentos reales precargados QUEDAN como candidatos: aparecen en el
   panel apagados para que prendas los que quieras.

   USO (admin en vivo, sesión iniciada, escudo Brave abajo + Ctrl+Shift+R):
     await limpiarOfertas.aplicar();
   ============================================================================ */
(function () {
  const BASURA = ['f1127']; // Paleta San Diego: precioOferta=5 (error)
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  async function aplicar() {
    const { db, f } = await fb();
    const { getDocs, collection, deleteDoc, doc, setDoc, getDoc } = f;
    // 1) borrar las ofertas personalizadas viejas
    const snap = await getDocs(collection(db, 'ofertas'));
    let borradas = 0;
    for (const d of snap.docs) { await deleteDoc(d.ref); borradas++; }
    // 2) limpiar precios de oferta basura + apagar
    for (const id of BASURA) {
      await setDoc(doc(db, 'productos', id), { precioOferta: 0, enOferta: false }, { merge: true });
    }
    // 3) parche liviano del snapshot
    const s = await getDoc(doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos);
    arr.forEach(p => { if (BASURA.includes(p.id)) { p.precioOferta = 0; p.enOferta = false; } });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c OK ' + borradas + ' ofertas viejas borradas + basura limpiada. Andá a la pestaña 🔥 Ofertas y prendé las que quieras.', 'color:#2d7a4f;font-weight:bold');
  }
  window.limpiarOfertas = { aplicar };
  console.log('%climpiarOfertas cargado.', 'font-weight:bold', '-> await limpiarOfertas.aplicar()');
})();
