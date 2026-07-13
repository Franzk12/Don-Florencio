/* ============================================================================
   QUITAR FOTOS EQUIVOCADAS  —  Santa María Distribuidora
   ----------------------------------------------------------------------------
   Saca la foto (fotoUrl + tieneFoto) de los productos listados abajo — los
   que la revisión detectó con foto de OTRO producto/marca/sabor. El producto
   queda "sin foto" (ícono 📷) hasta que se le cargue la correcta.

   CÓMO USARLO:
   - Abrí admin.html en el navegador e INICIÁ SESIÓN como admin.
   - Si NO querés sacar alguna, borrá su línea de la LISTA antes de pegar.
   - Consola (F12) → pegá TODO este archivo → Enter. Luego:
       quitarFotos.lista();       // muestra qué se va a sacar (no escribe nada)
       await quitarFotos.aplicar();  // saca las fotos (pide confirmación)
   ============================================================================ */
(function () {
  const LISTA = [
    { id: 'f174',                   nombre: 'Jamón Cocido El Madrileño',        motivo: 'la foto es un pack Cagnoli de Tandil' },
    { id: 'f195',                   nombre: 'Paleta Especial Bierzo',           motivo: 'la foto es el pack rojo Grassetto' },
    { id: 'f250',                   nombre: 'Panceta Salada Calchaquí',         motivo: 'la foto es la panceta AHUMADA' },
    { id: 'p_imp_1783122342_0393',  nombre: 'Flan Ravana Dulce de Leche',       motivo: 'la foto es un flan Exquisita' },
    { id: 'p_imp_1783122342_0394',  nombre: 'Flan Ravana Vainilla',             motivo: 'la foto es un flan Royal' },
    { id: 'p_imp_1783122342_0614',  nombre: 'Yogur con Cereal Light Tregar',    motivo: 'la foto es un Milkaut' },
    { id: 'p_imp_1783122342_0615',  nombre: 'Yogur Ser con Cereal Probióticos', motivo: 'la foto es un Milkaut (duplicada)' },
    { id: 'p_imp_1783122342_0195',  nombre: 'Yogur Bebible Tregar Arándanos',   motivo: 'la foto es el bebible vainilla' },
    { id: 'p_imp_1783122342_0616',  nombre: 'Yogur Tregar Durazno',             motivo: 'la foto es el natural sin azúcar' },
    { id: 'q133',                   nombre: 'Queso de Barra Punta del Agua',    motivo: 'la foto parece el Cremoso PdA' },
    { id: 'q138',                   nombre: 'Queso Cremoso La Internacional',   motivo: 'la foto es el pack TYBO' },
    { id: 'q155',                   nombre: 'Muzzarella Plancha Silvia',        motivo: 'la foto es el cilindro' },
    { id: 'q56',                    nombre: 'Provoleta Nonna Pia',              motivo: 'horma sin marca, posible cruce con Queso de Campo' },
    { id: 'q72',                    nombre: 'Queso de Campo',                   motivo: 'la foto tiene etiqueta Nonna Pia, posible cruce' },
  ];

  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }

  const api = {
    lista() {
      console.log('%c===== SE VA A SACAR LA FOTO DE (' + LISTA.length + ') =====', 'font-weight:bold');
      LISTA.forEach(x => console.log(`   ${x.nombre} [${x.id}] — ${x.motivo}`));
      console.log('\nSi está OK →  await quitarFotos.aplicar()');
    },

    async aplicar() {
      if (!confirm(`Se va a QUITAR la foto de ${LISTA.length} productos (quedan "sin foto").\n\n¿Aplicar ahora?`)) {
        console.log('Cancelado.'); return;
      }
      const { db, fsMod } = await fb();
      const { writeBatch, doc } = fsMod;
      const batch = writeBatch(db);
      LISTA.forEach(x => batch.set(doc(db, 'productos', x.id), { fotoUrl: '', tieneFoto: false }, { merge: true }));
      await batch.commit();
      console.log(`✅ Listo: ${LISTA.length} fotos quitadas. Esos productos ahora aparecen sin foto (📷).`);
    }
  };

  window.quitarFotos = api;
  console.log('%cquitarFotos cargado.', 'color:green;font-weight:bold');
  api.lista();
})();
