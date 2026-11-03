/* Pedido de orçamento em 4 etapas. O WhatsApp abre com o texto pronto; a DM não aceita texto no link,
   então lá o pedido é copiado para colar. Atalhos: ?disp=01 (arte disponível), ?tipo=homenagem|silhueta|floral|escrita. */
(() => {
  const WA = 'https://wa.me/5581998734439', DM = 'https://ig.me/m/valeskatattoo';
  const CHAVE = 'valeska-pedido-v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const form = $('[data-pedido]'), etapas = $$('[data-etapa]', form), passos = $$('[data-passos] li');
  const bVoltar = $('[data-voltar]'), bAvancar = $('[data-avancar]'), bEnviar = $('[data-enviar]');
  const radio = n => { const r = $(`input[name="${n}"]:checked`); return r ? r.value : ''; };
  const val = id => $('#' + id).value.trim();
  let atual = 0, maxVisto = 0, canal = 'wa';

  /* arte disponível: aparece a escolha e a ideia vira opcional */
  const pronto = () => radio('tipo') === 'Arte disponível';
  const tipo = () => {
    $('[data-bloco="disp"]').hidden = !pronto();
    $('[data-ideia-rotulo]').innerHTML = pronto() ? 'Algum ajuste na arte? <em>(opcional)</em>' : 'O que essa tatuagem representa?';
  };
  $$('input[name="tipo"]').forEach(r => r.addEventListener('change', tipo));

  const validar = i => {
    let ok = true;
    if (i === 0) ok = !!radio('tipo') && (!pronto() || !!radio('desenho'));
    if (i === 1) ok = !!radio('lugar') && !!radio('tamanho');
    if (i === 2) ok = pronto() || val('ideia').length > 0;
    if (i === 3) ok = val('nome').length > 0;
    $(`[data-erro="${i}"]`).hidden = ok;
    if (!ok) $(`[data-erro="${i}"]`).scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'center' });
    return ok;
  };
  form.addEventListener('change', () => { $$('.erro-msg').forEach(e => e.hidden = true); });

  const texto = () => {
    const insta = val('insta').replace(/^@/, '');
    const t = radio('tipo');
    const l = [
      `Oi, Valeska! Sou ${val('nome') || '…'}${insta ? ` (@${insta})` : ''} e quero um orçamento pelo site.`,
      '',
      `Tipo: ${t}${pronto() && radio('desenho') ? `, ${radio('desenho')}` : ''}`,
      `Lugar: ${radio('lugar')}`,
      `Tamanho: ${radio('tamanho')}`
    ];
    if (val('ideia')) l.push(`Ideia: ${val('ideia')}`);
    if (val('ref')) l.push(`Referência: ${val('ref')}`);
    if (radio('primeira')) l.push(`Primeira tatuagem: ${radio('primeira')}`);
    if (radio('quando')) l.push(`Para quando: ${radio('quando')}`);
    l.push('', 'Vou mandar as fotos aqui na conversa.');
    return l.join('\n');
  };

  const ir = (i, foco = true) => {
    atual = Math.max(0, Math.min(etapas.length - 1, i));
    maxVisto = Math.max(maxVisto, atual);
    etapas.forEach((et, k) => et.hidden = k !== atual);
    passos.forEach((p, k) => {
      k === atual ? p.setAttribute('aria-current', 'step') : p.removeAttribute('aria-current');
      p.classList.toggle('feito', k < atual || (k <= maxVisto && k !== atual));
    });
    bVoltar.hidden = atual === 0;
    bAvancar.hidden = atual === etapas.length - 1;
    bEnviar.hidden = atual !== etapas.length - 1;
    $('[data-progresso]').style.transform = `scaleX(${(atual + 1) / etapas.length})`;
    if (atual === etapas.length - 1) $('[data-texto]').textContent = texto();
    if (foco) {
      const y = form.getBoundingClientRect().top + scrollY - 110;
      if (scrollY > y) scrollTo({ top: y, behavior: 'auto' });
      const h = $('h2', etapas[atual]); h.tabIndex = -1; h.focus({ preventScroll: true });
    }
  };
  bAvancar.addEventListener('click', () => { if (validar(atual)) { salvar(); ir(atual + 1); } });
  bVoltar.addEventListener('click', () => ir(atual - 1));
  $$('[data-ir]').forEach(b => b.addEventListener('click', () => {
    const alvo = +b.dataset.ir;
    for (let k = 0; k < alvo; k++) if (!validar(k)) return ir(k);
    ir(alvo);
  }));
  /* lugar e tamanho marcados já avançam, como num app */
  $$('input[name="lugar"], input[name="tamanho"]').forEach(r => r.addEventListener('change', () => {
    if (radio('lugar') && radio('tamanho')) setTimeout(() => { if (atual === 1) bAvancar.click(); }, 260);
  }));
  $$('#nome, #insta').forEach(el => el.addEventListener('input', () => { $('[data-texto]').textContent = texto(); }));
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); if (atual < etapas.length - 1) bAvancar.click(); }
  });

  /* rascunho só neste navegador */
  const salvar = () => {
    try {
      const d = { e: maxVisto, c: {} };
      $$('input, textarea', form).forEach(el => {
        if (el.type === 'radio') { if (el.checked) d.c[el.name] = el.value; } else d.c[el.id] = el.value;
      });
      localStorage.setItem(CHAVE, JSON.stringify(d));
    } catch (e) { /* sem armazenamento */ }
  };
  form.addEventListener('input', salvar); form.addEventListener('change', salvar);
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (d) {
      Object.entries(d.c).forEach(([k, v]) => {
        const r = $(`input[type="radio"][name="${k}"][value="${CSS.escape(v)}"]`);
        if (r) r.checked = true; else if ($('#' + k)) $('#' + k).value = v;
      });
      $('[data-rascunho]').textContent = 'Continuando de onde você parou.';
    }
  } catch (e) { /* ignora */ }

  /* atalhos vindos do site */
  const q = new URLSearchParams(location.search);
  let pula = false;
  const ds = q.get('disp') && $(`input[name="desenho"][data-id="${CSS.escape(q.get('disp'))}"]`);
  if (ds) { $('input[name="tipo"][data-id="disp"]').checked = true; ds.checked = true; pula = true; }
  else if (q.get('tipo')) { const t = $(`input[name="tipo"][data-id="${CSS.escape(q.get('tipo'))}"]`); if (t) t.checked = true; }
  tipo();
  ir(pula ? 1 : 0, false);

  const copiar = async t => {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (er) { /* */ }
      a.remove(); return ok;
    }
  };
  $$('[data-canal]').forEach(b => b.addEventListener('click', () => { canal = b.dataset.canal; }));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.submitter && e.submitter.dataset.canal) canal = e.submitter.dataset.canal;
    for (let k = 0; k < etapas.length; k++) if (!validar(k)) return ir(k);
    const t = texto();
    /* a aba abre antes do await, senão o navegador bloqueia como pop-up */
    const url = `${WA}?text=${encodeURIComponent(t)}`;
    $('[data-wa-final]').href = url;
    const aba = window.open(canal === 'wa' ? url : DM, '_blank');
    if (aba) aba.opener = null;
    const ok = await copiar(t);
    $('[data-texto-final]').textContent = t;
    if (canal === 'dm') { $('.ag-pronto h2').textContent = ok ? 'Pedido copiado' : 'Copie o pedido abaixo'; $('[data-pronto-txt]').textContent = 'A DM abriu em outra aba. Cole o texto e envie, junto com as fotos da referência e do lugar do corpo.'; }
    if (!aba) $('[data-pronto-txt]').textContent = 'Toque em um dos botões abaixo e envie o pedido, junto com as fotos da referência e do lugar do corpo.';
    form.hidden = true; $('.ag-passos').hidden = true; $('.ag-prog').hidden = true; $('.ag-cab').hidden = true;
    const pr = $('[data-pronto]'); pr.hidden = false; scrollTo({ top: 0, behavior: 'auto' }); pr.focus({ preventScroll: true });
    try { localStorage.removeItem(CHAVE); } catch (er) { /* */ }
  });
  $('[data-copiar]').addEventListener('click', async e => {
    const ok = await copiar($('[data-texto-final]').textContent);
    e.currentTarget.textContent = ok ? 'Copiado' : 'Selecione o texto e copie';
  });
})();
