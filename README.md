# Santa María Distribuidora — Catálogo online + panel de autogestión

Catálogo web público + panel de administración para la distribuidora **Santa María**
(fiambres, quesos, embutidos, almacén). La dueña gestiona precios, ofertas, stock y
fotos desde un panel propio, sin tocar código. Es una PWA instalable.

🔗 **En vivo:** https://santamariadist.com
🔧 **Panel:** https://santamariadist.com/admin.html

> Repo histórico: `Don-Florencio` (nombre interno). La marca pública es **Santa María**.

---

## Qué resuelve

Vitrina digital autogestionable para un comercio, con **costo de infraestructura cero**
(plan gratis de Firebase + Vercel). El valor técnico central es un **modelo de datos
diseñado para no quedarse sin cuota de lecturas** aunque entre mucha gente (ver abajo).

---

## Stack real

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + **JavaScript vanilla (ES Modules)**, sin framework ni build |
| Datos | **Cloud Firestore** (NoSQL) — plan Spark (gratis) |
| Auth | **Firebase Auth** (email/password) para el admin |
| Hosting | **Vercel** (estático), deploy automático por push a `main` |
| Dominio | `santamariadist.com` (apex → 308 → `www`) |
| PWA | Service Worker (`sw.js`) + Web App Manifest |
| Import | SheetJS (XLSX) cargado on-demand por CDN, solo en el import del admin |

No hay backend propio: el cliente habla directo con Firestore (REST + SDK).

---

## Arquitectura

```
Visitante → index.html (Vercel, estático)
          → REST: GET config/catalogo   (1 solo documento)  → render del catálogo
          → foto lazy: Firestore base64  ó  /fotos-web/<id>.webp

Dueña → admin.html → Firebase Auth → edita un array en memoria
      → "Guardar catálogo": writeBatch(productos/*) + setDoc(config/catalogo)
```

### 🔑 Modelo de cuota (lo más importante de entender)

El plan gratis de Firestore da **50.000 lecturas/día**. Para no reventarlo:

- **El home lee UN solo documento** (`config/catalogo`, un "snapshot" con todo el
  catálogo serializado en un string JSON) → **1 lectura por visita**, sin importar
  cuántos productos haya. (`index.html` → `cargarDesdeSnapshot`)
- **Las fotos se cargan lazy** (solo la del producto que se ve), y hay un "Plan B"
  de fotos estáticas en `/fotos-web/<id>.webp` servidas por el CDN (gratis).
- **El listener en vivo (`onSnapshot`) está limitado al dispositivo admin**
  (marca `sm_live` en localStorage). El cliente normal hace **1 lectura y listo**.
- **La config (ticker/hero/footer) se cachea** en localStorage con TTL
  (`configCacheado`) → ~0 lecturas extra por visita.
- El fallback que lee la colección completa (~1.000+ lecturas) está **capado a admin**.

> ⚠️ **No volver a poner el listener en vivo o la lectura de colección para el público.**
> Es lo que protege la cuota.

---

## Modelo de datos (Firestore)

| Documento / colección | Contenido |
|---|---|
| `config/catalogo` | **Snapshot**: `{ productos: JSON.stringify(array), count, updatedAt }`. Es lo que lee el home. |
| `productos/{id}` | Doc por producto (incluye `fotoUrl` en base64). Fuente para el admin. |
| `config/ticker`, `config/hero`, `config/footer` | Configuración editable del sitio. |
| `ofertas/{id}` | **Legacy** del sistema viejo de ofertas (ver Deuda conocida). |

**Campos de producto:** `nombre, cat, desc, min` (precio minorista = el que se muestra),
`efectivo, mayor, mayorEfectivo, orden, stock` (bool), `oculto` (bool, baja lógica),
`enOferta` (bool), `precioOferta`, `tieneFoto`, `fotoUrl`, `fotoZoom/PosX/PosY`.

**Categorías (15):** fiambres, quesos, embutidos, lacteos, almacen, bebidas, congelados,
encurtidos, limpieza, bazar, panificados, pastas, aderezos, dulces.

**Guardar = 2 escrituras:** `writeBatch` de los docs `productos/*` (lotes de 400) +
`setDoc(config/catalogo)` para republicar el snapshot. El home se entera solo.

---

## Seguridad

- **Auth:** Firebase Auth email/password. Sin whitelist de email en el cliente.
- **Reglas Firestore** (viven en la **consola de Firebase**, copia local en
  `firestore.rules`, gitignorada):
  - `read: if true` → catálogo público (es una vitrina abierta).
  - `write: if request.auth.uid in [allowlist]` → **solo los UID de admin** pueden escribir.
    Hoy: `santamariadist197@gmail.com` (dueña) y `franzk.dev@gmail.com` (dev).
- **Headers de seguridad** en `vercel.json` (HSTS, nosniff, X-Frame-Options, etc.).
- La **API key de Firebase** en el cliente es **pública por diseño** (no es un secreto;
  la seguridad real son las reglas).
- Datos privados fuera del repo vía `.gitignore` (planillas, audios, propuesta de pago).

> Gotcha conocido: si un admin nuevo no está en la allowlist de UID, todo write falla
> con *"Missing or insufficient permissions"*. Agregar su UID a las reglas.

---

## Estructura

```
index.html          # catálogo público (+ modelo de cuota)
admin.html          # panel: Catálogo, Ofertas, Ticker, Hero, Configuración
sw.js               # service worker (PWA / cache)
vercel.json         # headers de seguridad
firestore.rules     # reglas (copia local; se editan en la consola) [gitignored]
fotos-web/          # fotos estáticas <id>.webp (Plan B, servidas por CDN)
media/              # video del hero
herramientas/       # scripts de consola (carga/migración/limpieza) — ver abajo
informes/           # PDFs para la dueña (manual, QR, etc.)  [parte gitignored]
planillas/          # Excels de precios (locales)  [gitignored]
docs/               # notas internas de fotos
```

---

## Operación diaria (admin)

- **Cambiar un precio:** Catálogo → Editar producto → cambiar *Minorista* → Guardar cambios → **Guardar catálogo**.
- **Actualizar precios por Excel:** usar las plantillas `planillas/plantillas-precios/actualizar-precios-<cat>.xlsx`
  (traen Código + Nombre + precio actual). Cambiar la columna *Minorista* → **↑ Excel** → Confirmar → Guardar.
  El importador **actualiza por Código** (no duplica); una fila sin código = producto nuevo.
- **Poner una oferta:** editor → poner *Precio de oferta* → en la pestaña **Ofertas**, prender el interruptor.
- **Ocultar un producto (sin borrar):** toggle "👁 Se muestra / 🙈 Oculto" en la fila.
- **Sin stock:** toggle de stock en la fila.
- **Fotos:** hoy se agregan como archivos en `fotos-web/<id>.webp` (o base64 desde el editor).

---

## Deploy

- Push a `main` → Vercel buildea y publica automáticamente.
- Sitio estático (sirve la raíz del repo). No hay build step.
- El **service worker** cachea; al cambiar `index.html` conviene subir la versión de
  cache en `sw.js` (`const CACHE = 'santamaria-vXX'`) para forzar refresco.

---

## Backups y restauración

Repo independiente **`Santamaria-backups`** (NO conectado a Vercel):

- GitHub Action diaria (03:00 ART) baja `config/catalogo` + configs y los commitea
  (decodificados, listos para restaurar). Gratis, sin Blaze, sin secretos.
- **Restaurar:** copiar un `backups/backup-*.json`, pegarlo en `restore.js`, y correrlo
  en la **consola del admin** (autenticado) → `await restore.aplicar()`.
- Ver el `README.md` de ese repo para el paso a paso.

---

## Herramientas de consola (`herramientas/`)

Scripts para correr **pegándolos en la consola del navegador con el admin logueado**
(no son parte del sitio). Usan el patrón de **parche liviano del snapshot**
(leer `config/catalogo` → mutar → `setDoc`) para no bajar toda la colección.

Ejemplos: `cargar-*.js` (altas/precios por categoría), `cargar-aumentos.js`,
`cargar-ofertas.js`, `limpiar-*.js`, `migracion-catalogo.js`, `subir-fotos.js` /
`quitar-fotos.js`, `exportar-fotos-web.py` (genera las fotos estáticas).

> Nota: hoy `herramientas/` se publica junto al sitio. Conviene gitignorearlo
> (no expone secretos, pero es tooling interno).

---

## Deuda técnica conocida (ver auditoría para detalle)

- **`may` vs `mayor`**: el precio mayorista se guarda en dos campos según por dónde
  se edite (batch usa `may`, editor/snapshot usan `mayor`). Unificar.
- **Sistema de ofertas legacy** (`ofertas/*` + `loadOfertas`) sigue activo aunque la UI
  esté oculta; consume lecturas. Retirar.
- **Snapshot 1 MB**: `config/catalogo` es un doc único (límite Firestore 1 MiB; hoy ~29%).
  Falta un guard duro de tamaño antes de publicar.
- **Fotos base64 en Firestore** inflan los docs; migrar a Storage/CDN (ya iniciado con `fotos-web/`).

## Gotchas operativos

- **Brave** bloquea `firestore.googleapis.com` (escudos) y lo disfraza de
  *"insufficient permissions"*. Bajar escudos del sitio o usar Chrome.
- Tras un **restore por consola**, **recargar el admin** antes de editar (si no, el
  admin reescribe con su copia en memoria y deshace el restore).

---

## Correr local

Sitio estático:

    npx serve .

El catálogo carga desde Firestore (necesita internet). Para probar fotos estáticas:
`?fotos=static`.
