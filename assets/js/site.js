/* Valeska: topo, menu, hero (shader no desktop, MP4 no toque), histórias, processo, ramo do fim, trabalhos e ampliação. */
(function () {
  var doc = document, body = doc.body;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q = function (s, el) { return (el || doc).querySelector(s); };
  var qa = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var largoFino = window.matchMedia('(min-width: 1025px) and (pointer: fine)').matches;

  /* topo e menu */
  var topo = q('#topo'), nav = q('#nav'), menu = q('#menu-btn');
  function rolou() { topo.classList.toggle('rolou', window.scrollY > 40); }
  window.addEventListener('scroll', rolou, { passive: true }); rolou();
  function fecharMenu() { nav.classList.remove('aberto'); topo.classList.remove('menu-aberto'); menu.setAttribute('aria-expanded', 'false'); body.style.overflow = ''; }
  menu.addEventListener('click', function () {
    var abre = !nav.classList.contains('aberto');
    nav.classList.toggle('aberto', abre); topo.classList.toggle('menu-aberto', abre);
    menu.setAttribute('aria-expanded', abre ? 'true' : 'false'); body.style.overflow = abre ? 'hidden' : '';
  });
  qa('a', nav).forEach(function (a) { a.addEventListener('click', fecharMenu); });

  /* hero: texto em camadas; traço ao vivo no desktop, MP4 do mesmo shader no toque */
  var palcoH = q('.hero-palco'), cv = q('#traco'), poster = q('.hero-poster');
  var retrato = window.innerHeight > window.innerWidth;
  var LARGO = { cx: .725, cy: .655, alt: 1.2, gira: .05 };
  function pronto() { requestAnimationFrame(function () { body.classList.add('pronto'); }); }
  if (retrato) poster.src = poster.getAttribute(reduz ? 'data-ret-fim' : 'data-ret-ini');
  else if (reduz) poster.src = poster.getAttribute('data-lar-fim');
  if (poster.complete) pronto(); else { poster.addEventListener('load', pronto); poster.addEventListener('error', pronto); setTimeout(pronto, 1600); }

  function heroVideo() {
    var v = doc.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.src = retrato ? 'assets/video/traco-retrato.mp4' : 'assets/video/traco-largo.mp4';
    v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true });
    v.addEventListener('loadedmetadata', function () { v.currentTime = 2.2; }, { once: true });
    palcoH.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  function medidor(c, alvo, dprMax) {
    var esc = Math.min(window.devicePixelRatio || 1, dprMax);
    function medir() { var r = alvo.getBoundingClientRect(); c.width = Math.round(r.width * esc); c.height = Math.round(r.height * esc); }
    medir(); return medir;
  }

  function heroGL() {
    var S = null;
    try { S = window.tracoGL(cv, { mapa: 'assets/img/traco-lirio.webp', papel: 'assets/img/papel.webp', arte: LARGO }); } catch (e) { S = null; }
    if (!S) { cv.remove(); poster.src = poster.getAttribute('data-lar-fim'); return; }
    var medir = medidor(cv, palcoH, 2), t0 = 0, vivo = true, visivel = true, raf = 0, rodando = false, ult = 0, soma = 0, n = 0;
    function laco(agora) {
      if (!vivo || !visivel) { rodando = false; return; }
      /* máquina sem aceleração: desiste do shader e usa o vídeo */
      if (ult && n < 40) { soma += agora - ult; if (++n === 40 && soma / 40 > 60) { vivo = false; cv.remove(); heroVideo(); return; } }
      ult = agora; S.desenhar((agora - t0) / 1000); raf = requestAnimationFrame(laco);
    }
    function liga() { if (!rodando) { rodando = true; ult = 0; raf = requestAnimationFrame(laco); } }
    S.carregou.then(function () {
      t0 = performance.now() - 2200; S.desenhar(2.2); cv.classList.add('on'); liga();
      new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel) liga(); }).observe(palcoH);
    });
    window.addEventListener('resize', medir);
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); vivo = false; cancelAnimationFrame(raf); cv.remove(); poster.src = poster.getAttribute('data-lar-fim'); });
  }
  if (reduz) cv.remove();
  else if (largoFino && window.tracoGL) heroGL();
  else { cv.remove(); heroVideo(); }

  /* revelar ao rolar */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  qa('.entra, .revela').forEach(function (el) { if (io && !reduz) io.observe(el); else el.classList.add('vis'); });

  /* histórias: a do meio da tela define a foto do palco */
  var hists = qa('.hist'), hps = qa('.hp');
  function ativa(i) { hists.forEach(function (h, k) { h.classList.toggle('ativo', k === i); }); hps.forEach(function (h, k) { h.classList.toggle('ativo', k === i); }); }
  ativa(0);
  if (window.matchMedia('(min-width: 901px)').matches && 'IntersectionObserver' in window) {
    var ioH = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) ativa(+e.target.getAttribute('data-i')); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    hists.forEach(function (h) { ioH.observe(h); });
  }
  var histMais = q('#hist-mais');
  histMais.addEventListener('click', function () { q('.hist-lista').classList.add('todas'); histMais.parentNode.hidden = true; });

  /* processo: o vídeo do traço só toca quando aparece */
  qa('.passos video').forEach(function (v) {
    if (reduz) return;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!v.getAttribute('src')) v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    }, { threshold: .2 }).observe(v);
  });

  /* dúvidas: uma aberta por vez, com a altura da maior resposta já reservada */
  var faq = q('.faq'), perg = qa('details', faq), largFaq = 0;
  function reservaFaq() {
    var abertas = perg.filter(function (d) { return d.open; }), alto = 0;
    faq.style.minHeight = '';
    perg.forEach(function (d) { perg.forEach(function (o) { o.open = o === d; }); alto = Math.max(alto, faq.offsetHeight); });
    perg.forEach(function (o) { o.open = abertas.indexOf(o) >= 0; });
    faq.style.minHeight = alto + 'px'; largFaq = window.innerWidth;
  }
  perg.forEach(function (d) {
    q('summary', d).addEventListener('click', function (e) {
      e.preventDefault(); var abre = !d.open;
      perg.forEach(function (o) { o.open = abre && o === d; });
    });
  });
  reservaFaq();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(reservaFaq);
  window.addEventListener('resize', function () { if (window.innerWidth !== largFaq) reservaFaq(); });

  /* fim da página: o ramo se desenha com a rolagem */
  var cvR = q('#ramo'), fim = q('.final');
  if (reduz || !largoFino || !window.tracoGL) cvR.remove();
  else {
    var R = null;
    try { R = window.tracoGL(cvR, { mapa: 'assets/img/traco-ramo.webp', transparente: true, arte: { cx: .84, cy: .56, alt: 1.08, gira: .1 }, cores: { tinta: [.74, .83, .89], molhada: [.97, .98, 1], dec: [.5, .5, .9] } }); } catch (e) { R = null; }
    if (!R) cvR.remove();
    else R.carregou.then(function () {
      fim.classList.add('gl'); cvR.classList.add('on');
      var medirR = medidor(cvR, fim, 2), ag = 0;
      function pinta() {
        ag = 0;
        var r = fim.getBoundingClientRect(), H = window.innerHeight;
        R.desenharP(Math.max(0, Math.min(1, (H - r.top) / (r.height * .92))));
      }
      function pede() { if (!ag) ag = requestAnimationFrame(pinta); }
      window.addEventListener('scroll', pede, { passive: true });
      window.addEventListener('resize', function () { medirR(); pede(); });
      pinta();
    });
  }

  /* ampliação: foto inteira (assets/img/full), título e detalhes; toque duplo aproxima, arrastar move, deslizar troca */
  var lb = q('#lb'), palco = q('#lb-palco'), lbImg = q('#lb-img'), lista = [], idx = 0, focoAntes = null;
  var z = 1, tx = 0, ty = 0;
  function aplicaZoom(anima) {
    lbImg.style.transition = anima ? 'transform .35s cubic-bezier(.16,.84,.32,1)' : 'none';
    lbImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + z + ')';
    lb.classList.toggle('zoom', z > 1);
  }
  function limita() {
    var w = lbImg.offsetWidth, h = lbImg.offsetHeight, W = palco.clientWidth, H = palco.clientHeight;
    var mx = Math.max(0, (w * z - W) / 2), my = Math.max(0, (h * z - H) / 2);
    tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
  }
  function zoomEm(cx, cy) {
    if (z > 1) { z = 1; tx = ty = 0; aplicaZoom(true); return; }
    var r = lbImg.getBoundingClientRect();
    var px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
    z = Math.min(3, Math.max(2.2, lbImg.naturalWidth / r.width));
    tx = -px * (z - 1); ty = -py * (z - 1); limita(); aplicaZoom(true);
  }
  function mostrar() {
    var it = lista[idx];
    z = 1; tx = ty = 0; aplicaZoom(false);
    lb.classList.add('carregando');
    lbImg.onload = function () { lb.classList.remove('carregando'); };
    lbImg.src = it.g; lbImg.alt = it.leg || '';
    q('#lb-leg').textContent = it.leg || ''; q('#lb-det').textContent = it.det || '';
    var multi = lista.length > 1;
    q('#lb-ant').hidden = !multi; q('#lb-prox').hidden = !multi;
    q('#lb-cont').textContent = multi ? (idx + 1) + ' / ' + lista.length : '';
    if (multi) { var pre = new Image(); pre.src = lista[(idx + 1) % lista.length].g; }
  }
  function abrirLB(l, i) { lista = l; idx = Math.max(0, i); focoAntes = doc.activeElement; mostrar(); lb.hidden = false; body.style.overflow = 'hidden'; q('#lb-fechar').focus({ preventScroll: true }); }
  function fecharLB() { lb.hidden = true; lbImg.removeAttribute('src'); body.style.overflow = ''; if (focoAntes) focoAntes.focus({ preventScroll: true }); }
  function passo(d) { if (lista.length < 2) return; idx = (idx + d + lista.length) % lista.length; mostrar(); }
  q('#lb-fechar').addEventListener('click', fecharLB);
  q('#lb-ant').addEventListener('click', function () { passo(-1); });
  q('#lb-prox').addEventListener('click', function () { passo(1); });
  doc.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') fecharLB(); else if (e.key === 'ArrowLeft') passo(-1); else if (e.key === 'ArrowRight') passo(1);
  });
  var ptr = null, ultimoToque = 0;
  palco.addEventListener('pointerdown', function (e) {
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: tx, ty: ty, moveu: false };
    try { palco.setPointerCapture(e.pointerId); } catch (er) {}
  });
  palco.addEventListener('pointermove', function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) ptr.moveu = true;
    if (z > 1) { tx = ptr.tx + dx; ty = ptr.ty + dy; limita(); aplicaZoom(false); }
    else if (ptr.moveu) { lbImg.style.transition = 'none'; lbImg.style.transform = 'translate(' + dx * .6 + 'px,' + Math.max(0, dy) * .5 + 'px)'; }
  });
  palco.addEventListener('pointerup', function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, moveu = ptr.moveu; ptr = null;
    if (z === 1 && moveu) {
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) passo(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) fecharLB();
      else aplicaZoom(true);
      return;
    }
    if (moveu) return;
    if (e.pointerType === 'mouse') {
      var r = lbImg.getBoundingClientRect(), naFoto = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (naFoto || z > 1) zoomEm(e.clientX, e.clientY); else fecharLB();
      return;
    }
    var agora = Date.now();
    if (agora - ultimoToque < 320) { zoomEm(e.clientX, e.clientY); ultimoToque = 0; } else ultimoToque = agora;
  });
  palco.addEventListener('pointercancel', function () { ptr = null; aplicaZoom(true); });

  function item(b) { return { g: b.getAttribute('data-g'), leg: b.getAttribute('data-leg'), det: b.getAttribute('data-det') }; }
  function grupo(sel) {
    var bs = qa(sel);
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        var vis = bs.filter(function (x) { return !x.closest('.fora'); });
        abrirLB(vis.map(item), vis.indexOf(b));
      });
    });
  }
  grupo('.obra-btn'); grupo('.dsp-quadro');

  /* celular: blocos com mais de 4 imagens mostram 4 em grade 2x2 e um "Ver todos" */
  qa('.mob4').forEach(function (g) {
    var n = g.children.length; if (n <= 4) return;
    var w = doc.createElement('div'); w.className = 'mob4-mais';
    w.innerHTML = '<button type="button" class="btn btn-linha" aria-expanded="false">Ver todos (' + n + ')</button>';
    g.insertAdjacentElement('afterend', w);
    var b = q('button', w);
    b.addEventListener('click', function () {
      var abre = !g.classList.contains('todos');
      g.classList.toggle('todos', abre); b.setAttribute('aria-expanded', abre ? 'true' : 'false');
      b.textContent = abre ? 'Mostrar menos' : 'Ver todos (' + n + ')';
      if (!abre) g.scrollIntoView({ block: 'start', behavior: reduz ? 'auto' : 'smooth' });
    });
  });

  /* portfólio: filtro + ver mais */
  var obras = qa('.obra'), filtro = 'tudo', limite = 12, verMais = q('#ver-mais');
  function aplicar() {
    var vis = 0;
    obras.forEach(function (o) {
      var ok = filtro === 'tudo' || o.getAttribute('data-cat') === filtro;
      o.classList.toggle('fora', !ok);
      if (ok) { vis++; o.classList.toggle('oculta', vis > limite); } else o.classList.remove('oculta');
    });
    verMais.parentNode.hidden = vis <= limite;
  }
  qa('.filtro').forEach(function (b) {
    b.addEventListener('click', function () {
      filtro = b.getAttribute('data-f'); limite = 12;
      qa('.filtro').forEach(function (o) { var at = o === b; o.classList.toggle('ativo', at); o.setAttribute('aria-pressed', at ? 'true' : 'false'); });
      aplicar();
    });
  });
  verMais.addEventListener('click', function () { limite += 12; aplicar(); });
  aplicar();

  /* primeira abertura: baixa todas as fotos logo de cara, sem esperar a rolagem chegar nelas */
  if (!(navigator.connection && navigator.connection.saveData)) qa('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; });

  var ano = q('#ano'); if (ano) ano.textContent = new Date().getFullYear();
})();
