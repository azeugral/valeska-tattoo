/* O traço da Valeska em shader: a arte real sai das fotos das tatuagens (tools/gerar_traco.py) num mapa
   R = tinta, G = momento em que a tinta chega, B = decalque. Primeiro o decalque violeta assenta no papel,
   depois a tinta corre por cima dele, molhada e azul, e seca quase preta.
   tracoGL(canvas, {mapa, papel, arte:{cx, cy, alt, gira}, transparente}) devolve {desenhar(t), desenharP(p), final()}; precisa de WebGL2. */
window.tracoGL = function (cv, op) {
  var gl = cv.getContext('webgl2', { antialias: false, alpha: !!op.transparente, premultipliedAlpha: true, preserveDrawingBuffer: !!op.preserveDrawingBuffer });
  if (!gl) return null;
  var vs = '#version 300 es\nin vec2 p; out vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
  var fs = [
    '#version 300 es', 'precision highp float;', 'in vec2 v; out vec4 cor;',
    'uniform sampler2D M, P; uniform vec2 R, A; uniform vec3 C; uniform float gira, prog, dec, fade, somaP, transp;',
    'uniform vec3 corTinta, corMolhada, corDec, corPapel;',
    'void main(){',
    '  vec2 px = v * R; vec2 q = (px - C.xy) / C.z;',
    '  float c = cos(gira), s = sin(gira); q = mat2(c, -s, s, c) * q;',
    '  vec2 u = q / A + .5; u.y = 1. - u.y;',
    '  float dentro = step(0., u.x) * step(u.x, 1.) * step(0., u.y) * step(u.y, 1.);',
    '  vec3 m = texture(M, u).rgb * dentro;',
    '  float tinta = smoothstep(.1, .9, m.r), che = m.g, dc = m.b;',
    '  float chegou = smoothstep(prog, prog - .010, che) * step(.001, prog);',
    '  float mol = smoothstep(prog - .075, prog - .005, che);',
    '  float cobre = smoothstep(u.y - .2, u.y + .2, dec * 1.4 - .2);',
    '  float a = tinta * chegou * fade;',
    '  float d = dc * cobre * fade * .62 * (1. - chegou * .92);',
    '  if (transp > .5) { vec3 t = mix(corTinta, corMolhada, mol); float k = max(a, d * .6); cor = vec4(t * k, k); return; }',
    '  float pa = texture(P, px / vec2(1600., 1000.) / max(1., R.x / 1600.)).r / .91;',
    '  vec3 base = corPapel * mix(1., pa, somaP);',
    '  vec3 col = mix(base, base * corDec, d);',
    '  col = mix(col, mix(corTinta, corMolhada, mol), a);',
    '  cor = vec4(col, 1.);',
    '}'].join('\n');
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['M', 'P', 'R', 'A', 'C', 'gira', 'prog', 'dec', 'fade', 'somaP', 'transp', 'corTinta', 'corMolhada', 'corDec', 'corPapel'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
  gl.uniform1i(U.M, 0); gl.uniform1i(U.P, 1);
  var cores = op.cores || {};
  gl.uniform3fv(U.corTinta, cores.tinta || [.075, .115, .15]);
  gl.uniform3fv(U.corMolhada, cores.molhada || [.13, .36, .55]);
  gl.uniform3fv(U.corDec, cores.dec || [.42, .36, .86]);
  gl.uniform3fv(U.corPapel, cores.papel || [.905, .933, .952]);
  gl.uniform1f(U.transp, op.transparente ? 1 : 0);
  if (op.transparente) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0); }
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

  var arte = op.arte, asp = 1, pronto = false, ciclo = 26;
  function tex(un, img, rep, mip) {
    var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + un); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var w = rep ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
  }
  function carrega(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  var carregou = Promise.all([carrega(op.mapa), op.papel ? carrega(op.papel) : null]).then(function (r) {
    tex(0, r[0], false, true); asp = r[0].width / r[0].height;
    if (r[1]) tex(1, r[1], true, false);
    gl.uniform1f(U.somaP, r[1] ? 1 : 0); pronto = true;
  });
  function pos() {
    var W = cv.width, H = cv.height, a = arte.alt * H;
    gl.viewport(0, 0, W, H); gl.uniform2f(U.R, W, H);
    gl.uniform3f(U.C, W * arte.cx, H * (1 - arte.cy), a);
    gl.uniform2f(U.A, asp, 1); gl.uniform1f(U.gira, arte.gira || 0);
  }
  function suave(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function pinta(prog, dec, fade) {
    if (!pronto) return; pos();
    gl.uniform1f(U.prog, prog); gl.uniform1f(U.dec, dec); gl.uniform1f(U.fade, fade);
    if (op.transparente) gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return {
    ciclo: ciclo, carregou: carregou,
    /* ciclo fechado: decalque 0,2 a 2 s, tinta de 1,6 a 14 s, repouso até 22 s, some até o fim */
    desenhar: function (t) {
      t = t % ciclo;
      var i = suave(1.6, 14, t), lin = Math.max(0, Math.min(1, (t - 1.6) / 12.4));
      pinta(t > 1.6 ? .012 + 1.03 * (.5 * i + .5 * lin) : 0, suave(.2, 2.2, t), 1 - suave(22, 25.6, t));
    },
    /* rolagem: p de 0 a 1 */
    desenharP: function (p) { pinta(p > 0 ? .012 + p * 1.03 : 0, suave(0, .12, p), 1); },
    final: function () { pinta(1.1, 1, 1); },
    medir: pos
  };
};
