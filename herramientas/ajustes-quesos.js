/* ============================================================================
   AJUSTES QUESOS — revisión de la dueña (28/07)  —  Santa María
   ----------------------------------------------------------------------------
   12 precios + 1 sin stock (Casancrem) + 1 efectivo (Roquefort $12.769).
   Sin confirm(). Regenera snapshot. IMPORTANTE: correr con escudo de Brave ABAJO
   + F5 (si no, las escrituras van al caché local y NO suben al server).

       await ajustesQuesos.aplicar();
   ============================================================================ */
(function () {
  const fmt = n => '$' + Number(n || 0).toLocaleString('es-AR');
  const LISTA = [
    { id: 'q5', nombre: "Cheddar Tonadita en Fetas", set: { min: 30599 } },
    { id: 'q1280', nombre: "Muzzarella Imperial", set: { min: 9500 } },
    { id: 'q421', nombre: "Muzzarella Pastora", set: { min: 7469 } },
    { id: 'q8', nombre: "Muzzarella en Plancha La Pastora", set: { min: 8649 } },
    { id: 'f143', nombre: "Queso Azul Silvia", set: { min: 21919 } },
    { id: 'q1547', nombre: "Queso Barra Tybo Punta del Agua", set: { min: 10750 } },
    { id: 'q1114', nombre: "Queso Rallado La Serenísima (130 g)", set: { min: 5055 } },
    { id: 'q826', nombre: "Ricota Silvia (500 g)", set: { min: 2299 } },
    { id: 'q69', nombre: "Sardo Blanco Santa María", set: { min: 8999 } },
    { id: 'q1236', nombre: "Muzzarella Barraza", set: { min: 11899 } },
    { id: 'q164', nombre: "Leche Descremada Larga Vida Tregar", set: { min: 2070 } },
    { id: 'q3217', nombre: "Queso Rallado La Serenísima (70 g)", set: { min: 2720 } },
    { id: 'p_imp_1783122342_0188', nombre: "Casancrem Clásico La Serenísima", set: { stock: false } },
    { id: 'p_imp_1783122342_0544', nombre: "Roquefort Emperador", set: { efectivo: 12769 } },
  ];
  async function fb() {
    const a = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const f = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    return { db: f.getFirestore(a.getApp()), fsMod: f };
  }
  async function cargar(){ const {db,fsMod}=await fb(); const s=await fsMod.getDocs(fsMod.collection(db,'productos')); const c={}; s.forEach(d=>c[d.id]=d.data()); return c; }
  async function simular(){
    const cur=await cargar(); let ch=0,w=0;
    console.log('%c── AJUSTES QUESOS (simulación) ──','font-weight:bold');
    for(const it of LISTA){ const p=cur[it.id]; if(!p){console.warn('NO EXISTE',it.id,it.nombre);w++;continue;}
      const k=Object.keys(it.set)[0],v=it.set[k];
      const d=k==='stock'?(v===false?'SIN STOCK':'con stock'):(k==='efectivo'?'efectivo '+fmt(v):fmt(v));
      console.log(`  ${p.nombre}  ${k==='min'?fmt(p.min)+' → ':''}${d}`); ch++; }
    console.log(`%c${ch} cambios · ${w} no existen`,'font-weight:bold');
    console.log('%cAplicar:  await ajustesQuesos.aplicar()','color:#2d7a4f;font-weight:bold');
  }
  async function aplicar(){
    const {db,fsMod}=await fb(); const {getDocs,collection,writeBatch,doc,setDoc}=fsMod;
    const s=await getDocs(collection(db,'productos')); const ex=new Set(); s.forEach(d=>ex.add(d.id));
    const val=LISTA.filter(it=>ex.has(it.id));
    console.log('Aplicando '+val.length+' ajustes...');
    const b=writeBatch(db); val.forEach(it=>b.set(doc(db,'productos',it.id),it.set,{merge:true})); await b.commit();
    console.log('%c✅ '+val.length+' aplicados. Regenerando snapshot...','color:#2d7a4f;font-weight:bold');
    const F=['nombre','cat','desc','min','efectivo','mayor','mayorEfectivo','orden','stock','enOferta','fotoZoom','fotoPosX','fotoPosY','tieneFoto'];
    const fr=await getDocs(collection(db,'productos')); const arr=[];
    fr.forEach(d=>{const p=d.data(),o={id:d.id};F.forEach(f=>{if(p[f]!==undefined&&p[f]!==null&&p[f]!=='')o[f]=p[f]});arr.push(o)});
    await setDoc(doc(db,'config','catalogo'),{productos:JSON.stringify(arr),count:arr.length,updatedAt:Date.now()});
    console.log('%c✅ Snapshot: '+arr.length,'color:#2d7a4f;font-weight:bold');
  }
  window.ajustesQuesos={simular,aplicar,LISTA};
  console.log('%cajustesQuesos cargado ('+LISTA.length+' ajustes).','font-weight:bold','→ await ajustesQuesos.simular()');
  simular();
})();
