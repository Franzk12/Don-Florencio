#!/usr/bin/env python3
"""
EXPORTAR FOTOS A ESTÁTICO (Plan B de fotos) — Santa María
-----------------------------------------------------------------------------
Baja las fotos base64 de Firestore (SOLO LECTURA, no toca la base) y las guarda
optimizadas en WebP en `fotos-web/<id>.webp`. Esos archivos los sirve Vercel
gratis por CDN, sin lecturas de Firestore.

Cuándo re-correrlo: cada vez que se suban/cambien fotos en el admin, para que
el Plan B tenga las nuevas. Es idempotente (saltea las que ya existen); para
regenerar una cambiada, borrá su .webp y volvé a correr.

Uso:
    uv run --with pillow python herramientas/exportar-fotos-web.py

Para ACTIVAR el Plan B en el sitio: en index.html, poner FOTOS_ESTATICAS = true
(o abrir la web con ?fotos=static para probar). Con Plan B, cada foto que ya
esté exportada se carga del CDN (0 lecturas); las que falten caen a Firestore.
"""
import json, urllib.request, base64, io, os, concurrent.futures, threading
from PIL import Image

K = "AIzaSyD4lNN8u42F-Y9zH81NiIILWD9PHUQrHGA"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "fotos-web")
os.makedirs(OUT, exist_ok=True)

arr = json.loads(json.load(urllib.request.urlopen(
    f"https://firestore.googleapis.com/v1/projects/don-florencio/databases/(default)/documents/config/catalogo?key={K}"
))['fields']['productos']['stringValue'])
ids = [p['id'] for p in arr if p.get('tieneFoto')]
print(f"productos con foto: {len(ids)}")

lock = threading.Lock()
done = {'ok': 0, 'skip': 0, 'err': 0}

def procesar(pid):
    dest = os.path.join(OUT, pid + ".webp")
    if os.path.exists(dest):
        with lock: done['skip'] += 1
        return
    try:
        u = f"https://firestore.googleapis.com/v1/projects/don-florencio/databases/(default)/documents/productos/{pid}?mask.fieldPaths=fotoUrl&key={K}"
        d = json.load(urllib.request.urlopen(u, timeout=30))
        s = d.get('fields', {}).get('fotoUrl', {}).get('stringValue', '')
        if not s:
            with lock: done['err'] += 1
            return
        if ',' in s and s.strip().startswith('data:'):
            s = s.split(',', 1)[1]
        raw = base64.b64decode(s)
        im = Image.open(io.BytesIO(raw)).convert('RGB')
        if im.width > 700:
            im = im.resize((700, round(im.height * 700 / im.width)), Image.LANCZOS)
        im.save(dest, 'WEBP', quality=80, method=6)
        with lock:
            done['ok'] += 1
            if done['ok'] % 100 == 0: print(f"  ...{done['ok']} exportadas")
    except Exception:
        with lock: done['err'] += 1

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    list(ex.map(procesar, ids))

print(f"\nHECHO: {done['ok']} nuevas · {done['skip']} ya estaban · {done['err']} errores")
tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f"archivos: {len(os.listdir(OUT))} · peso total: {tot//1024//1024} MB")
