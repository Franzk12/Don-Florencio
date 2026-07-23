/* ============================================================================
   QUITAR FOTOS EQUIVOCADAS  —  Santa María Distribuidora
   ----------------------------------------------------------------------------
   Barrido completo del catálogo (14 categorías, 936 fotos revisadas una por
   una contra el nombre del producto). Esta lista saca la foto (fotoUrl +
   tieneFoto) de los productos cuya foto muestra OTRA marca/variante.
   El producto queda "sin foto" (📷) hasta cargarle la correcta.

   El script busca cada producto POR NOMBRE EXACTO en la base al momento de
   correr — no hace falta tocar IDs. Si algún nombre no matchea, lo lista y
   sigue con el resto.

   CÓMO USARLO:
   - Abrí admin.html en el navegador e INICIÁ SESIÓN como admin.
   - Si alguna foto NO querés sacarla, borrá su línea de la LISTA.
   - Consola (F12) → pegá TODO este archivo → Enter (muestra el plan solo).
       await quitarFotos.aplicar();   // saca las fotos (pide confirmación)
   ============================================================================ */
(function () {
  const LISTA = [
    // ── Fiambres / Embutidos / Lácteos / Quesos (revisión anterior) ──
    { nombre: 'Jamón Cocido El Madrileño',        motivo: 'la foto es un pack Cagnoli de Tandil' },
    { nombre: 'Paleta Especial Bierzo',           motivo: 'la foto es el pack rojo Grassetto' },
    { nombre: 'Panceta Salada Calchaquí',         motivo: 'la foto es la panceta AHUMADA' },
    { nombre: 'Flan Ravana Dulce de Leche',       motivo: 'la foto es un flan Exquisita' },
    { nombre: 'Flan Ravana Vainilla',             motivo: 'la foto es un flan Royal' },
    { nombre: 'Yogur con Cereal Light Tregar',    motivo: 'la foto es un Milkaut' },
    { nombre: 'Yogur Ser con Cereal Probióticos', motivo: 'la foto es un Milkaut (duplicada)' },
    { nombre: 'Yogur Bebible Tregar Arándanos',   motivo: 'la foto es el bebible vainilla' },
    { nombre: 'Yogur Tregar Durazno',             motivo: 'la foto es el natural sin azúcar' },
    { nombre: 'Queso de Barra Punta del Agua',    motivo: 'la foto parece el Cremoso PdA' },
    { nombre: 'Queso Cremoso La Internacional',   motivo: 'la foto es el pack TYBO' },
    { nombre: 'Muzzarella Plancha Silvia',        motivo: 'la foto es el cilindro' },
    { nombre: 'Provoleta Nonna Pia',              motivo: 'posible cruce con Queso de Campo' },
    { nombre: 'Queso de Campo',                   motivo: 'la foto tiene etiqueta Nonna Pia' },
    // ── Pastas ──
    { nombre: 'Fideos Ave María Lucchetti',       motivo: 'la foto es arroz Lucchetti Parboil' },
    { nombre: 'Fideos Letritas Lucchetti',        motivo: 'la foto es el paquete de Coditos' },
    { nombre: 'Fideos Municiones Lucchetti',      motivo: 'la foto es el paquete de Coditos' },
    { nombre: 'Fideos Mostachol 308',             motivo: 'la foto es Matarazzo Proteína Plus' },
    { nombre: 'Ravioles de 4 Quesos El Sol',      motivo: 'la foto es un pack Villa D\'Agri' },
    { nombre: 'Ravioles de Pollo y Verdura La Italiana', motivo: 'la foto es un pack Mendía' },
    { nombre: 'Tapas de Copetín Delitap',         motivo: 'la foto es un pack Mendía' },
    { nombre: 'Tapas para Pascualina Delitap',    motivo: 'la foto es un pack Mendía' },
    { nombre: 'Tapas para Pascualina El Sol',     motivo: 'la foto es un pack Mendía (duplicada)' },
    { nombre: 'Tapas para Pascualina La Santiagueña', motivo: 'la foto es un pack La Salteña' },
    // ── Panadería ──
    { nombre: 'Bizcochuelo Ravana Chocolate',     motivo: 'la foto es una bolsa genérica' },
    { nombre: 'Bizcochuelo Ravana Naranja',       motivo: 'la foto es un Exquisita' },
    { nombre: 'Bizcochuelo Ravana Vainilla',      motivo: 'la foto es de otra marca (Morixe)' },
    { nombre: 'Copos de Maíz Morixe',             motivo: 'la foto es harina para arepas Morixe' },
    { nombre: 'Crackers de Arroz Molinos Ala',    motivo: 'la foto es arroz integral Molinos Ala' },
    { nombre: 'Pan Lactal Blanco Malu',           motivo: 'la foto es marca Lactal' },
    { nombre: 'Pan Lactal Blanco Remanso',        motivo: 'la foto es marca Lactal (duplicada)' },
    { nombre: 'Pan Lactal Salvado Remanso',       motivo: 'la foto es marca Lactal' },
    { nombre: 'Pan Lactal Salvado Tío Guis',      motivo: 'la foto es marca Lactal (duplicada)' },
    // ── Almacén ──
    { nombre: 'Arroz Rojo Carogran (500 g)',      motivo: 'la foto es una caja Riso Scotti' },
    { nombre: 'Crema Frutilla Ledevit',           motivo: 'la foto son golosinas Vidal Rellenolas' },
    { nombre: 'Sopa Quick Choclo',                motivo: 'la foto es una sopa Maggi' },
    { nombre: 'Sopa Quick de Vegetales',          motivo: 'la foto es una bolsa de verduras congeladas' },
    { nombre: 'Yerba Mate La Cumbrecita (1 kg)',  motivo: 'la foto es yerba La Merced' },
    { nombre: 'Yerba Mate La Cumbrecita (500 g)', motivo: 'la foto es yerba La Merced' },
    { nombre: 'Azúcar Ledesma Clásica (1 kg)',    motivo: 'la foto es la Ledesma LIGHT' },
    { nombre: 'Azúcar Ledesma - Pack x10',        motivo: 'la foto es la Ledesma LIGHT' },
    // ── Conservas ──
    { nombre: 'Aceitunas Descarozadas Tres Reyes Doypack (70 g)', motivo: 'la foto es un doypack Vanoli' },
    { nombre: 'Aceitunas Verdes Tres Reyes Doypack (90 g)',       motivo: 'la foto es un doypack Vanoli' },
    { nombre: 'Choclo Amarillo Cremoso La Banda (350 g)', motivo: 'la foto es lata La Campagnola' },
    { nombre: 'Choclo Amarillo Cremoso La Banda (800 g)', motivo: 'la foto es lata La Campagnola' },
    { nombre: 'Choclo Blanco Cremoso La Banda',   motivo: 'la foto es lata La Campagnola' },
    { nombre: 'Choclo Amarillo Entero La Banda (800 g)', motivo: 'la foto es lata Arcor' },
    { nombre: 'Choclo Amarillo Inca (300 g)',     motivo: 'la foto es lata Arcor' },
    { nombre: 'Coctel de Frutas Cumaná (820 g)',  motivo: 'la foto es lata Alco' },
    { nombre: 'Durazno en Mitades Cumaná (3 kg)', motivo: 'la foto es lata Zummun' },
    { nombre: 'Durazno en Mitades Cumaná (820 g)', motivo: 'la foto es lata Zummun' },
    { nombre: 'Durazno en Mitades Inca (820 g)',  motivo: 'la foto es lata Zummun' },
    { nombre: 'Durazno en Mitades Sabio (820 g)', motivo: 'la foto es lata Zummun' },
    { nombre: 'Lomitos de Atún en Aceite Cumaná (170 g)', motivo: 'la foto es lata La Campagnola' },
    { nombre: 'Poroto de Soja Elio (500 g)',      motivo: 'la foto es bolsa Egran' },
    { nombre: 'Porotos Alubia Elio (500 g)',      motivo: 'la foto es lata Inalpa' },
    { nombre: 'Porotos Negros Elio (500 g)',      motivo: 'la foto es bolsa Egran' },
    { nombre: 'Puré de Tomate Inca (530 g)',      motivo: 'la foto es una botella de otra marca' },
    { nombre: 'Tomate Triturado Inca (910 g)',    motivo: 'la foto es doypack Don Triturado' },
    // ── Dulces ──
    { nombre: 'Caramelos masticables Misky',      motivo: 'la foto es un pack Mogul Masti' },
    { nombre: 'Garrapiñadas de Maní Caviwa',      motivo: 'la foto es Bonafide (duplicada)' },
    { nombre: 'Gelatina Ravana Cereza',           motivo: 'la foto es Exquisita' },
    { nombre: 'Gelatina Ravana Durazno',          motivo: 'la foto es de otra marca (Godet)' },
    { nombre: 'Gelatina Ravana Frambuesa',        motivo: 'la foto es Exquisita' },
    { nombre: 'Gelatina Ravana Frutilla',         motivo: 'la foto es de otra marca' },
    { nombre: 'Gelatina Ravana Naranja',          motivo: 'la foto es Exquisita' },
    { nombre: 'Maní con Chocolate Namur',         motivo: 'la foto es una barra Shot' },
    // ── Aderezos ──
    { nombre: 'Salsa Barbacoa Benidorm',          motivo: 'la foto es Hellmann\'s (duplicada)' },
    { nombre: 'Salsa Boloñesa Knorr (340 g)',     motivo: 'la foto es la salsa Filetto' },
    { nombre: 'Salsa de Ají Picante 537 (330 g)', motivo: 'la foto es un Tabasco' },
    { nombre: 'Salsa de Soja 537 (330 g)',        motivo: 'la foto es un Kikkoman' },
    { nombre: 'Tomate Triturado Cayfar (950 g)',  motivo: 'la foto es doypack Don Triturado' },
    { nombre: 'Tomate Triturado Dulcor (1 L)',    motivo: 'la foto es doypack Don Triturado' },
    { nombre: 'Tomate Triturado Dulcor (1 L) - Pack', motivo: 'la foto es doypack Don Triturado' },
    // ── Bebidas ──
    { nombre: 'Jugo Baggio sin Azúcar Durazno (1 L)', motivo: 'la foto es una lata Monster' },
    { nombre: 'Jugo Baggio sin Azúcar Naranja (1 L)', motivo: 'la foto es una Fanta Zero' },
    { nombre: 'Café La Virginia en Saquitos',     motivo: 'la foto es té de Tilo La Virginia' },
    { nombre: 'Café Nory en Saquitos',            motivo: 'la foto es Bonafide Sensaciones' },
    { nombre: 'Vermouth Cinzano Rosso (1 L)',     motivo: 'la foto es un vermut Desconfiado' },
    { nombre: 'Jugo Clight Pera',                 motivo: 'la foto es el sobre de Ananá' },
    { nombre: 'Jugo Rinde 2 Naranja y Mango',     motivo: 'la foto es una botella Bless' },
    { nombre: 'Jugo Tang Ananá',                  motivo: 'la foto es el sobre Galáctico' },
    { nombre: 'Jugo Tang Limonada',               motivo: 'la foto es el sobre Galáctico' },
    { nombre: 'Jugo Tang Pera',                   motivo: 'la foto es el sobre Galáctico' },
    { nombre: 'Jugo Tang Uva',                    motivo: 'la foto es el sobre Galáctico' },
    // ── Limpieza ──
    { nombre: 'Jabón Dove Fresh Care Pomelo (150 ml)', motivo: 'la foto es un desodorante Dove Men' },
  ];

  const norm = s => (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }

  const api = {
    lista() {
      console.log('%c===== FOTOS A QUITAR (' + LISTA.length + ') =====', 'font-weight:bold');
      LISTA.forEach(x => console.log(`   ${x.nombre} — ${x.motivo}`));
      console.log('\nSi está OK →  await quitarFotos.aplicar()');
    },

    async aplicar() {
      const { db, fsMod } = await fb();
      const { getDocs, collection, writeBatch, doc } = fsMod;
      console.log('Buscando productos por nombre...');
      const snap = await getDocs(collection(db, 'productos'));
      const porNombre = new Map();
      snap.forEach(d => porNombre.set(norm(d.data().nombre), { id: d.id, tieneFoto: !!d.data().tieneFoto }));

      const resueltos = [], sinMatch = [], yaSinFoto = [];
      for (const x of LISTA) {
        const hit = porNombre.get(norm(x.nombre));
        if (!hit) { sinMatch.push(x.nombre); continue; }
        if (!hit.tieneFoto) { yaSinFoto.push(x.nombre); continue; }
        resueltos.push({ ...x, id: hit.id });
      }
      console.log(`Para quitar: ${resueltos.length} · ya sin foto: ${yaSinFoto.length} · sin match: ${sinMatch.length}`);
      if (sinMatch.length) { console.log('⚠️ Sin match (revisar nombre):'); sinMatch.forEach(n => console.log('   ' + n)); }

      if (!resueltos.length) { console.log('Nada para hacer.'); return; }
      if (!confirm(`Se va a QUITAR la foto de ${resueltos.length} productos (quedan "sin foto").\n\n¿Aplicar ahora?`)) {
        console.log('Cancelado.'); return;
      }
      for (let i = 0; i < resueltos.length; i += 400) {
        const batch = writeBatch(db);
        resueltos.slice(i, i + 400).forEach(x => batch.set(doc(db, 'productos', x.id), { fotoUrl: '', tieneFoto: false }, { merge: true }));
        await batch.commit();
        console.log(`   ...${Math.min(i + 400, resueltos.length)}/${resueltos.length}`);
      }
      console.log(`✅ Listo: ${resueltos.length} fotos quitadas.`);
    }
  };

  window.quitarFotos = api;
  console.log('%cquitarFotos cargado (barrido completo del catálogo).', 'color:green;font-weight:bold');
  api.lista();
})();
