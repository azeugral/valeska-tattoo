# Valeska · Tatuagem fine line em Recife-PE

Site feito pelo LRGZ para a Valeska ([@valeskatattoo](https://instagram.com/valeskatattoo)), tatuadora de fine line.

Endereço: https://azeugral.github.io/valeska-tattoo/ (com `noindex` e `robots.txt` bloqueando tudo até a aprovação).

## Como está montado

- **Hero:** a arte é a tatuagem real "lírio, girassol e pássaro" (post 081, feita na Aurê). O traço foi extraído da foto (`tools/gerar_traco.py`) e virou um mapa de tinta + tempo de chegada + decalque. O shader (`assets/js/traco.js`) faz o que acontece na sessão: o decalque violeta assenta no papel, a tinta corre por cima, azul e molhada, e seca quase preta. O ciclo tem 26 s e fecha em papel limpo. No desktop roda ao vivo em WebGL2, em DPR real; no toque, ou em máquina sem aceleração, entra o MP4 do mesmo shader (`assets/video/traco-*.mp4`). Com movimento reduzido fica a arte pronta, parada.
- **Identidade:** papel `#e7edf2`, azul dos destaques dela (`#8fb0c9`, `#bcd3e2`, `#30536a`), fundo `#13293a`, tinta `#13202a` e o violeta do decalque `#6a5bdc`. Libre Caslon Display + Libre Caslon Text itálico + Albert Sans. Botões retos.
- **Seções:** sobre, trabalhos (42 em grade uniforme 4:5, com filtro), histórias reais das legendas (foto presa no desktop, lista no celular), como funciona (arte, decalque, traço e cuidados, com o reel da mesma tatuagem do hero), depois de curada, artes disponíveis, relatos, onde atendo, dúvidas e chamada final. Na chamada final, o ramo (post 089) se desenha conforme a rolagem.
- **Orçamento (`agendar.html`):** 4 etapas (tipo, corpo, história, você). O WhatsApp abre com o texto pronto (`wa.me/5581998734439?text=`); para a DM o texto é copiado. Atalhos: `?disp=01`, `?tipo=silhueta`.
- **Ampliação:** toque em qualquer trabalho abre a foto inteira de `assets/img/full/`. Toque duplo aproxima, deslizar troca, deslizar para baixo fecha.

## Ferramentas (`tools/`)

| Arquivo | Faz |
|---|---|
| `gerar_traco.py` | Extrai o traço das fotos e grava `traco-lirio.webp`, `traco-ramo.webp` e `papel.webp` |
| `gerar_video.py` | Grava os MP4 e os pôsteres do hero (`--teste` só grava quadros em `_ref/hero`) |
| `processar.py` | Recorta as fotos e os stories, tira os quadros do reel e o vídeo do traço (`--folha` monta `_ref/conf-recortes.jpg`) |
| `modelo.html`, `modelo-agendar.html` + `montar.py` | Monta `index.html` e `agendar.html` (editar os modelos, nunca os .html da raiz) |
| `og.py` | `og.jpg` e `apple-touch-icon.png` |

O material bruto (123 posts, 175 fotos, 12 reels, 39 itens de destaques, `legendas.txt`, folhas de contato) fica fora do repo, em `../_ref/`.

## CONFIRMAR antes de publicar de verdade

1. **Estúdio:** o site diz "Tatu Vikings, em Piedade, Recife-PE", de frente para o mar. Veio da localização de um post (dez/2025), do logo nas fotos de mai/2026 e das marcações de Piedade. Conferir nome, endereço e se ela atende só lá. Piedade fica em Jaboatão dos Guararapes; a bio dela diz Recife/PE.
2. **Nome completo:** só temos "Valeska". Não há logo no perfil, então a marca no topo é o nome em Libre Caslon.
3. **Clientes citados:** Raquel, Charles, Fê, Polly, Márcio, Aurê e a @julisa.hair aparecem com o nome das legendas. Pedir autorização, principalmente nas histórias de luto e no acidente da Polly.
4. **Relatos:** transcritos dos stories de Feedbacks. Só um tem autor identificado; os outros estão como "Cliente".
5. **"Depois de curada":** o texto diz que as fotos são sem filtro. Confirmar com ela.
6. **Cuidados e ajustes:** "se precisar de ajuste, a gente faz" vem do caso da Polly, não de uma regra dela. Confirmar se o retoque é regra e se tem prazo ou custo. Também não há nada sobre sinal, preço ou idade mínima.
7. **Artes disponíveis:** vêm do destaque, em 480 px. Conferir quais ainda estão livres e pedir os arquivos em alta. "Flash exclusivo, tatuado uma vez só" está no destaque.
8. **Primeira máquina em 2022:** o primeiro post dela é de set/2022. Confirmar o ano e a frase do Sobre, que está em primeira pessoa com base nesse post.
9. **Workshop:** o destaque mostra um certificado de mini realismo. Ficou fora do site até ela dizer como quer citar.
