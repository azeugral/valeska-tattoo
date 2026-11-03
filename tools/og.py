"""og.jpg (1200x630) e apple-touch-icon.png, renderizados no Edge headless com as fontes do site.
Uso: python tools/og.py   (depois de gerar_video.py, que grava o pôster)"""
import base64, os
from playwright.sync_api import sync_playwright
AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
FONTES = '<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@500&family=Libre+Caslon+Display&display=swap" rel="stylesheet">'


def dados(rel):
    return 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(SITE, rel), 'rb').read()).decode()


OG = f'''<!doctype html>{FONTES}<body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;background:#e7edf2;color:#13202a">
<img src="{dados('assets/img/traco-largo-fim.webp')}" style="position:absolute;right:-90px;top:-10px;width:1200px">
<div style="position:absolute;left:72px;top:190px"><div style="font:400 158px/1 'Libre Caslon Display'">Valeska</div>
<div style="font:500 32px/1.3 'Albert Sans';margin-top:22px">Tatuagem fine line em Recife-PE</div></div></body>'''
IC = f'''<!doctype html>{FONTES}<body style="margin:0;width:180px;height:180px;background:#13293a;color:#dfe8ee;display:grid;place-items:center;font:400 128px/1 'Libre Caslon Display'">V</body>'''

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    pg = b.new_page(viewport={'width': 1200, 'height': 630}); pg.set_content(OG, wait_until='networkidle'); pg.evaluate('document.fonts.ready')
    pg.screenshot(path=os.path.join(SITE, 'og.jpg'), type='jpeg', quality=88)
    pg = b.new_page(viewport={'width': 180, 'height': 180}); pg.set_content(IC, wait_until='networkidle'); pg.evaluate('document.fonts.ready')
    pg.screenshot(path=os.path.join(SITE, 'apple-touch-icon.png'))
    b.close()
print('og ok')
