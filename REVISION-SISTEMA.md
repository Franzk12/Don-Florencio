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
| **Calidad de código** | 🟡 Funciona; queda el guardado del catálogo (reescribe todo) y el admin pesado. |
| **UI/UX / Accesibilidad** | 🟢 Bien resuelto (focus, aria, reduced-motion). Detalles menores. |
| **Funcionalidad** | 🟢 Catálogo, búsqueda, filtros, ofertas y admin funcionan correctamente en vivo. |

**Estado general:** el hallazgo crítico (carga de 30 MB) quedó **resuelto y deployado**. Lo que queda son mejoras de menor prioridad y una verificación manual de seguridad.

---

## Lo que está bien ✅

- **Reglas de Firestore correctas:** probé escritura y borrado SIN autenticación en `productos`, `ofertas` y `config` → todo devuelve **403**. Lectura pública por diseño. La `apiKey` expuesta es normal en Firebase.
- **Protección XSS en productos/ofertas:** todos los campos de producto se escapan con `esc()` antes de renderizar.
- **Accesibilidad del catálogo:** foco visible por teclado (`:focus-visible`), `prefers-reduced-motion` honrado, `<meta theme-color>`, botones de ícono con `aria-label`, imágenes con `alt`, toggle con `role="switch"`.
- **Todo funciona en vivo:** 13 categorías (incluidas Panadería y Pastas), búsqueda, filtros, toggle mayorista, WhatsApp, y el panel admin con los 1130 productos.

---

## Hallazgos por prioridad

### 🟢 RESUELTO (4 jul 2026)

**C1 — La primera carga bajaba ~30 MB y tardaba ~27 s.** → **RESUELTO.**
El catálogo ahora carga los datos **sin** las fotos (~700 KB) vía REST con field mask, y baja cada imagen **bajo demanda** al hacer scroll (`IntersectionObserver`). Se usó un flag `tieneFoto` en los 394 productos con foto. Medido en producción: **DOMContentLoaded 398 ms, load 950 ms** (~1 s, antes 27 s). No hizo falta Firebase Storage (no estaba aprovisionado y no se ubicó la cuenta dueña del proyecto).
*Commits:* `561f429` (flag en admin), `28ed405` (catálogo lazy). *Archivos:* `index.html`, `admin.html`.

**A1 — Fotos base64 descargadas de más.** → **RESUELTO** (mitigado). Las fotos siguen en el campo `fotoUrl` (no se movieron ni perdieron) pero ya no se descargan todas al abrir. Si se activa Storage a futuro, se pueden mover a un CDN real.

**M1 — XSS almacenado (solo admin) en datos de contacto.** → **RESUELTO.** `footer.dir`, `footer.horarios` escapados; `footer.maps` validado. *Commit `802f403`.*

**M2 — Service worker servía la versión vieja cacheada.** → **RESUELTO.** Ahora es *network-first* para el HTML (fallback a caché offline) + bump de caché `v2→v3`. Los deploys llegan al visitante enseguida. *Commit `ee6d575`.*

### 🟠 ALTO — pendiente

**A2 — "Guardar catálogo" reescribe los 1.130 productos uno por uno.**
`admin.html`: un `setDoc` secuencial por producto (Firestore gratis = 20.000 escrituras/día). Lento y, si se corta a la mitad, queda incompleto.
→ **Fix:** guardar solo lo modificado, o por lotes con `writeBatch` (ya usado en `migracion-catalogo.js`).

**A3 — Confirmar que las reglas de Firestore exigen el UID del admin.**
El panel se abre con solo estar autenticado; la seguridad real depende de las reglas. El test de escritura sin auth ya da 403 (bien), pero no pude confirmar si piden un UID específico o solo `auth != null`.
→ **Acción manual (consola Firebase → Firestore → Reglas):** confirmar que dicen `request.auth.uid == "<UID>"` y no solo `request.auth != null`.

### 🟡 MEDIO — pendiente

**M3 — Sin paginación / DOM grande.** Los 1.130 productos se montan todos en el DOM (aunque las fotos ya cargan lazy). Conviene paginar o renderizar por categoría.

**M4 — `transition: all` en toda la hoja de estilos.** Anima propiedades costosas; listar solo `background-color`, `transform`, etc.

**M5 — Imágenes sin `width`/`height`.** Provoca saltos de layout (CLS) al cargar. Fijar dimensiones o `aspect-ratio`.

**M6 — El panel admin sigue pesado.** `admin.html` hace `getDocs(productos)` completo → baja las fotos al abrir (afecta solo al dueño, no a los clientes). Se le puede aplicar la misma carga lazy que al catálogo.

### 🟢 BAJO

- **B1** — Buscador sin `aria-label`. → **RESUELTO**.
- **B2** — `.gitignore` no ignoraba planillas/backup de 31 MB. → **RESUELTO**.
- **B3** — `cors.json` con dominio Netlify viejo. → **RESUELTO** (Vercel).
- **B4** — Datos de ejemplo ("Jamón cocido") como fallback ante error transitorio.
- **B5** — Labels de formulario en admin sin `for` (no clickeables).
- **B6** — Parseo de precios frágil ante formato "1.234,50".
- **B7** — Links sociales de Instagram/Facebook apuntan a `#`.

---

## Cambios ya aplicados y deployados

1. **Carga del catálogo 30 MB → ~700 KB (27 s → ~1 s):** flag `tieneFoto`, carga REST sin fotos, fotos lazy al scrollear (`index.html`, `admin.html`).
2. **Service worker** *network-first* para HTML (`sw.js`).
3. **Hardening XSS** en `footer.dir`, `footer.horarios`, `footer.maps` (`index.html`).
4. **Accesibilidad** del buscador (`aria-label`, `autocomplete`).
5. **`.gitignore`**: ignora planillas, backups y payloads de importación.
6. **`cors.json`**: dominio actualizado a `don-florencio.vercel.app`.

---

## Lo que queda por hacer

1. **Confirmar las reglas de Firestore por UID del dueño** (A3) — 5 minutos en la consola. Única tarea de seguridad abierta.
2. **Guardado del catálogo por lotes** (A2) — `writeBatch` o solo lo modificado.
3. **Aligerar el panel admin** (M6) — misma carga lazy que el catálogo.
4. **Detalles UI** (M4, M5, B4–B7) — `transition`, dimensiones de imágenes, links sociales, etc.
5. **Opcional:** si se activa Firebase Storage, mover las fotos a un CDN real; versionar `firestore.rules` en el repo.

*(También sigue pendiente de sesiones anteriores la fusión de variantes de precio min/may.)*

---

## Cómo se probó

- **Reglas Firestore:** requests REST de escritura/borrado sin token → 403 (correcto).
- **Payload:** descarga de `productos` con y sin máscara de `fotoUrl` → 30.1 MB vs 693 KB.
- **Navegador (en vivo):** carga cronometrada antes (27 s) y después (~1 s / load 950 ms), búsqueda, filtros, fotos lazy al scrollear, login admin (sin modificar datos).
