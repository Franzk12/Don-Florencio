/* ============================================================================
   LIMPIAR OFERTAS VIEJAS (personalizadas)  —  Santa María
   ----------------------------------------------------------------------------
   Retiramos el sistema de "ofertas personalizadas" (colección `ofertas`) y
   dejamos SOLO las ofertas por producto (editor: Precio de oferta + toggle).
   Este script borra las ofertas personalizadas cargadas y limpia el flag
   enOferta que ese flujo había dejado en los productos vinculados.

   USO (admin en vivo, sesión iniciada, escudo Brave abajo + Ctrl+Shift+R):
     await limpiarOfertas.aplicar();
   Parche liviano de snapshot (getDoc config -> patch -> setDoc), sin getDocs.
   ============================================================================ */
(function () {
  const PRODS = ['f2272','q1278','q129','f1117','f1127']; // productos vinculados a las ofertas viejas
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), f };
  }
  async function aplicar() {
    const { db, f } = await fb();
    const { getDocs, collection, deleteDoc, doc, setDoc, getDoc } = f;
    // 1) borrar todas las ofertas personalizadas de la colección
    const snap = await getDocs(collection(db, 'ofertas'));
    let borradas = 0;
    for (const d of snap.docs) { await deleteDoc(d.ref); borradas++; }
    // 2) limpiar el flag enOferta (y el precioOferta basura) en los productos vinculados
    for (const id of PRODS) {
      await setDoc(doc(db, 'productos', id), { enOferta: false, precioOferta: 0 }, { merge: true });
    }
    // 3) parche liviano del snapshot
    const s = await getDoc(doc(db, 'config', 'catalogo'));
    const arr = JSON.parse(s.data().productos); let n = 0;
    arr.forEach(p => { if (PRODS.includes(p.id)) { p.enOferta = false; p.precioOferta = 0; n++; } });
    await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
    console.log('%c OK ' + borradas + ' ofertas viejas borradas + ' + n + ' productos limpiados. El carrusel ahora usa solo las ofertas por producto.', 'color:#2d7a4f;font-weight:bold');
  }
  window.limpiarOfertas = { aplicar, PRODS };
  console.log('%climpiarOfertas cargado.', 'font-weight:bold', '-> await limpiarOfertas.aplicar()');
})();
