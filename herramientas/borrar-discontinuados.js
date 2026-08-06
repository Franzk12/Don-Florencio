/* ============================================================================
   BORRAR DISCONTINUADOS — la dueña ya no los trabaja (28/07)  —  Santa María
   ----------------------------------------------------------------------------
   Borra 40 productos que la dueña marcó "sin stock / no trabajo más" en el xlsx.
   Sin confirm(). Regenera snapshot. ⚠️ Correr con escudo Brave ABAJO + Ctrl+Shift+R.
   OJO: el borrado NO se deshace.

       await borrarDisc.aplicar();
   ============================================================================ */
(function () {
  const BORRAR = [
    { id: "p_1780333401808_nyjw", nombre: "Aceitunas Descarozadas Tres Reyes Doypack (70 g)" },
    { id: "p_1780333401808_cc4f", nombre: "Aceitunas Rellenas" },
    { id: "p_1780333401808_ohvi", nombre: "Aceitunas Tres Reyes (2,25 kg)" },
    { id: "p_imp_1783122342_0463", nombre: "Champiñones Enteros La Banda (400 g)" },
    { id: "p_imp_1783122342_0315", nombre: "Choclo Amarillo Cremoso La Banda (350 g)" },
    { id: "p_imp_1783122342_0317", nombre: "Choclo Amarillo Cremoso La Banda (800 g)" },
    { id: "p_imp_1783122342_0313", nombre: "Choclo Amarillo Entero La Banda (800 g)" },
    { id: "p_imp_1783122342_0314", nombre: "Choclo Blanco Cremoso La Banda" },
    { id: "p_imp_1783122342_0441", nombre: "Durazno en Mitades Inca (820 g)" },
    { id: "p_imp_1783122342_0369", nombre: "Durazno en Mitades Sabio (820 g)" },
    { id: "p_imp_1783122342_0485", nombre: "Lentejas La Banda (350 g)" },
    { id: "p_imp_1783122342_0596", nombre: "Tomate Triturado Inca (910 g)" },
    { id: "p_imp_1783122342_0023", nombre: "Granas Celestes 537 (sobres x5)" },
    { id: "p_imp_1783122342_0398", nombre: "Galletas de Arroz sin Sal Macro" },
    { id: "p_imp_1783122342_0511", nombre: "Obleas Oblitas Frutilla" },
    { id: "p_imp_1783122342_0512", nombre: "Obleas Oblitas Vainilla" },
    { id: "p_1783027899251_sq1w", nombre: "Pan con Salvado Tío Guis" },
    { id: "p_imp_1783122342_0184", nombre: "Pan de Miga Santa María" },
    { id: "p_1783027899251_1hul", nombre: "Pan Lactal Chico Blanco Tío Guis (300 g)" },
    { id: "p_1783027899251_e1ee", nombre: "Pan Lactal Salvado Tío Guis" },
    { id: "p_1783027899251_mcem", nombre: "Pan Lactal Tío Guis (500 g)" },
    { id: "p_1783027899251_v5xu", nombre: "Pan Semillado Tío Guis" },
    { id: "p_1783027911563_j5lh", nombre: "Pionono Signo de Oro" },
    { id: "p_imp_1783122342_0083", nombre: "Ravioles de Pollo y Verdura La Italiana" },
    { id: "p_imp_1783122342_0191", nombre: "Tapas de Empanada Provinciana" },
    { id: "p_imp_1783122342_0194", nombre: "Tapas de Empanada Provinciana - Pack x5 doc" },
    { id: "p_imp_1783122342_0419", nombre: "Gelatina Suelta" },
    { id: "p_imp_1783122342_0488", nombre: "Obleas Maná Chocolate" },
    { id: "p_imp_1783122342_0490", nombre: "Obleas Maná Limón" },
    { id: "q1278", nombre: "Queso Cremoso Don Santiago" },
    { id: "p_imp_1783122342_0098", nombre: "Yerba Mate CBSé Dubái (250 g)" },
    { id: "p_imp_1783122342_0099", nombre: "Yerba Mate CBSé Picante (250 g)" },
    { id: "p_imp_1783122342_0448", nombre: "Jugo Baggio Durazno y Naranja (1 L)" },
    { id: "p_imp_1783122342_0060", nombre: "Jugo Clight Mango y Pera" },
    { id: "p_imp_1783122342_0062", nombre: "Jugo Clight Manzana Verde" },
    { id: "p_imp_1783122342_0458", nombre: "Jugo Rinde 2 Naranja" },
    { id: "p_imp_1783122342_0088", nombre: "Naranjú - Caja" },
    { id: "p_imp_1783122342_0558", nombre: "Salchichas Comarca Súper x18" },
    { id: "p_imp_1783122342_0529", nombre: "Postre Suelto" },
    { id: "p_1780333401808_tcnm", nombre: "Hamburguesas Chacra Nuestra x2" },
  ];
  async function fb(){ const a=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'); const f=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'); return {db:f.getFirestore(a.getApp()),fsMod:f}; }
  async function ids(){ const {db,fsMod}=await fb(); const s=await fsMod.getDocs(fsMod.collection(db,'productos')); const set=new Set(); s.forEach(d=>set.add(d.id)); return set; }
  async function simular(){
    const ex=await ids();
    console.log('%c── BORRAR discontinuados (simulación) ──','font-weight:bold');
    let n=0; for(const b of BORRAR){ if(ex.has(b.id)){console.log('🗑️',b.nombre);n++;} else console.warn('ya no existe',b.id,b.nombre); }
    console.log(`%c${n} a borrar de ${BORRAR.length}`,'font-weight:bold');
    console.log('%cAplicar:  await borrarDisc.aplicar()','color:#a11;font-weight:bold');
  }
  async function aplicar(){
    const {db,fsMod}=await fb(); const {getDocs,collection,setDoc,doc,deleteDoc}=fsMod;
    const s=await getDocs(collection(db,'productos')); const ex=new Set(); s.forEach(d=>ex.add(d.id));
    let n=0; for(const b of BORRAR){ if(ex.has(b.id)){ await deleteDoc(doc(db,'productos',b.id)); n++; if(n%10===0)console.log('   ...'+n); } }
    console.log('%c✅ '+n+' borrados. Regenerando snapshot...','color:#a11;font-weight:bold');
    const F=['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fr=await getDocs(collection(db,'productos')); const arr=[];
    fr.forEach(d=>{const p=d.data(),o={id:d.id};F.forEach(f=>{if(p[f]!==undefined&&p[f]!==null&&p[f]!=='')o[f]=p[f]});arr.push(o)});
    await setDoc(doc(db,'config','catalogo'),{productos:JSON.stringify(arr),count:arr.length,updatedAt:Date.now()});
    console.log('%c✅ Snapshot: '+arr.length+' productos.','color:#2d7a4f;font-weight:bold');
  }
  window.borrarDisc={simular,aplicar,BORRAR};
  console.log('%cborrarDisc cargado ('+BORRAR.length+' a borrar).','font-weight:bold','→ await borrarDisc.simular()');
  simular();
})();
