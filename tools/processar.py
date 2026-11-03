"""Gera as imagens do site a partir de _ref (posts em ig/NNN_k.jpg, destaques em hl/, reels em videos/).
Uso: python tools/processar.py        (--folha só monta _ref/conf-recortes.jpg para conferir os recortes)"""
import os, subprocess, sys
import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageOps, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
R = os.path.join(SITE, '..', '_ref'); A = os.path.join(SITE, 'assets', 'img'); V = os.path.join(SITE, 'assets', 'video')

# Trabalhos: (post, foto, categoria, legenda, desvio vertical do recorte 0..1)
OBRAS = [
    ('081', 0, 'floral', 'Lírio, girassol e pássaro', .32),
    ('014', 0, 'figura', 'Onça com flores', .5),
    ('008', 0, 'homenagem', 'Silhueta com o melhor amigo', .45),
    ('089', 0, 'floral', 'Ramo no ombro', .4),
    ('003', 4, 'homenagem', 'O pezinho da Aurora', .5),
    ('091', 0, 'floral', 'Peônia no pescoço', .5),
    ('042', 0, 'figura', 'Gato samurai', .4),
    ('098', 0, 'escrita', 'Tudo passa', .35),
    ('036', 3, 'homenagem', 'Avós e neto', .55),
    ('049', 0, 'floral', 'Borboleta com floral', .45),
    ('024', 0, 'figura', 'Medusa', .4),
    ('016', 2, 'floral', 'Raminho da Mariana', .4),
    ('010', 4, 'mini', 'Gatinhos', .55),
    ('006', 0, 'homenagem', 'A mãozinha da Mainha', .45),
    ('094', 0, 'floral', 'Borboleta e rosas', .45),
    ('030', 0, 'homenagem', 'Silhueta de foto', .45),
    ('032', 0, 'floral', 'Rosas na perna', .42),
    ('111', 0, 'escrita', 'Feita de sonhos, cicatrizes e recomeços', .45),
    ('095', 0, 'figura', 'Onça mimosa', .55),
    ('018', 0, 'floral', 'Coração e Provérbios 4:23', .45),
    ('010', 6, 'mini', 'Onigiri', .5),
    ('077', 0, 'homenagem', 'Primeiras pegadas', .5),
    ('086', 0, 'floral', 'Floral no antebraço', .4),
    ('015', 0, 'figura', 'Rosa dos ventos', .4),
    ('033', 0, 'escrita', 'Seja forte e corajosa', .55),
    ('084', 0, 'figura', 'Leoa nas costas', .35),
    ('079', 0, 'floral', 'Floresça onde Deus te plantar', .35),
    ('011', 0, 'homenagem', 'Coração de digitais', .55),
    ('010', 9, 'mini', 'Carpa', .5),
    ('087', 0, 'figura', 'Aparecida e São Francisco', .45),
    ('044', 0, 'floral', 'Lírio nas costas', .4),
    ('046', 0, 'homenagem', 'Alícia', .45),
    ('040', 0, 'escrita', 'One day at a time', .5),
    ('102', 0, 'floral', 'Beija-flor', .45),
    ('010', 5, 'mini', 'Om', .5),
    ('066', 0, 'figura', 'Dança de cinema', .4),
    ('063', 0, 'homenagem', 'Danny e o pequeno Daniel', .5),
    ('048', 0, 'figura', 'Rick e Morty', .45),
    ('010', 8, 'mini', 'Âncora', .55),
    ('101', 0, 'escrita', 'Projetinho da Nanda', .4),
    ('105', 0, 'floral', 'Resiliência', .4),
    ('072', 0, 'mini', 'Lua e estrelas', .4),
]

# Histórias: (post, foto, dy)
HIST = [('050', 0, .55), ('003', 4, .5), ('061', 0, .5), ('024', 0, .35), ('076', 0, .55), ('097', 0, .5)]

# Curadas (destaque, x, y, largura): recortes 4:5 fora das etiquetas dos stories
CUR = [('curadas_02', 0, 70, 480), ('curadas_03', 0, 70, 480), ('curadas_06', 0, 60, 480), ('curadas_05', 0, 215, 326)]

# Disponíveis: (destaque, título, detalhe, x, y, largura)
DISP = [
    ('disp_07', 'Peônia', 'Antebraço', 0, 90, 480),
    ('disp_09', 'Floral com folhas', 'Antebraço', 0, 110, 480),
    ('disp_10', 'Flores de cerejeira', 'Antebraço', 0, 110, 480),
    ('disp_03', 'Floral nas costas', 'Costas', 0, 140, 480),
    ('disp_08', 'Mandala com florais', 'Braço inteiro', 0, 60, 480),
    ('disp_00', 'Mariposa, libélula e abelha', 'Pequenas', 0, 20, 480),
    ('disp_01', 'Viagem', 'Mapa, avião e câmera', 0, 20, 480),
    ('disp_02', 'Selos de Pernambuco', 'Carnaval, 081', 0, 30, 480),
]

SOBRE = ('001', 0, .3)
ESTUDIO = ('027', 0, .45)
# Processo: quadros do reel 081, a mesma tatuagem do hero (segundo)
PROC = [('arte', 1.0), ('decalque', 2.2), ('pronta', 12.0)]


def post(cod, k):
    return os.path.join(R, 'ig', f'{cod}_{k}.jpg')


def recortar(src, w, h, dy=.5):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    return ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(.5, dy))


def salvar(im, nome, q=82):
    p = os.path.join(A, nome); os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p, 'WEBP', quality=q, method=6)


def cheia(src, nome, lado=1800):
    """Foto inteira, sem recorte, para a ampliação."""
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    if max(im.size) > lado:
        k = lado / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    salvar(im, f'full/{nome}.webp', 84)


def par(src, pasta, n, w, h, dy):
    big = recortar(src, w, h, dy); salvar(big, f'{pasta}/{n}.webp')
    salvar(big.resize((w // 2, h // 2), Image.LANCZOS), f'{pasta}/{n}-p.webp')


def story(nome, x, y, l):
    """Recorte 4:5 de um story (480x853), ampliado com leve nitidez."""
    im = Image.open(os.path.join(R, 'hl', nome + '.jpg')).convert('RGB').crop((x, y, x + l, y + round(l * 1.25)))
    return im.resize((640, 800), Image.LANCZOS)


def quadro(video, seg):
    c = cv2.VideoCapture(os.path.join(R, 'videos', video)); c.set(1, int(seg * c.get(5))); ok, f = c.read()
    return Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))


def ramo_claro():
    """O ramo do mapa, parado, na cor do rodapé: para o toque e para movimento reduzido."""
    m = cv2.imread(os.path.join(A, 'traco-ramo.webp'))
    tinta = m[:, :, 2].astype(np.float32) / 255
    a = np.clip((tinta - .1) / .8, 0, 1) * 255
    rgba = np.dstack([np.full(a.shape, 207), np.full(a.shape, 224), np.full(a.shape, 235), a]).astype(np.uint8)
    salvar(Image.fromarray(rgba, 'RGBA'), 'ramo-claro.webp', 80)


def main():
    if '--folha' in sys.argv:
        ims = [recortar(post(c, k), 200, 250, dy) for c, k, _cat, _l, dy in OBRAS]
        ims += [recortar(post(c, k), 200, 250, dy) for c, k, dy in HIST]
        ims += [story(*c).resize((200, 250)) for c in CUR]
        ims += [story(d[0], *d[3:]).resize((200, 250)) for d in DISP]
        ims += [ImageOps.fit(quadro('081.mp4', s), (200, 250), centering=(.5, .4)) for _n, s in PROC]
        col = 10; lin = (len(ims) + col - 1) // col
        f = Image.new('RGB', (col * 204, lin * 254), 'white'); d = ImageDraw.Draw(f)
        for i, im in enumerate(ims):
            f.paste(im, ((i % col) * 204, (i // col) * 254)); d.text(((i % col) * 204 + 4, (i // col) * 254 + 4), str(i), fill='yellow')
        f.save(os.path.join(R, 'conf-recortes.jpg'), quality=82); return

    for i, (c, k, _cat, _l, dy) in enumerate(OBRAS):
        par(post(c, k), 'obras', f'{i + 1:02d}', 960, 1200, dy); cheia(post(c, k), f'obras-{i + 1:02d}')
    for i, (c, k, dy) in enumerate(HIST):
        par(post(c, k), 'hist', f'{i + 1}', 1080, 1350, dy); cheia(post(c, k), f'hist-{i + 1}')
    for i, c in enumerate(CUR):
        salvar(story(*c), f'cur-{i + 1}.webp', 84)
    for i, d in enumerate(DISP):
        im = story(d[0], *d[3:]); salvar(im, f'disp/{i + 1:02d}.webp', 84)
        salvar(Image.open(os.path.join(R, 'hl', d[0] + '.jpg')).convert('RGB'), f'full/disp-{i + 1:02d}.webp', 84)
    salvar(recortar(post(*SOBRE[:2]), 1080, 1350, SOBRE[2]), 'sobre.webp')
    salvar(recortar(post(*ESTUDIO[:2]), 1080, 1350, ESTUDIO[2]), 'estudio.webp')
    for nome, s in PROC:
        salvar(ImageOps.fit(quadro('081.mp4', s), (720, 900), Image.LANCZOS, centering=(.5, .4)), f'proc-{nome}.webp', 84)
    salvar(ImageOps.fit(quadro('081.mp4', 7.0), (720, 900), Image.LANCZOS, centering=(.5, .4)), 'proc-traco.webp', 80)
    # o traço em movimento, mudo, do mesmo reel
    os.makedirs(V, exist_ok=True)
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-ss', '6.2', '-t', '3.6', '-i', os.path.join(R, 'videos', '081.mp4'),
                    '-vf', 'crop=720:900:0:150', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(V, 'traco-agulha.mp4')], check=True)
    ramo_claro()
    print('imagens ok')


if __name__ == '__main__':
    main()
