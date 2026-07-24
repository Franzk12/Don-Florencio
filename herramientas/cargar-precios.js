/* ============================================================================
   CARGAR PRECIOS ESPECIALES Y STOCK  —  Santa María Distribuidora
   ----------------------------------------------------------------------------
   Carga los precios confirmados por la dueña (audios del 24/07) en los
   productos ESTABLES: papelera (escala por unidad / mayor / mayor efectivo),
   corrección de precio de unidad, y productos SIN STOCK.

   NO incluye (se definen aparte — ver bloque "PENDIENTES" al final):
     · Quesos y fiambres  → la dueña va a mandar una lista NUEVA (aumentaron).
     · Packs (Cerveza 361, Manaos 2L pack) → modelo "unidad + pack total",
       distinto a la escala; falta decidir cómo mostrarlo.
     · SKUs duplicados de papelera (variantes "(unidad)"/"(bulto)" repetidas)
       → decidir si se ocultan/borran para no mostrar el producto dos veces.

   CÓMO USARLO:
   - Abrí admin.html EN EL SITIO EN VIVO (don-florencio.vercel.app/admin.html)
     e INICIÁ SESIÓN como admin.
   - Consola (F12) → pegá TODO este archivo → Enter  → muestra el plan (simula).
   - Revisá el listado (actual → nuevo). Si algo no te cierra, avisá.
       await cargarPrecios.aplicar();   // escribe en Firestore (pide confirmar)
   - Recargá la home para verlo.
   ============================================================================ */
(function () {
  const n0 = v => (v === undefined || v === null || v === '') ? 0 : Number(v);

  // set: campos a escribir (merge). Solo se tocan los campos presentes.
  const LISTA = [
    // ── PAPELERA · escala (por unidad / por mayor tarjeta-QR / por mayor efectivo) ──
    { id: 'p_1780333401808_nx52', nombre: 'Papel Higiénico Elegante 6x30 m (unidad)', set: { min: 2320, mayor: 1855, mayorEfectivo: 1699 } }, // audio 9 (va en el SKU "(unidad)")
    { id: 'p_1780333401808_4ylp', nombre: 'Rollo de Cocina Elegante 200 Paños',      set: { min: 2285, mayor: 1830, mayorEfectivo: 1675 } }, // audio 11
    { id: 'p_1780333401808_a6vf', nombre: 'Rollo de Cocina Elegante 3x50',           set: { min: 1720, mayor: 1375, mayorEfectivo: 1265 } },
    { id: 'p_1780333401808_05vu', nombre: 'Rollo de Cocina New Dicha',               set: { min: 1585, mayor: 1269, mayorEfectivo: 1165 } },
    { id: 'p_1780333401808_2hcf', nombre: 'Servilletas Elegante Big x150',           set: { min: 2585, mayor: 2069, mayorEfectivo: 1895 } },
    { id: 'p_1780333401808_ay5u', nombre: 'Pañuelos Elegante x150',                  set: { min: 1229, mayor: 985,  mayorEfectivo: 910  } },
    { id: 'p_1780333401808_6svx', nombre: 'Pañuelos Elegante Pocket x6',             set: { min: 1150, mayor: 920,  mayorEfectivo: 839  } },

    // ── ALMACÉN · corrección de precio de unidad ──
    { id: 'p_imp_1783122342_0264', nombre: 'Azúcar La Muñeca (1 kg)',                set: { min: 1260 } }, // audio 5 (el pack 0141 queda en $10.670, está bien)

    // ── SIN STOCK ──
    { id: 'q1278',                nombre: 'Queso Cremoso Don Santiago',              set: { stock: false } }, // audio 4
    { id: 'q1374',                nombre: 'Ricota La Pastora',                       set: { stock: false } }, // audio 10
    { id: 'p_1780333401808_jclp', nombre: 'Sidra Tunuyán',                          set: { stock: false } }, // audio 13
    { id: 'p_1780333401808_m3il', nombre: 'Sidra Tunuyán - Caja',                   set: { stock: false } }, // audio 13
    { id: 'p_1780333401808_ow65', nombre: 'Sidra Ananá Tunuyán',                    set: { stock: false } }, // audio 13
    { id: 'p_1780333401808_dkc4', nombre: 'Sidra Ananá Tunuyán - Caja',             set: { stock: false } }, // audio 13
    { id: 'p_1780333401808_1pgn', nombre: 'Gaseosa Manaos Lata - Pack x6',          set: { stock: false } }, // audio 8
  ];

  async function fb() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: fsMod.getFirestore(appMod.getApp()), fsMod };
  }

  const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

  async function cargar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const cur = {};
    snap.forEach(d => cur[d.id] = d.data());
    return cur;
  }

  function fmt(n) { return '$' + Number(n || 0).toLocaleString('es-AR'); }

  async function simular() {
    const cur = await cargar();
    let ok = 0, warn = 0;
    console.log('%c── PLAN DE CARGA (simulación, no escribe nada) ──', 'font-weight:bold');
    for (const it of LISTA) {
      const p = cur[it.id];
      if (!p) { console.warn(`❌ NO EXISTE id ${it.id} (${it.nombre})`); warn++; continue; }
      const nameOk = norm(p.nombre).includes(norm(it.nombre)) || norm(it.nombre).includes(norm(p.nombre));
      const flag = nameOk ? '✓' : '⚠️ NOMBRE DISTINTO';
      const cambios = Object.entries(it.set).map(([k, v]) => {
        const antes = (k === 'stock') ? (p.stock === false ? 'sin stock' : 'con stock')
                                       : fmt(n0(p[k]));
        const desp  = (k === 'stock') ? (v === false ? 'SIN STOCK' : 'con stock') : fmt(v);
        return `${k}: ${antes} → ${desp}`;
      }).join('  ·  ');
      console.log(`${flag}  ${p.nombre}\n      ${cambios}`);
      nameOk ? ok++ : warn++;
    }
    console.log(`%c${ok} ok · ${warn} para revisar · total ${LISTA.length}`, 'font-weight:bold');
    console.log('%cPara aplicar:  await cargarPrecios.aplicar()', 'color:#2d7a4f;font-weight:bold');
  }

  async function aplicar() {
    const { db, fsMod } = await fb();
    const { getDocs, collection, writeBatch, doc } = fsMod;
    const snap = await getDocs(collection(db, 'productos'));
    const existe = new Set(); snap.forEach(d => existe.add(d.id));
    const validos = LISTA.filter(it => existe.has(it.id));
    const faltan = LISTA.filter(it => !existe.has(it.id));
    if (faltan.length) console.warn('No se encuentran (se saltean):', faltan.map(x => x.id + ' ' + x.nombre));
    if (!confirm(`Aplicar cambios a ${validos.length} productos?`)) { console.log('Cancelado.'); return; }
    for (let i = 0; i < validos.length; i += 400) {
      const batch = writeBatch(db);
      validos.slice(i, i + 400).forEach(it => batch.set(doc(db, 'productos', it.id), it.set, { merge: true }));
      await batch.commit();
    }
    console.log(`%c✅ Listo: ${validos.length} productos actualizados. Recargá la home.`, 'color:#2d7a4f;font-weight:bold');
  }

  const api = { simular, aplicar, LISTA };
  window.cargarPrecios = api;
  console.log('%ccargarPrecios cargado.', 'font-weight:bold', '→ corré  await cargarPrecios.simular()  para ver el plan.');
  simular();
})();
