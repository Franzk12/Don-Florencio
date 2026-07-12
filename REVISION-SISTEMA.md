# Revisión integral del sistema — Santa María Distribuidora

**Fecha:** 2026-07-03 · **Actualizado:** 2026-07-04 · **Alcance:** `index.html` (catálogo público), `admin.html` (panel), `sw.js`, `migracion-catalogo.js`, Firestore y deploy en Vercel.
**Método:** revisión de código + pruebas en vivo (navegador automatizado, test de reglas de Firestore, medición de payload).

> Nota: el proyecto Firebase/repo se llama **don-florencio** pero la **marca pública es "Santa María Distribuidora"**. No es un error; no hay que unificar nombres.

---

## Resumen ejecutivo

| Área | Estado |
|---|---|
| **Seguridad** | 🟢 Buena base (reglas Firestore bloquean escritura sin login, verificado). 1 verificación manual pendiente. |
| **Performance** | 🟢 **Resuelto** (4 jul): la carga inicial bajó de ~30 MB / ~27 s a ~700 KB / ~1 s. |
| **Calidad de código** | 🟢 Guardado por lotes aplicado. Queda solo aligerar el panel admin. |
| **UI/UX / Accesibilidad** | 🟢 Bien resuelto; pulido aplicado (transitions, error state, labels). |
| **Funcionalidad** | 🟢 Catálogo, búsqueda, filtros, ofertas y admin funcionan correctamente en vivo. |

**Estado general:** el hallazgo crítico y la mayoría de los pendientes quedaron **resueltos y deployados**. Queda una verificación manual de seguridad (reglas) y un par de mejoras menores.

---

## Lo que está bien ✅

- **Reglas de Firestore correctas:** escritura y borrado SIN autenticación en `productos`, `ofertas` y `config` → **403**. Lectura pública por diseño. La `apiKey` expuesta es normal en Firebase.
- **Protección XSS en productos/ofertas:** todos los campos se escapan con `esc()` antes de renderizar.
- **Accesibilidad del catálogo:** foco visible, `prefers-reduced-motion`, `theme-color`, botones con `aria-label`, imágenes con `alt`, toggle `role="switch"`.
- **Todo funciona en vivo:** 13 categorías, búsqueda, filtros, toggle mayorista, WhatsApp, y el panel admin con los 1130 productos.

---

## Hallazgos por prioridad

### 🟢 RESUELTO (3–4 jul 2026)

- **C1 — Carga de ~30 MB / ~27 s.** El catálogo carga los datos SIN fotos (~700 KB) vía REST con field mask, y baja cada imagen bajo demanda (`IntersectionObserver`) usando un flag `tieneFoto`. Medido: load **950 ms** (~1 s). *Commits `561f429`, `28ed405`.*
- **A1 — Fotos base64 descargadas de más.** Mitigado: siguen en `fotoUrl` pero ya no se bajan al abrir.
- **A2 — "Guardar catálogo" reescribía 1.130 docs uno por uno.** Ahora usa `writeBatch` en lotes de 400. *Commit `d43bee1`.*
- **M1 — XSS almacenado (config).** Escapes + validación de URL. *Commit `802f403`.*
- **M2 — Service worker servía versión vieja.** Ahora *network-first* para HTML + bump `v3`. *Commit `ee6d575`.*
- **M4 — `transition: all`.** Reemplazado por propiedades puntuales. *Commit `d43bee1`.*
- **M5 — Imágenes sin dimensiones.** Ya estaba cubierto: `.prod-foto` tiene alto fijo (150px) → sin salto de layout.
- **B1 — Buscador sin `aria-label`.** Agregado.
- **B2 — `.gitignore`** ignora planillas/backups. **B3 — `cors.json`** al dominio de Vercel.
- **B4 — Datos de ejemplo ante error.** Ahora muestra un mensaje al usuario. *Commit `d43bee1`.*
- **B5 — Labels del login sin `for`.** Agregado. *Commit `d43bee1`.*

### 🟠 ALTO — pendiente

**A3 — Confirmar que las reglas de Firestore exigen el UID del admin.**
El panel se abre con solo estar autenticado; la seguridad real depende de las reglas. El test de escritura sin auth ya da 403 (bien), pero no pude confirmar si piden un UID específico o solo `auth != null`. Trabado en ubicar la cuenta dueña del proyecto GCP.
→ **Acción manual (consola Firebase → Firestore → Reglas):** confirmar `request.auth.uid == "<UID>"` y no solo `request.auth != null`. No urgente (no hay registro público).

### 🟢 BAJO — pendiente

- **Deuda:** las ofertas duplican la foto base64 del producto en su propio doc (`ofertas/*`); cambiar a referencia por `productId` toca index+admin.

### ✅ RESUELTO en ronda 2 (5–6 jul 2026)

- **M6** — Panel admin pesado → **resuelto** (commit `8d6568f`): carga REST con field-mask sin fotos + lazy-load de miniaturas + guardados con `merge:true` que no pisan fotos no cargadas.
- **BUG ALTO (nuevo, detectado en ronda 2)** — Eliminar producto solo lo sacaba de memoria; **nunca borraba el doc en Firestore** (reaparecía al recargar) → ahora `_delProd` hace `deleteDoc` real. También: duplicar producto ya no arrastra foto fantasma, y se quitó el fallback que podía crear un doc espurio `p01`.
- **SW nunca registrado** — `sw.js` existía y se versionaba pero ningún HTML llamaba a `serviceWorker.register()`; la PWA estaba inactiva → registrado en `index.html` (cache v7).
- **Headers de seguridad** — no había `vercel.json` → creado con `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`, `Permissions-Policy`.
- **B7** — Instagram real conectado (`instagram.com/santamaria_dist`), ícono de Facebook quitado (no hay página).
- **SEO/previews** — `og:image`/`og:url` absolutas, `canonical`, Twitter Card, `preconnect` a `fonts.gstatic.com`, `openingHoursSpecification` + `sameAs` en JSON-LD.
- **Horarios unificados** — Lun–Vie 7–21, Sáb 7–13 (footer, mapa y "cómo comprás" decían tres cosas distintas).
- **Varios** — `fotoZoom` sanitizado en atributo `style`; `$NaN` evitado en precios sin `min`; link "A consultar" usa el teléfono configurable; `rel="noopener"` en todos los `target="_blank"`; `aria-pressed` en los filtros; el encuadre `fotoPosX/Y` del admin ahora sí se aplica en el sitio; `loadOfertas` con manejo de error; eliminado el modal de foto muerto y CSS/wrappers sin uso; `uploadImageToStorage` renombrada a `compressToDataURL` (no subía a Storage).

### ✅ Ronda 3 (11 jul 2026) — pedidos de la dueña + hallazgos

- **Contenido actualizado en `index.html`:** "más de 25 años" (hero y footer); horarios Lun–Vie 7–17, Sáb 7–15, Feriados 7–13 (mapa, footer y JSON-LD); dirección **Av. Sesquicentenario 2036, Los Polvorines** en footer, mapa, badge del hero y JSON-LD (links y embed de Maps ahora buscan por dirección; coordenadas viejas eliminadas); badge "Todos los días" → "Lunes a sábado".
- **Precios:** leyenda "Los precios pueden modificarse sin previo aviso" bajo el título del catálogo; cada tarjeta muestra "Precio sin impuestos nacionales" (min ÷ 1,21); el precio mayorista solo se muestra en productos que lo tienen cargado (se quitó el "A consultar" por tarjeta; la clase CSS `may-consultar` quedó sin uso).
- ⚠️ **Pendiente de config:** actualizar `dir`, `horarios` y `maps` en la config del admin (Firestore) — si conservan los valores viejos pisan el HTML al cargar.
- 🖼️ **Foto Gancia (staging):** `fotos-para-editar/gancia-americano-950-ml__p_imp_1783122342_0408.jpg` muestra la lata **Gancia Sin Alcohol 0.0 (473 ml)**, pero el único Gancia del catálogo es "Gancia Americano (950 ml)" (sin `tieneFoto`, no está publicada). Antes de subirla: conseguir la foto correcta de la botella, o cargar el producto sin alcohol como producto nuevo.
- ✅ **Config del admin actualizada** (dir/horarios/maps con Sesquicentenario 2036) — verificado leyendo `config/footer` por REST.
- ✅ **M3 resuelto** — filas de categoría montan 12 tarjetas + tarjeta "Ver todos (N) →"; la grilla (búsqueda/categoría) carga en lotes de 60 con `IntersectionObserver`. DOM inicial: ~1.121 → 182 tarjetas (verificado en navegador local). `sw` v9.
- ✅ **B6 resuelto** — el importador Excel parsea precios AR ("1.234,50"); antes ese valor se leía como `1.234`.
- ✅ **B5b resuelto** — 32 labels de config/modales del admin vinculados con `for=`.
- 🆕 **`subir-fotos.js`** — script de carga masiva de fotos (consola del admin logueado): matchea `archivo__IDPRODUCTO.jpg` o por nombre normalizado, comprime 1200px/85% (recomprime si supera 900KB), escribe `fotoUrl`+`tieneFoto` en lotes con `merge:true`, con simulación previa. Para atacar los 506 productos sin foto.

---

## Cambios ya aplicados y deployados

1. **Carga del catálogo 30 MB → ~700 KB (27 s → ~1 s):** flag `tieneFoto`, carga REST sin fotos, fotos lazy (`index.html`, `admin.html`).
2. **Service worker** *network-first* para HTML (`sw.js`).
3. **Guardado del catálogo por lotes** con `writeBatch` (`admin.html`).
4. **Hardening XSS** en footer (`index.html`).
5. **Pulido:** `transition` puntuales, estado de error del catálogo, buscador y login accesibles.
6. **Higiene:** `.gitignore` y `cors.json`.

---

## Lo que queda por hacer

1. **Confirmar las reglas de Firestore por UID del dueño** (A3) — consola. Única tarea de seguridad abierta.
2. **Cargar fotos faltantes** (506 productos, 46%) — usar `subir-fotos.js` desde la consola del admin.
3. **Opcional:** si se activa Firebase Storage, mover las fotos a un CDN real; versionar `firestore.rules`; des-duplicar la foto base64 de las ofertas.

---

## Cómo se probó

- **Reglas Firestore:** REST de escritura/borrado sin token → 403.
- **Payload:** `productos` con y sin máscara de `fotoUrl` → 30.1 MB vs 693 KB.
- **Navegador (en vivo):** carga antes (27 s) y después (~1 s / load 950 ms), búsqueda, filtros, fotos lazy al scrollear, login admin (sin modificar datos).
