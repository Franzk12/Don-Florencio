# Prompt para Claude web (copiar todo lo de abajo)

Necesito que diseñes un documento de UNA sola pieza HTML (artifact), tamaño A4 vertical, listo para imprimir o guardar como PDF (2 páginas máximo), con diseño sobrio y profesional. Es un informe para la dueña de una distribuidora de fiambres: muestra con capturas de pantalla reales que las correcciones que ella pidió ya están publicadas en su sitio, y al final las tres definiciones que necesitamos de ella para cerrar esta etapa. NO incluyas ninguna sección de mejoras futuras, propuestas ni funcionalidades nuevas.

IDENTIDAD VISUAL (estricta):
- Color principal bordó/vino #5A1515 (títulos, bordes, acentos)
- Fondo crema #F5EDE0 solo para cajas destacadas
- Tipografía serif elegante para títulos (Playfair Display o similar de Google Fonts, con fallback serif), sans-serif limpia para el cuerpo
- Estética de distribuidora tradicional argentina, seria y prolija. Sin emojis infantiles, sin estética startup.

IMÁGENES: voy a guardar el HTML en la misma carpeta donde tengo 4 capturas del sitio. Referencialas EXACTAMENTE con estos nombres de archivo (src relativo, sin rutas):
- 1-portada-25-anios.png
- 2-direccion-horarios-mapa.png
- 3-catalogo-leyenda-precios.png
- 4-precios-mayorista-sin-impuestos.png
Cada imagen va enmarcada con borde fino color vino, ancho completo del contenido, con su epígrafe debajo.

ESTRUCTURA Y CONTENIDO (podés pulir la redacción, pero no inventes datos):

ENCABEZADO: "Catálogo Online — Correcciones aplicadas" / subtítulo "Santa María Distribuidora — Los Polvorines" / fecha "15 de julio de 2026".

INTRO (2 líneas): Todas las correcciones pedidas por la dirección ya están publicadas en el sitio. Abajo, cada una con su captura tomada del catálogo en vivo.

CORRECCIÓN 1 — Portada actualizada [imagen 1-portada-25-anios.png]
Epígrafe: La portada ya dice "Más de 25 años", y los destacados muestran la nueva dirección (Av. Sesquicentenario 2036) y los días de atención (lunes a sábado).

CORRECCIÓN 2 — Dirección y horarios nuevos [imagen 2-direccion-horarios-mapa.png]
Epígrafe: Av. Sesquicentenario 2036, Los Polvorines, en toda la página; horarios Lun–Vie 7 a 17 h, Sáb 7 a 15 h, feriados 7 a 13 h; el mapa apunta al local correcto (verificado).

CORRECCIÓN 3 — Aviso de precios [imagen 3-catalogo-leyenda-precios.png]
Epígrafe: El catálogo muestra la leyenda "Los precios pueden modificarse sin previo aviso", como se pidió.

CORRECCIÓN 4 — Precios transparentes [imagen 4-precios-mayorista-sin-impuestos.png]
Epígrafe: Cada producto muestra el precio minorista, el mayorista solo donde está cargado (se quitó el "a consultar" repetido), y el "Precio sin impuestos nacionales" que exige la normativa de transparencia.

SECCIÓN FINAL (caja destacada en crema con borde vino): "Para cerrar esta etapa — tres definiciones"
1. FOTOS QUE FALTAN (~100 de 1.106): son casi todas de marcas de distribuidoras locales que no tienen foto en internet (Silvina, Sol Pampeano, Par Nor, Delitap, entre otras). Opciones: pedirles el catálogo de imágenes a los preventistas, o sacarles foto en el local (el sistema las deja con fondo blanco automáticamente). El resto del catálogo ya está al 90% con foto verificada.
2. DOMINIO PROPIO: para imprimir el QR y difundir conviene una dirección propia. Opciones: santamariadist.com (disponible, USD 11,25 al año, coincide con el Instagram @santamaria_dist) o santamariadistribuidora.com.ar (vía NIC.ar). Falta elegir una.
3. VIDEO DE PORTADA: la página tiene un espacio para un video de fondo en la portada (del local o de productos) que se activa desde el panel. Falta definir si se usa y con qué video.

PIE DE PÁGINA: don-florencio.vercel.app — WhatsApp +54 9 11 5723-8769 — IG @santamaria_dist

REQUISITOS TÉCNICOS: un solo archivo HTML autocontenido (CSS en <style>), reglas @media print para A4 (márgenes prolijos, imágenes con break-inside: avoid, epígrafes pegados a su imagen), que se vea igual de bien en pantalla que impreso. Sin librerías externas ni imágenes remotas: las únicas imágenes son las 4 locales por nombre de archivo.
