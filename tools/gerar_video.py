"""Grava o traço do hero (assets/js/traco.js) num Edge headless:
- assets/video/traco-retrato.mp4 (720x1280, celular) e traco-largo.mp4 (1280x720, tablet deitado);
- assets/img/traco-*.webp: pôsteres (-ini = só o decalque, antes do vídeo; -fim = arte pronta, movimento reduzido).
O ciclo do shader fecha em papel limpo, então o vídeo não tem emenda.
Uso: python tools/gerar_video.py [--teste]   (--teste só grava quadros em _ref/hero/)"""
import functools, http.server, io, os, subprocess, sys, threading
from playwright.sync_api import sync_playwright
import imageio_ffmpeg
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
VID = os.path.join(SITE, 'assets', 'video'); IMG = os.path.join(SITE, 'assets', 'img')
CONF = os.path.join(SITE, '..', '_ref', 'hero')
FPS = 30
LARGO = '{cx: .725, cy: .655, alt: 1.2, gira: .05}'
RETRATO = '{cx: .56, cy: .385, alt: .74, gira: .04}'


class Mudo(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def servidor():
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 8899), functools.partial(Mudo, directory=SITE))
    threading.Thread(target=s.serve_forever, daemon=True).start()


def pagina(p, w, h, arte):
    b = p.chromium.launch(channel='msedge', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': w, 'height': h})
    pg.goto('http://127.0.0.1:8899/tools/branco.html')
    pg.evaluate(f"""async () => {{
        const c = document.createElement('canvas'); c.width = {w}; c.height = {h}; c.style.display = 'block';
        document.body.style.margin = 0; document.body.appendChild(c);
        await new Promise(ok => {{ const s = document.createElement('script'); s.src = '/assets/js/traco.js'; s.onload = ok; document.head.appendChild(s); }});
        window.S = tracoGL(c, {{mapa: '/assets/img/traco-lirio.webp', papel: '/assets/img/papel.webp', arte: {arte}, preserveDrawingBuffer: true}});
        await S.carregou;
    }}""")
    return b, pg


def quadro(pg, t):
    pg.evaluate(f'S.desenhar({t})')
    return pg.screenshot(type='png')


def gravar(p, w, h, arte, nome):
    b, pg = pagina(p, w, h, arte)
    ciclo = pg.evaluate('S.ciclo')
    Image.open(io.BytesIO(quadro(pg, 2.3))).convert('RGB').save(os.path.join(IMG, nome + '-ini.webp'), 'WEBP', quality=88)
    pg.evaluate('S.final()')
    Image.open(io.BytesIO(pg.screenshot(type='png'))).convert('RGB').save(os.path.join(IMG, nome + '-fim.webp'), 'WEBP', quality=88)
    mp4 = os.path.join(VID, nome + '.mp4')
    enc = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'png', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', mp4], stdin=subprocess.PIPE)
    q = round(ciclo * FPS)
    for i in range(q):
        enc.stdin.write(quadro(pg, i / FPS))
    enc.stdin.close(); enc.wait(); b.close()
    print(mp4, round(os.path.getsize(mp4) / 1e6, 2), 'MB', q, 'quadros')


def main():
    os.makedirs(VID, exist_ok=True); os.makedirs(CONF, exist_ok=True); servidor()
    with sync_playwright() as p:
        if '--teste' in sys.argv:
            for nome, w, h, arte in (('largo', 1600, 900, LARGO), ('ret', 540, 960, RETRATO)):
                b, pg = pagina(p, w, h, arte)
                for t in (2.3, 7, 12, 18):
                    open(os.path.join(CONF, f'{nome}-{t}.png'), 'wb').write(quadro(pg, t))
                b.close()
            return
        gravar(p, 720, 1280, RETRATO, 'traco-retrato')
        gravar(p, 1280, 720, LARGO, 'traco-largo')


if __name__ == '__main__':
    main()
