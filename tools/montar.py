"""Monta index.html e agendar.html a partir de tools/modelo.html, tools/modelo-agendar.html e das listas de tools/processar.py.
Uso: python tools/montar.py   (editar os modelos, nunca os .html da raiz)"""
import base64, html, io, os, re, sys
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import processar as P

CAT = {'floral': 'Floral', 'homenagem': 'Homenagem', 'figura': 'Figura', 'escrita': 'Escrita', 'mini': 'Mini'}

HIST = [
    ('Raquel', 'O bilhete do avô', 'Entre as páginas da Bíblia do avô, a Raquel encontrou um recado assinado por ele: "Eu e Tereza saímos para comprar fósforos, voltaremos há pouquinho." Ele partiu em novembro, e a letra dele foi a primeira tatuagem dela.'),
    ('Charles', 'O pezinho da Aurora', 'O Charles levou no braço o pezinho da filha. Filhos crescem, os momentos passam, e esse tamanho de pé ficou guardado do jeito que era.'),
    ('Fê', 'A tela em branco', 'A Fê quis um cavalete com a tela vazia, esperando o dia em que tiver um sobrinho para pintar nela. Uma tatuagem de memória futura.'),
    ('Polly', 'A cicatriz que virou Medusa', 'Depois de um acidente doméstico, a Polly decidiu ressignificar a cicatriz. Criamos a Medusa do jeito que ela queria e, seis meses depois, com 95% da cicatrização, fizemos os ajustes finais.'),
    ('Cliente', 'Quema', 'Uma música da Ainoa Buitrago virou arte exclusiva, com a letra da própria cliente. A cantora viu a tatuagem e respondeu: "Tía, que chulo!"'),
    ('Márcio', 'O pincel, aos 49', 'O Márcio é artista plástico e fez a primeira tatuagem aos 49 anos: um pincel, a coisa que mais significa para ele.'),
]


def a(s):
    return html.escape(s, quote=True)


def img(src_p, src_g, alt, w, h, sizes):
    return (f'<img src="{src_p}" srcset="{src_p} {w}w, {src_g} {w * 2}w" sizes="{sizes}" alt="{a(alt)}" '
            f'width="{w}" height="{h}" loading="lazy" decoding="async" draggable="false">')


def obras():
    li = []
    for i, (_c, _k, cat, leg, _d) in enumerate(P.OBRAS):
        n = f'{i + 1:02d}'
        li.append(f'''    <li class="obra" data-cat="{cat}"><button class="obra-btn" data-g="assets/img/full/obras-{n}.webp" data-leg="{a(leg)}" data-det="{CAT[cat]}" aria-label="Ampliar: {a(leg)}">
      <span class="obra-img">{img(f"assets/img/obras/{n}-p.webp", f"assets/img/obras/{n}.webp", leg, 480, 600, "(max-width: 700px) 46vw, (max-width: 1100px) 33vw, 25vw")}</span>
      <span class="obra-leg"><b>{a(leg)}</b><small>{CAT[cat]}</small></span></button></li>''')
    return '\n'.join(li)


def hist_palco():
    return '\n'.join(f'      <img class="hp{" ativo" if i == 0 else ""}" src="assets/img/hist/{i + 1}.webp" alt="" width="1080" height="1350" loading="{"eager" if i == 0 else "lazy"}" decoding="async">' for i in range(len(HIST)))


def hist():
    out = []
    for i, (quem, tit, txt) in enumerate(HIST):
        foto = img(f'assets/img/hist/{i + 1}-p.webp', f'assets/img/hist/{i + 1}.webp', tit, 540, 675, '100vw')
        out.append(f'''      <article class="hist{" mob-fora" if i > 2 else ""}" data-i="{i}"><figure class="hist-foto">{foto}</figure><div class="hist-txt"><p class="hist-quem">{a(quem)}</p><h3>{a(tit)}</h3><p>{a(txt)}</p></div></article>''')
    return '\n'.join(out)


def cur():
    alts = ['Flor no pescoço, curada', 'Silhueta no antebraço, curada', 'Traço abstrato na costela, curado', 'Carpas nos punhos, curadas']
    return '\n'.join(f'    <li class="revela"><img src="assets/img/cur-{i + 1}.webp" alt="{a(t)}" width="640" height="800" loading="lazy" decoding="async" draggable="false"></li>' for i, t in enumerate(alts))


def disp():
    out = []
    for i, d in enumerate(P.DISP):
        n = f'{i + 1:02d}'; tit, det = d[1], d[2]
        out.append(f'''    <li class="dsp"><button class="dsp-quadro" data-g="assets/img/full/disp-{n}.webp" data-leg="{a(tit)}" data-det="{a(det)}" aria-label="Ampliar: {a(tit)}"><img src="assets/img/disp/{n}.webp" alt="{a(tit)}" width="640" height="800" loading="lazy" decoding="async" draggable="false"></button>
      <div class="dsp-txt"><div><h3>{a(tit)}</h3><p>{a(det)}</p></div><a href="agendar.html?disp={n}">Quero esta</a></div></li>''')
    return '\n'.join(out)


def opcoes_disp():
    return '\n'.join(f'            <label><input type="radio" name="desenho" value="{a(d[1])}" data-id="{i + 1:02d}"><img src="assets/img/disp/{i + 1:02d}.webp" alt="" width="640" height="800" loading="lazy"><span>{a(d[1])}</span></label>' for i, d in enumerate(P.DISP))


def previa(cam):
    """Foto em 20x25, embutida no HTML: ocupa o lugar da imagem enquanto ela baixa."""
    im = Image.open(os.path.join(SITE, cam)).convert('RGB'); k = 25 / max(im.size)
    b = io.BytesIO(); im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS).save(b, 'WEBP', quality=45)
    return base64.b64encode(b.getvalue()).decode()


def com_previas(h):
    def troca(c):
        return f'<img style="background:url(data:image/webp;base64,{previa(c.group(2))}) center/cover" {c.group(1)}src="{c.group(2)}"'
    return re.sub(r'<img ((?:(?!class="hero-poster")[^>])*?)src="(assets/img/[^"]+\.webp)"', troca, h)


def main():
    m = open(os.path.join(AQUI, 'modelo.html'), encoding='utf-8').read()
    for k, f in (('OBRAS', obras), ('HIST_PALCO', hist_palco), ('HIST', hist), ('CUR', cur), ('DISP', disp)):
        m = m.replace('{{' + k + '}}', f())
    open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8', newline='\n').write(com_previas(m))
    g = open(os.path.join(AQUI, 'modelo-agendar.html'), encoding='utf-8').read().replace('{{OPC_DISP}}', opcoes_disp())
    open(os.path.join(SITE, 'agendar.html'), 'w', encoding='utf-8', newline='\n').write(com_previas(g))
    print('html ok')


if __name__ == '__main__':
    main()
