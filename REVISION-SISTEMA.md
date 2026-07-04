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

### 🟡 MEDIO — pendiente

**M3 — Sin paginación / DOM grande.** Los 1.130 productos se montan todos en el DOM (aunque las fotos ya cargan lazy). Conviene paginar o renderizar por categoría.

**M6 — El panel admin sigue pesado.** `admin.html` hace `getDocs(productos)` completo → baja las fotos al abrir (afecta solo al dueño). Se le puede aplicar la misma carga lazy.

### 🟢 BAJO — pendiente

- **B6** — Parseo de precios frágil ante formato "1.234,50".
- **B7** — Links sociales de Instagram/Facebook apuntan a `#` (falta pasar las URLs reales o quitarlos).
- **B5b** — El resto de labels del admin (modales) sin `for` — micro-a11y en panel de un solo usuario.

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
2. **Aligerar el panel admin** (M6) — misma carga lazy que el catálogo.
3. **Paginar el catálogo** (M3) — opcional, el DOM es grande pero funciona.
4. **Detalles** (B6, B7) — parseo de precios, links sociales.
5. **Opcional:** si se activa Firebase Storage, mover las fotos a un CDN real; versionar `firestore.rules`.

*(También sigue pendiente de sesiones anteriores la fusión de variantes de precio min/may.)*

---

## Cómo se probó

- **Reglas Firestore:** REST de escritura/borrado sin token → 403.
- **Payload:** `productos` con y sin máscara de `fotoUrl` → 30.1 MB vs 693 KB.
- **Navegador (en vivo):** carga antes (27 s) y después (~1 s / load 950 ms), búsqueda, filtros, fotos lazy al scrollear, login admin (sin modificar datos).
