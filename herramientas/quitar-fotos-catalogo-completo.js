/* ============================================================================
   QUITAR FOTOS EQUIVOCADAS — CATALOGO COMPLETO (revision jul-2026 + ronda 2)
   ----------------------------------------------------------------------------
   Barrido visual de las 14 categorias del catalogo (bajando cada foto real
   desde Firestore y comparandola contra el nombre del producto). Esta lista
   saca la foto (fotoUrl + tieneFoto) de los productos cuya foto muestra OTRA
   marca, sabor, formato o tamaño del que dice el nombre. El producto NO se
   renombra ni cambia de categoria — solo queda "sin foto" (📷) hasta cargarle
   la correcta.

   El script busca cada producto POR NOMBRE EXACTO en la base al momento de
   correr — no hace falta tocar IDs. Si algún nombre no matchea, lo lista y
   sigue con el resto.

   CÓMO USARLO:
   - Abrí admin.html en el navegador e INICIÁ SESIÓN como admin.
   - Consola (F12) → pegá TODO este archivo → Enter (muestra el plan solo).
       await quitarFotosCompleto.aplicar();   // saca las fotos (pide confirmación)
   Al terminar REGENERA el snapshot (config/catalogo) solo, así la home muestra
   los productos ya sin foto sin pasos manuales.
   ============================================================================ */
(function () {
  const LISTA = [
    { nombre: 'Aceitunas Descarozadas La Bernal (1,8 kg)', motivo: 'la foto es de: La Toscana' },
    { nombre: 'Aceitunas Descarozadas La Bernal (4 kg)', motivo: 'la foto es de: La Toscana' },
    { nombre: 'Aceitunas en Rodajas La Bernal (1,95 kg)', motivo: 'la foto es de: La Toscana' },
    { nombre: 'Aceitunas en Rodajas La Bernal (4 kg)', motivo: 'la foto es de: La Toscana' },
    { nombre: 'Aceitunas La Bernal N°1 (900 g)', motivo: 'la foto es de: Pote genérico "Pizzería" (sin marca visible)' },
    { nombre: 'Ananá en Rodajas Cumaná (3 kg)', motivo: 'la foto es de: Green Farm' },
    { nombre: 'Ananá en Rodajas Cumaná (836 g)', motivo: 'la foto es de: Green Farm' },
    { nombre: 'Atún al Natural Cumaná (170 g)', motivo: 'la foto es de: Máxima!' },
    { nombre: 'Atún en Aceite y Agua Cumaná (170 g)', motivo: 'la foto es de: Máxima!' },
    { nombre: 'Lomito de Atún en Aceite y Agua Cumaná (1,88 kg)', motivo: 'la foto es de: Máxima!' },
    { nombre: 'Lomito de Atún al Natural Cumaná (1,88 kg)', motivo: 'la foto es de: Cuisine & Co' },
    { nombre: 'Lomitos de Atún al Natural Cumaná (170 g)', motivo: 'la foto es de: Cuisine & Co' },
    { nombre: 'Durazno en Cubos Cumaná (3 kg)', motivo: 'la foto es de: Cuisine & Co (pack individual, no es lata de 3 kg)' },
    { nombre: 'Morrones Enteros Cumaná (185 g)', motivo: 'la foto es de: Caracas' },
    { nombre: 'Sardina en Aceite Cumaná (125 g)', motivo: 'la foto es de: Cumaná Caballa en Aceite (pescado equivocado)' },
    { nombre: 'Maíz Pisingallo Elio (400 g)', motivo: 'la foto es de: Egran' },
    { nombre: 'Semillas de Girasol Elio (250 g)', motivo: 'la foto es de: For Good' },
    { nombre: 'Maíz Pisado Colorado Elio (500 g)', motivo: 'la foto es de: Elio Maíz Pisado Blanco (color equivocado)' },
    { nombre: 'Aceitunas Rellenas', motivo: 'la foto es de: Castell' },
    { nombre: 'Jamón Madrileño', motivo: 'la foto es de: España e Hijos (Jamón Ibérico de Cebo) — sin ninguna referencia a "Madrileño"' },
    { nombre: 'Matambre de Carne Novicer', motivo: 'la foto es de: Dia (marca propia de supermercado)' },
    { nombre: 'Matambre Finca Dorada', motivo: 'la foto es de: Campo Argentino' },
    { nombre: 'Paleta Cocida Madrileño', motivo: 'la foto es de: El Madrileño Jamón Cocido (no es paleta)' },
    { nombre: 'Paleta Cocida San Diego', motivo: 'la foto es de: San Diego Jamón Cocido (no es paleta)' },
    { nombre: 'Jamón Natural Grasetto', motivo: 'la foto es de: Grassetto Jamón Cocido (no es natural)' },
    { nombre: 'Lomo Ahumado con Hierbas', motivo: 'la foto es de: Luvianka — ojo: el paquete dice "Horneado", no "Ahumado"' },
    { nombre: 'Cheddar La Serenísima', motivo: 'la foto es de: Finlandia' },
    { nombre: 'Muzzarella Pastora', motivo: 'la foto es de: Nora Queso Cubicado (marca y formato distintos: cubeteado para pizza, no un cilindro entero)' },
    { nombre: 'Queso Por Salut sin Sal Silvia', motivo: 'la foto es de: La Serenísima Port Salut Sin Sal Light' },
    { nombre: 'Queso Por Salut con Sal Silvia', motivo: 'la foto es de: Silvia, pero el envase dice "Sin sal" — parece cruzada con la foto de abajo' },
    { nombre: 'Panceta Ahumada González', motivo: 'la foto es de: Yayato (otra marca)' },
    { nombre: 'Salamines Leandrin', motivo: 'la foto es de: Es foto de Longaniza a la Calabresa Leandrin (mismo Leandrin, pero longaniza, no salamín)' },
    { nombre: 'Salchichas Comarca Súper x18', motivo: 'la foto es de: Es la misma foto exacta que "Salchichas La Comarca x6" — no muestra el pack de 18' },
    { nombre: 'Panceta Salada González', motivo: 'la foto es de: González, pero el paquete dice "Ahumada", no "Salada"' },
    { nombre: 'Crema para Batir Apóstoles', motivo: 'la foto es de: La Serenísima (foto idéntica, pixel por pixel, a "Crema para Batir La Serenísima")' },
    { nombre: 'Crema para Cocinar Apóstoles', motivo: 'la foto es de: La Paulina' },
    { nombre: 'Leche Chocolatada Silvia', motivo: 'la foto es de: La Serenísima' },
    { nombre: 'Flan Clásico de Vainilla La Serenísima', motivo: 'la foto es de: Flan con Caramelo' },
    { nombre: 'Danette Chocolate y Avellanas', motivo: 'la foto es de: Chocolate & Crema (sin avellanas)' },
    { nombre: 'Leche Larga Vida La Serenísima', motivo: 'la foto es de: Zero Lactosa' },
    { nombre: 'Yogur Natural La Serenísima', motivo: 'la foto es de: Sabor Durazno' },
    { nombre: 'Arroz Dos Hermanos (500 g)', motivo: 'la foto es de: Tostaditas de Arroz horneadas (es un snack, no arroz para cocinar)' },
    { nombre: 'Arroz Largo Fino Poramba (500 g)', motivo: 'la foto es de: Máximo' },
    { nombre: 'Fécula de Mandioca Silvina (900 g)', motivo: 'la foto es de: Dicomere (y el paquete dice 450 g, no 900 g)' },
    { nombre: 'Levadura Seca Instantánea Mi Pan', motivo: 'la foto es de: Mi Pan "mezcla lista para pan, pizza y focaccia" (no es levadura pura)' },
    { nombre: 'Yerba Mate Valle Verde (500 g)', motivo: 'la foto es de: Rei Verde Export' },
    { nombre: 'Arroz Rojo Carogran (500 g)', motivo: 'la foto es de: Arroz Carogran blanco común (Largo Fino), no se ve arroz rojo' },
    { nombre: 'Arroz Molinos Ala No Se Pasa (1 kg)', motivo: 'la foto es de: Integral' },
    { nombre: 'Harina 0000 Pureza (1 kg)', motivo: 'la foto es de: Harina Leudante Pureza — foto idéntica a "Harina Leudante Pureza (1 kg)"' },
    { nombre: 'Edulcorante Hileret Bolsita (250 g)', motivo: 'la foto es de: Botella líquida Hileret Clásico' },
    { nombre: 'Edulcorante Hileret Bolsita (500 g)', motivo: 'la foto es de: Botella líquida Hileret Clásico (misma foto que el de arriba)' },
    { nombre: 'Edulcorante Hileret Individual x50', motivo: 'la foto es de: Botella líquida Hileret Clásico (misma foto que los de arriba)' },
    { nombre: 'Yerba Mate CBSé Dubái (250 g)', motivo: 'la foto es de: Los 4 muestran la misma foto (la de "Tradicional"); Dubái y Picante son sabores con caja propia distinta' },
    { nombre: 'Yerba Mate CBSé Picante (250 g)', motivo: 'la foto es de: Los 4 muestran la misma foto (la de "Tradicional"); Dubái y Picante son sabores con caja propia distinta' },
    { nombre: 'Yerba Mate CBSé (1 kg)', motivo: 'la foto es de: Los 4 muestran la misma foto (la de "Tradicional"); Dubái y Picante son sabores con caja propia distinta' },
    { nombre: 'Yerba Mate CBSé Tradicional (500 g)', motivo: 'la foto es de: Los 4 muestran la misma foto (la de "Tradicional"); Dubái y Picante son sabores con caja propia distinta' },
    { nombre: 'Yerba Mate Rosamonte (500 g)', motivo: 'la foto es de: Foto idéntica — revisar si son dos fichas del mismo producto' },
    { nombre: 'Yerba Mate Rosamonte Suave (500 g)', motivo: 'la foto es de: Foto idéntica — revisar si son dos fichas del mismo producto' },
    { nombre: 'Jugo Rinde 2 Naranja', motivo: 'la foto es de: Verao Naranja (otra marca)' },
    { nombre: 'Jugo Clight Mango y Pera', motivo: 'la foto es de: Naranja Mango' },
    { nombre: 'Jugo Clight Manzana Verde', motivo: 'la foto es de: Manzana Deliciosa (foto idéntica a ese otro producto)' },
    { nombre: 'Jugo Clight Naranja y Durazno', motivo: 'la foto es de: Naranja Mango' },
    { nombre: 'Jugo Clight Pomelo Amarillo', motivo: 'la foto es de: Pomelo Rosado' },
    { nombre: 'Jugo Tang Naranja y Banana', motivo: 'la foto es de: Naranja Mango' },
    { nombre: 'Jugo Tang Naranja y Durazno', motivo: 'la foto es de: Naranja Mango' },
    { nombre: 'Jugo Baggio Durazno y Naranja (1 L)', motivo: 'la foto es de: Baggio Pronto Naranja sola, envase de 200 ml (ni el sabor combinado ni el tamaño)' },
    { nombre: 'Café La Morenita en Saquitos', motivo: 'la foto es de: Frasco de café granulado "Morenita Intenso" (no son sobres)' },
    { nombre: 'Hamburguesas Chacra Nuestra x2', motivo: 'la foto es de: La caja dice "12 Medallones" (660 g), no x2' },
    { nombre: 'Jabón Dove Fresh Care Pomelo (150 ml)', motivo: 'la foto es de: Es un desodorante en aerosol Dove fresh care (no es jabón)' },
    { nombre: 'Jabón Lux Rosas Francesas x3', motivo: 'la foto es de: Jabón LÍQUIDO Lux Botanicals Rosas Francesas, botella individual de 250 ml' },
    { nombre: 'Papel Higiénico Elegante 80 m', motivo: 'la foto es de: Caja de Servilletas Elegante (80 servilletas) — no son rollos' },
    { nombre: 'Pasta Dental Colgate Original (90 g)', motivo: 'la foto es de: Colgate Sensitive Pro Alivio Branqueador Fresh, 110 g' },
    { nombre: 'Detergente Heroe Plus (750 ml)', motivo: 'la foto es de: Foto idéntica para ambos — no puede ser correcta para los dos tamaños/variantes a la vez' },
    { nombre: 'Detergente Heroe Ultra (300 ml)', motivo: 'la foto es de: Foto idéntica para ambos — no puede ser correcta para los dos tamaños/variantes a la vez' },
    { nombre: 'Bolsa Consorcio 60x90 x10', motivo: 'la foto es de: Paquete Mortimer de 20 bolsas ("20 BOLSAS 60x90")' },
    { nombre: 'Bolsa Consorcio 80x100 x10', motivo: 'la foto es de: Es un "Vac-Bag Ordene" — bolsa al vacío para guardar ropa (80x100cm, 1 unidad), no bolsas de residuos' },
    { nombre: 'Bolsa de Papel N°4', motivo: 'la foto es de: Es "Glow Papel Manteca" en rollo (papel manteca, no una bolsa)' },
    { nombre: 'Galletas de Arroz sin Sal Macro', motivo: 'la foto es de: Risky-Dit' },
    { nombre: 'Galletitas Surtido Lía', motivo: 'la foto es de: Bagley Surtido' },
    { nombre: 'Mix Pan Rallado y Rebozador Silvina', motivo: 'la foto es de: Mamá Cocina (pan rallado con ajo y perejil)' },
    { nombre: 'Obleas Oblitas Frutilla', motivo: 'la foto es de: Bauducco Wafer Fresa' },
    { nombre: 'Obleas Oblitas Vainilla', motivo: 'la foto es de: Santa María Obleas' },
    { nombre: 'Galletitas Celosas Semibañadas', motivo: 'la foto es de: Celosas Polvorones sabor Vainilla (otra línea de producto)' },
    { nombre: 'Pan Lactal Grande La Santiagueña', motivo: 'la foto es de: Pan Lactal "Mil Semillas" La Santiagueña (otra variedad)' },
    { nombre: 'Fideos Nido Maserati', motivo: 'la foto es de: El Record' },
    { nombre: 'Pionono Signo de Oro', motivo: 'la foto es de: Dia (marca propia de supermercado)' },
    { nombre: 'Tapas de Empanada Provinciana', motivo: 'la foto es de: La Italiana "Criollas" (otro tipo de tapa)' },
    { nombre: 'Tapas de Empanada Provinciana - Pack x5 doc', motivo: 'la foto es de: La Italiana "Criollas" (misma foto que la anterior)' },
    { nombre: 'Ravioles de Tomate y Muzzarella El Sol', motivo: 'la foto es de: El Sol "Calabaza y Muzzarella" (mismo paquete que ese otro producto)' },
    { nombre: 'Ravioles de Pollo y Verdura La Italiana', motivo: 'la foto es de: La Italiana "Pollo y Espinaca" (variante más específica)' },
    { nombre: 'Anís en Grano 537 (sobres x5)', motivo: 'la foto es de: Alicante' },
    { nombre: 'Coco Rallado 537 (sobres x5)', motivo: 'la foto es de: Alicante' },
    { nombre: 'Comino Molido 537 (500 g)', motivo: 'la foto es de: Alicante' },
    { nombre: 'Condimento para Arroz 537 (500 g)', motivo: 'la foto es de: Alicante' },
    { nombre: 'Condimento para Arroz 537 (sobres x5)', motivo: 'la foto es de: Alicante (misma foto que el anterior)' },
    { nombre: 'Pimienta Blanca Molida 537 (500 g)', motivo: 'la foto es de: Alicante' },
    { nombre: 'Pimienta Blanca Molida 537 (sobres x5)', motivo: 'la foto es de: Alicante (misma foto que el anterior)' },
    { nombre: 'Nuez Moscada 537 (sobres x5)', motivo: 'la foto es de: Pérgola' },
    { nombre: 'Polvo para Hornear 537 (500 g)', motivo: 'la foto es de: Royal' },
    { nombre: 'Polvo para Hornear 537 (sobres x5)', motivo: 'la foto es de: Royal (misma foto que el anterior)' },
    { nombre: 'Granas Celestes 537 (sobres x5)', motivo: 'la foto es de: La Parmesana' },
    { nombre: 'Salsa Chimichurri 537 (330 g)', motivo: 'la foto es de: Arytza' },
    { nombre: 'Salsa de Ají 537 (330 g)', motivo: 'la foto es de: De Cecco Sugo all\'Arrabbiata — ni siquiera es salsa picante, es salsa de tomate italiana' },
    { nombre: 'Aceto Balsámico 537 (330 cc)', motivo: 'la foto es de: Cocinero, 500 ml' },
    { nombre: 'Vinagre de Alcohol 537 (960 cc)', motivo: 'la foto es de: Casalta' },
    { nombre: 'Vinagre de Alcohol Silva (5 L)', motivo: 'la foto es de: Casalta' },
    { nombre: 'Vinagre de Alcohol Silva (500 ml)', motivo: 'la foto es de: Casalta' },
    { nombre: 'Vinagre de Alcohol Silva (960 ml)', motivo: 'la foto es de: Casalta' },
    { nombre: 'Aceite de Oliva Extra Virgen 120 Años (500 ml)', motivo: 'la foto es de: Cocinero, 250 ml' },
    { nombre: 'Aceite Mezcla Girasol-Oliva 120 Años (500 ml)', motivo: 'la foto es de: Natura' },
    { nombre: 'Esencia de Vainilla 537 (28 cc)', motivo: 'la foto es de: Organic Spa "aceite aromatizante para hornillos" — ¡no es un producto comestible!' },
    { nombre: 'Ketchup Benidorm Individual - Caja x198', motivo: 'la foto es de: Dánica' },
    { nombre: 'Puré de Tomate La Huerta (210 g)', motivo: 'la foto es de: La Campagnola, 530 g' },
    { nombre: 'Puré de Tomate La Huerta (520 g)', motivo: 'la foto es de: La Campagnola, 530 g (misma foto que el anterior)' },
    { nombre: 'Puré de Tomate Molto (520 g)', motivo: 'la foto es de: De Cecco Passata Classica' },
    { nombre: 'Puré de Tomate Molto (520 g) - Pack', motivo: 'la foto es de: De Cecco Passata Classica (misma foto que el anterior)' },
    { nombre: 'Alfajores Guaymallén Triple', motivo: 'la foto es de: El Rosario' },
    { nombre: 'Confites de Maní Georgalos', motivo: 'la foto es de: Georgalos "Full Maní" — es una barra de chocolate, no confites' },
    { nombre: 'Maní Cropp Crema y Cebolla', motivo: 'la foto es de: Maní King' },
    { nombre: 'Maní Cropp Crocante Jamón', motivo: 'la foto es de: Maní King' },
    { nombre: 'Obleas Maná Chocolate', motivo: 'la foto es de: Gullón D\'Nature' },
    { nombre: 'Obleas Maná Limón', motivo: 'la foto es de: Santa María' },
    { nombre: 'Papas Clásicas Ronda (55 g)', motivo: 'la foto es de: Lay\'s Clásicas, 330 g' },
    { nombre: 'Papas Clásicas Ronda (95 g)', motivo: 'la foto es de: Lay\'s Clásicas, 330 g (misma foto que el anterior)' },
    { nombre: 'Gelatina Ravana sin Sabor', motivo: 'la foto es de: Gelatina Light sabor a Durazno' },
    { nombre: 'Maní Cropp Frito con Sal', motivo: 'la foto es de: Tostado SIN sal' },
    { nombre: 'Maní Cropp Jalapeño', motivo: 'la foto es de: Sabor Panceta' },
    { nombre: 'Maní Cropp Parmesano', motivo: 'la foto es de: Sabor Panceta (misma foto que "Jalapeño")' },
    { nombre: 'Chocolate Cofler Air con Leche (27 g)', motivo: 'la foto es de: Envase de 55 g (misma foto que el producto de 55 g)' },
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
      console.log('\nSi está OK →  await quitarFotosCompleto.aplicar()');
    },

    async aplicar() {
      const { db, fsMod } = await fb();
      const { getDocs, collection, writeBatch, doc, setDoc } = fsMod;
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
      console.log(`✅ ${resueltos.length} fotos quitadas. Regenerando snapshot...`);

      // Regenerar el snapshot (config/catalogo) para que la home refleje las fotos quitadas.
      // Mismo criterio de serialización que admin.html (SNAP_FIELDS / publicarSnapshot).
      const SNAP_FIELDS = ['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
      const fresco = await getDocs(collection(db, 'productos'));
      const arr = [];
      fresco.forEach(d => {
        const p = d.data(), o = { id: d.id };
        SNAP_FIELDS.forEach(f => { if (p[f] !== undefined && p[f] !== null && p[f] !== '') o[f] = p[f]; });
        arr.push(o);
      });
      await setDoc(doc(db, 'config', 'catalogo'), { productos: JSON.stringify(arr), count: arr.length, updatedAt: Date.now() });
      console.log(`✅ Listo. Snapshot regenerado: ${arr.length} productos.`);
    }
  };

  window.quitarFotosCompleto = api;
  console.log('%cquitarFotosCompleto cargado (barrido completo del catálogo, 14 categorías).', 'color:green;font-weight:bold');
  api.lista();
})();
