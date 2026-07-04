# Revisión integral del sistema — Santa María Distribuidora

**Fecha:** 2026-07-03 · **Alcance:** `index.html` (catálogo público), `admin.html` (panel), `sw.js`, `migracion-catalogo.js`, Firestore y deploy en Vercel.
**Método:** revisión de código + pruebas en vivo (navegador automatizado, test de reglas de Firestore, medición de payload).

> Nota: el proyecto Firebase/repo se llama **don-florencio** pero la **marca pública es "Santa María Distribuidora"**. No es un error; no hay que unificar nombres.

---

## Resumen ejecutivo

| Área | Estado |
|---|---|
| **Seguridad** | 🟢 Buena base (reglas Firestore bloquean escritura sin login, verificado). 1 verificación manual pendiente. |
| **Performance** | 🔴 Problema serio: la primera carga baja **~30 MB** y tarda **~27 s**. |
| **Calidad de código** | 🟡 Funciona, pero el guardado y el manejo de fotos no escalan a 1130 productos. |
| **UI/UX / Accesibilidad** | 🟢 Bien resuelto (focus, aria, reduced-motion). Detalles menores. |
| **Funcionalidad** | 🟢 Catálogo, búsqueda, filtros, ofertas y admin funcionan correctamente en vivo. |

**Lo más urgente:** las fotos se guardan como base64 dentro de Firestore, lo que infla cada carga del catálogo a 30 MB (96% son imágenes). Es la causa raíz del problema de performance **y** del costo de escritura al guardar.

---

## Lo que está bien ✅

- **Reglas de Firestore correctas:** probé escritura y borrado SIN autenticación en `productos`, `ofertas` y `config` → todo devuelve **403**. Lectura pública por diseño. La `apiKey` expuesta es normal en Firebase.
- **Protección XSS en productos/ofertas:** todos los campos de producto se escapan con `esc()` antes de renderizar.
- **Accesibilidad del catálogo:** foco visible por teclado (`:focus-visible`), `prefers-reduced-motion` honrado, `<meta theme-color>`, botones de ícono con `aria-label`, imágenes con `alt`, toggle con `role="switch"`.
- **Service worker** no cachea llamadas a Firebase (evita servir datos viejos).
- **Todo funciona en vivo:** 13 categorías (incluidas Panadería y Pastas), búsqueda, filtros, toggle mayorista, WhatsApp, y el panel admin con los 1130 productos.

---

## Hallazgos por prioridad

### 🔴 CRÍTICO

**C1 — La primera carga del catálogo baja ~30 MB (tarda ~27 s).**
Medido en vivo: el snapshot de `productos` pesa **30.1 MB** para 1130 productos, de los cuales **29.2 MB (96%) son fotos en base64** embebidas en los documentos. Solo 394/1130 productos tienen foto; los datos "puros" (sin fotos) pesan **693 KB**. La app transfiere **44× más de lo necesario**. El público objetivo son clientes en el celular → carga lenta y consumo de datos alto, además de costo de egress en Firestore.
*Archivos:* `admin.html:1211-1218` (guarda base64), `index.html:1718` (`onSnapshot` baja todo).

### 🟠 ALTO

**A1 — Las fotos viven en base64 dentro de Firestore (causa raíz de C1).**
La función `uploadImageToStorage` (`admin.html:1211`) **no sube a Storage**: comprime la imagen y la guarda como data-URL base64 en el campo `fotoUrl`. Los imports de Firebase Storage quedaron sin usar y el nombre de la función engaña.
→ **Fix estructural:** subir las fotos a Firebase Storage (o un CDN) y guardar solo la URL. Cada documento pasaría de ~75 KB a <1 KB.

**A2 — "Guardar catálogo" reescribe los 1130 productos uno por uno.**
`admin.html:1655-1675`: un `setDoc` secuencial por producto, cada uno con su foto base64. Con 1130 productos es lento (minutos), caro en cuota (Firestore gratis = 20.000 escrituras/día) y si se corta a la mitad deja el guardado incompleto.
→ **Fix:** guardar solo los productos modificados, o usar `writeBatch` en lotes de 400 (como ya hace `migracion-catalogo.js:178`).

**A3 — Confirmar que las reglas de Firestore exigen el UID del admin.**
El panel se muestra con solo estar autenticado (`admin.html:1255`, `if(user)`); no hay lista de admins en el cliente. La seguridad real depende de que las reglas pidan el **UID específico**. No pude terminar de verificarlo (crear cuentas de prueba en producción fue bloqueado, correctamente).
→ **Acción manual (consola Firebase → Firestore → Reglas):** confirmar que dicen algo como `allow write: if request.auth.uid == "<TU_UID>";` y **no** solo `if request.auth != null;`. Si fuera lo segundo y el registro por email estuviera habilitado, cualquiera podría registrarse y escribir. *(El UID del admin es `YSXyPajzSlNuF6XKYuaEZCfEd4a2`.)*

### 🟡 MEDIO

**M1 — XSS almacenado (solo admin) en datos de "config". → YA ARREGLADO.**
`footer.dir` y `footer.horarios` se inyectaban con `innerHTML` sin escapar, y `footer.maps` en un `href` sin validar. Solo escribible por el admin, pero lo corregí igual (escape + validación de URL). *Requiere redeploy para que tome efecto.*

**M2 — Service worker sirve la página cacheada primero.**
`sw.js`: tras un deploy, el visitante recurrente ve el `index.html` viejo hasta la 2ª visita. Hay que subir el número de versión de caché (`santamaria-v2`) en cada cambio del shell.

**M3 — Sin paginación ni virtualización.**
Los 1130 productos se montan todos en el DOM a la vez (confirmado en vivo). Conviene paginar o renderizar por categoría bajo demanda.

**M4 — `transition: all` en toda la hoja de estilos.**
`index.html` (varias reglas). Anima propiedades costosas; conviene listar solo `background-color`, `transform`, etc.

**M5 — Imágenes sin `width`/`height`.**
`index.html:1534` y `:1763`: provoca saltos de layout (CLS) al cargar. Fijar dimensiones o `aspect-ratio`.

### 🟢 BAJO

- **B1** — Buscador sin `aria-label`. → **YA ARREGLADO** (agregado `aria-label`/`name`/`autocomplete`).
- **B2** — `.gitignore` no ignoraba las planillas ni el backup de 31 MB. → **YA ARREGLADO**.
- **B3** — `cors.json` apuntaba a un dominio Netlify viejo. → **YA ARREGLADO** (Vercel).
- **B4** — Datos de ejemplo ("Jamón cocido") como fallback ante error transitorio (`index.html:1727`).
- **B5** — Labels de formulario en admin sin `for` (no clickeables).
- **B6** — Parseo de precios frágil ante formato "1.234,50" (`admin.html:1633`).
- **B7** — Links sociales de Instagram/Facebook apuntan a `#` (`index.html:1416-1417`).

---

## Cambios ya aplicados (rama `revision-sistema-jul2026`, commit `802f403`)

1. **Hardening XSS** en `footer.dir`, `footer.horarios` y `footer.maps` (`index.html`).
2. **Accesibilidad** del buscador (`aria-label`, `name`, `autocomplete`).
3. **`.gitignore`**: ahora ignora `*.xlsx`, backups, payloads de importación y PDFs de informes.
4. **`cors.json`**: dominio actualizado a `don-florencio.vercel.app`.

> Verificados sin errores de consola. Requieren **deploy a Vercel** para verse en producción.

---

## Plan recomendado (lo grande, para próximas sesiones)

1. **[Alta prioridad] Migrar fotos base64 → Firebase Storage.** Resuelve C1 y A1 de raíz: carga inicial ~44× más liviana. Implica un script de migración de las 394 fotos existentes + cambiar `uploadImageToStorage` para que suba de verdad.
2. **Guardado incremental / por lotes** (A2): `writeBatch` o guardar solo lo modificado.
3. **Confirmar reglas de Firestore por UID** (A3) — 5 minutos en la consola.
4. **Paginación/virtualización del catálogo** (M3) y versionado automático del service worker (M2).
5. Versionar un `firestore.rules` en el repo para poder auditarlo.

*(También sigue pendiente de la sesión anterior la fusión de variantes de precio min/may.)*

---

## Cómo se probó

- **Reglas Firestore:** requests REST de escritura/borrado sin token → 403 (correcto).
- **Payload:** descarga completa de `productos` con y sin máscara de `fotoUrl` → 30.1 MB vs 693 KB.
- **Navegador (en vivo):** carga cronometrada (27.2 s), búsqueda "yerba", filtro Aderezos, toggle mayorista, login admin (sin modificar datos) y logout. Capturas guardadas.
