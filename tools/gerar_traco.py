"""Extrai o traço real de duas tatuagens da Valeska (fotos do Instagram em _ref/ig) e grava os mapas do shader:
R = tinta, G = momento em que a tinta chega (0..1, caminho geodésico a partir da raiz), B = decalque (só os contornos).
Também gera assets/img/papel.webp (grão de papel de algodão, como os fundos dos stories dela).
Uso: python tools/gerar_traco.py"""
import os
import cv2, numpy as np
from skimage.graph import MCP_Geometric
from skimage.morphology import skeletonize

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
REF = os.path.join(SITE, '..', '_ref'); IMG = os.path.join(SITE, 'assets', 'img')

# nome: post, polígono em volta da tatuagem (coordenadas numa altura de 900), raiz, limiares
ARTES = {
    'lirio': ('081_0', [(150, 128), (262, 106), (350, 170), (372, 232), (414, 258), (420, 330), (410, 398), (424, 420), (402, 470), (398, 520),
                        (352, 602), (306, 650), (268, 668), (266, 764), (136, 778), (130, 730), (186, 690), (154, 684), (120, 640), (104, 566),
                        (112, 480), (118, 380), (128, 300), (108, 236)], (208, 748), 15),
    'ramo': ('089_3', [(180, 220), (250, 130), (480, 130), (590, 240), (600, 470), (570, 730), (400, 810), (340, 800), (290, 590), (215, 420)], (366, 782), 16),
}


def tinta(g, lim):
    h = g.shape[0]; k = int(h / 70) | 1
    bh = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    bh = cv2.GaussianBlur(bh, (0, 0), .9)
    return np.clip((bh.astype(np.float32) - lim) / 44, 0, 1) ** .85


def mapa(nome, post, poli, raiz, lim):
    im = cv2.imread(os.path.join(REF, 'ig', post + '.jpg')); h0 = im.shape[0]; e = h0 / 900
    g = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)[:, :, 0]
    v = tinta(g, lim)
    pts = (np.array(poli, np.float32) * e).astype(np.int32)
    m = np.zeros(g.shape, np.uint8); cv2.fillPoly(m, [pts], 255)
    m = cv2.GaussianBlur(m, (0, 0), 6).astype(np.float32) / 255
    v *= m
    # só o que está ligado ao desenho: limpa poros e sardas
    b = (v > .35).astype(np.uint8)
    b2 = cv2.dilate(b, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(b2, connectivity=8)
    keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 90
    v *= cv2.GaussianBlur(keep[lab].astype(np.float32), (0, 0), 1.2)
    ys, xs = np.where(v > .3); M = 40
    x0, x1, y0, y1 = max(xs.min() - M, 0), min(xs.max() + M, v.shape[1]), max(ys.min() - M, 0), min(ys.max() + M, v.shape[0])
    v = v[y0:y1, x0:x1]; H, W = v.shape
    # tempo de chegada: caminho mais curto pelas linhas, com pulo caro entre traços
    p = 3
    pq = cv2.resize(v, (W // p, H // p), interpolation=cv2.INTER_AREA)
    custo = 1 + 26 * (1 - np.clip(pq * 2.2, 0, 1))
    rx, ry = int((raiz[0] * e - x0) / p), int((raiz[1] * e - y0) / p)
    rx, ry = min(max(rx, 0), pq.shape[1] - 1), min(max(ry, 0), pq.shape[0] - 1)
    d, _ = MCP_Geometric(custo).find_costs([(ry, rx)])
    d = np.nan_to_num(d, posinf=d[np.isfinite(d)].max())
    # distribui o tempo pela quantidade de tinta, para o traço não acelerar nem parar
    linhas = d[pq > .3]; c = np.quantile(linhas, np.linspace(0, 1, 256))
    u = np.interp(d, c, np.linspace(0, 1, 256)); t = .55 * u + .45 * np.clip(d / c[-1], 0, 1)
    t = cv2.GaussianBlur(cv2.resize(t.astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC), (0, 0), 1.6)
    # decalque: contornos, sem pontilhado nem sombra
    sk = skeletonize(cv2.morphologyEx((v > .42).astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)) > 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(sk, connectivity=8)
    keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 60
    dec = cv2.GaussianBlur(cv2.dilate(keep[lab].astype(np.uint8) * 255, np.ones((3, 3), np.uint8)), (0, 0), .9)
    # BGR no imwrite: R tinta, G chegada, B decalque
    saida = np.dstack([dec, np.clip(t * 255, 0, 255).astype(np.uint8), np.clip(v * 255, 0, 255).astype(np.uint8)])
    arq = os.path.join(IMG, f'traco-{nome}.webp')
    cv2.imwrite(arq, saida, [cv2.IMWRITE_WEBP_QUALITY, 101])
    print(nome, W, H, round(os.path.getsize(arq) / 1e6, 2), 'MB')


def papel(w=1600, h=1000):
    rng = np.random.default_rng(81)
    fibra = sum(cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), s) * a for s, a in ((.7, 1.6), (1.6, 2.2), (5, 6)))
    fibra /= fibra.std()
    nuvem = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 140); nuvem /= nuvem.std()
    cv2.imwrite(os.path.join(IMG, 'papel.webp'), np.clip((1 + .0085 * fibra + .007 * nuvem) * 232, 0, 255).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 82])


if __name__ == '__main__':
    for n, a in ARTES.items():
        mapa(n, *a)
    papel()
