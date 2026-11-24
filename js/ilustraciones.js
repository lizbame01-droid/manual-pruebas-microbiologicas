/* =============================================================
   ILUSTRACIONES INTERACTIVAS  (js/ilustraciones.js)
   1. .ilus-kelsen   Pirámide de Kelsen (Normatividad): los niveles se
                     arman de arriba abajo; al tocar un nivel se resalta.
   2. .ilus-muestreo Simulador de plan de muestreo por atributos
                     (Muestreo): plan de 2 o 3 clases, n, c, m y M; cada
                     "lote nuevo" toma n unidades, las ubica en la escala
                     y decide si el lote se acepta o se rechaza.
   ============================================================= */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function h(tag, cls, txt, p) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; }
  var QUIETO = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function alVer(nodo, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: .4 });
    io.observe(nodo);
  }

  /* ---------- 1. Pirámide de Kelsen ---------- */
  var NIVELES = ['Constitución Política de los Estados Unidos Mexicanos', 'Tratados internacionales', 'Leyes federales y generales',
    'Reglamentos administrativos', 'Reglamentos interiores de las dependencias o entidades', 'Normas Oficiales Mexicanas'];
  var TONOS = ['#2f4a4b', '#3f5f60', '#547071', '#6f8c8d', '#93acad', '#c9a646'];
  function partir(t, max) { var p = t.split(' '), l = [], a = ''; p.forEach(function (w) { if ((a + ' ' + w).trim().length > max) { l.push(a.trim()); a = w; } else a += ' ' + w; }); l.push(a.trim()); return l; }
  function kelsen(caja) {
    if (caja.dataset.listo) return; caja.dataset.listo = '1';
    var svg = el('svg', { viewBox: '0 0 560 330', role: 'img', 'aria-label': 'Pirámide de Kelsen: ' + NIVELES.join(', ') }, caja);
    var AX = 150, AY = 16, BY = 312, BW = 140, N = NIVELES.length, H = (BY - AY) / N, grupos = [];
    NIVELES.forEach(function (nom, i) {
      var y0 = AY + i * H, y1 = y0 + H, w0 = BW * (i / N), w1 = BW * ((i + 1) / N);
      var g = el('g', { 'class': 'kel-nivel', tabindex: 0, role: 'button', 'aria-label': nom }, svg);
      el('path', { d: 'M' + (AX - w0) + ',' + y0 + ' L' + (AX + w0) + ',' + y0 + ' L' + (AX + w1) + ',' + (y1 - 2) + ' L' + (AX - w1) + ',' + (y1 - 2) + ' Z', fill: TONOS[i] }, g);
      var ym = (y0 + y1) / 2;
      el('line', { x1: AX + (w0 + w1) / 2 + 6, y1: ym, x2: 318, y2: ym, stroke: '#9fb3b9', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, g);
      el('circle', { cx: 318, cy: ym, r: 3.5, fill: TONOS[i] }, g);
      var lin = partir(nom, 30), t = el('text', { x: 328, y: ym - (lin.length - 1) * 7 + 4, 'class': 'kel-txt' }, g);
      lin.forEach(function (l, k) { var s = el('tspan', { x: 328, dy: k ? 14 : 0 }, t); s.textContent = l; });
      var n = el('text', { x: AX, y: ym + 4, 'text-anchor': 'middle', 'class': 'kel-num' }, g); n.textContent = i + 1;
      grupos.push(g);
      function marca() { grupos.forEach(function (x) { x.classList.toggle('es-marcado', x === g); }); nota.textContent = i === N - 1 ? 'Las NOM regulan elementos técnicos de alta precisión y no pueden vulnerar ni contradecir a las normas de rango superior.' : (i === 0 ? 'La Constitución es la ley suprema: ninguna norma puede contradecirla.' : nom + ': nivel ' + (i + 1) + ' de ' + N + '. Las normas no pueden contradecir a las de rango superior.'); }
      g.addEventListener('click', marca); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marca(); } });
    });
    var pie = h('div', 'kel-pie', null, caja), nota = h('p', 'kel-nota', 'Toca un nivel para resaltarlo.', pie);
    var b = h('button', 'tec-btn', '↺ Armar de nuevo', pie); b.type = 'button';
    function armar() {
      grupos.forEach(function (g) { g.classList.remove('entra', 'es-marcado'); });
      if (QUIETO) { grupos.forEach(function (g) { g.classList.add('entra'); }); return; }
      grupos.forEach(function (g, i) { setTimeout(function () { g.classList.add('entra'); }, 250 + i * 450); });
      setTimeout(function () { grupos[N - 1].dispatchEvent(new Event('click')); }, 250 + N * 450 + 400);
    }
    b.onclick = armar;
    if (QUIETO) armar(); else alVer(caja, armar);
  }

  /* ---------- 2. Simulador de plan de muestreo ---------- */
  function muestreo(caja) {
    if (caja.dataset.listo) return; caja.dataset.listo = '1';
    var est = { clases: 3, n: 5, c: 2, m: 2, M: 3 };   // m y M en log10 UFC/g (10² y 10³)
    h('h3', 'mu-titulo', 'Simulador: ¿se acepta el lote?', caja);
    h('p', 'nota', 'Elige el tipo de plan y sus parámetros, y analiza un lote. Cada círculo es una unidad de muestra; su posición indica el recuento obtenido (UFC/g).', caja);
    h('p', 'nota', 'Los valores del simulador son solo de ejemplo. Los planes y límites que aplican a cada alimento están en su pestaña «Muestreo».', caja);
    var ctr = h('div', 'mu-ctr', null, caja);
    var tipo = h('div', 'tec-alterna', null, ctr); tipo.setAttribute('role', 'group');
    var b2 = h('button', 'tec-alt', 'Plan de 2 clases', tipo), b3 = h('button', 'tec-alt es-activa', 'Plan de 3 clases', tipo); b2.type = b3.type = 'button';
    function paso(lbl, clave, min, max, fmt) {
      var d = h('div', 'mu-par', null, ctr); h('span', 'mu-par-n', lbl, d);
      var menos = h('button', 'mu-pm', '−', d), val = h('b', 'mu-val', '', d), mas = h('button', 'mu-pm', '+', d); menos.type = mas.type = 'button';
      menos.setAttribute('aria-label', 'Disminuir ' + lbl); mas.setAttribute('aria-label', 'Aumentar ' + lbl);
      function pon() { val.textContent = fmt ? fmt(est[clave]) : est[clave]; }
      menos.onclick = function () { if (est[clave] > min) { est[clave]--; ajusta(); } };
      mas.onclick = function () { if (est[clave] < max) { est[clave]++; ajusta(); } };
      return { pon: pon, d: d };
    }
    var pot = function (x) { return '10' + ['⁰', '¹', '²', '³', '⁴', '⁵'][x]; };
    var pn = paso('n', 'n', 3, 10), pc = paso('c', 'c', 0, 5), pm = paso('m', 'm', 1, 4, pot), pM = paso('M', 'M', 2, 5, pot);
    var go = h('button', 'btn', 'Analizar un lote', ctr); go.type = 'button';

    var W = 640, H0 = 230, X0 = 40, X1 = 620, LMAX = 5;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H0, 'class': 'mu-svg', role: 'img', 'aria-label': 'Escala de recuentos con las unidades analizadas' }, caja);
    function xl(l) { return X0 + (X1 - X0) * Math.max(0, Math.min(LMAX, l)) / LMAX; }
    var zA = el('rect', { y: 150, height: 26, fill: '#d7ebc8' }, svg), zB = el('rect', { y: 150, height: 26, fill: '#f3e3b3' }, svg), zC = el('rect', { y: 150, height: 26, fill: '#f3cfcb' }, svg);
    var tA = el('text', { y: 168, 'class': 'mu-zona' }, svg), tB = el('text', { y: 168, 'class': 'mu-zona' }, svg), tC = el('text', { y: 168, 'class': 'mu-zona' }, svg);
    el('line', { x1: X0, y1: 176, x2: X1, y2: 176, stroke: '#2f3a3c', 'stroke-width': 1.4 }, svg);
    for (var i = 0; i <= LMAX; i++) { el('line', { x1: xl(i), y1: 176, x2: xl(i), y2: 182, stroke: '#2f3a3c' }, svg); var t = el('text', { x: xl(i), y: 196, 'text-anchor': 'middle', 'class': 'mu-eje' }, svg); t.textContent = pot(i); }
    var te = el('text', { x: (X0 + X1) / 2, y: 216, 'text-anchor': 'middle', 'class': 'mu-eje' }, svg); te.textContent = 'Recuento (UFC/g, escala logarítmica)';
    var lm = el('line', { y1: 20, y2: 182, stroke: '#2e8b63', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg), lM = el('line', { y1: 20, y2: 182, stroke: '#c0453f', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
    var tm = el('text', { y: 16, 'text-anchor': 'middle', 'class': 'mu-lim', fill: '#2e8b63' }, svg), tM = el('text', { y: 16, 'text-anchor': 'middle', 'class': 'mu-lim', fill: '#c0453f' }, svg);
    var capa = el('g', {}, svg);
    var res = h('div', 'mu-res', null, caja); res.setAttribute('aria-live', 'polite');

    function ajusta() {
      if (est.M <= est.m) est.M = est.m + 1;
      if (est.c >= est.n) est.c = est.n - 1;
      pn.pon(); pc.pon(); pm.pon(); pM.pon();
      pM.d.hidden = est.clases === 2;
      b2.classList.toggle('es-activa', est.clases === 2); b3.classList.toggle('es-activa', est.clases === 3);
      var xm = xl(est.m), xM = xl(est.M);
      if (est.clases === 2) {
        set(zA, 0, xm); set(zC, xm, X1); zB.setAttribute('width', 0);
        txt(tA, (X0 + xm) / 2, 'Aceptable (≤ m)'); txt(tC, (xm + X1) / 2, 'Rechazable (> m)'); tB.textContent = '';
        lM.setAttribute('opacity', 0); tM.textContent = '';
      } else {
        set(zA, 0, xm); set(zB, xm, xM); set(zC, xM, X1);
        txt(tA, (X0 + xm) / 2, 'Aceptable'); txt(tB, (xm + xM) / 2, 'Medianamente aceptable'); if (xM - xm < 150) { tB.textContent = ''; [['Medianamente', -8], ['aceptable', 11]].forEach(function (q) { var ts = el('tspan', { x: (xm + xM) / 2, dy: q[1] }, tB); ts.textContent = q[0]; }); } txt(tC, (xM + X1) / 2, 'Rechazable (> M)');
        lM.setAttribute('opacity', 1); lM.setAttribute('x1', xM); lM.setAttribute('x2', xM); txt(tM, xM, 'M = ' + pot(est.M));
      }
      lm.setAttribute('x1', xm); lm.setAttribute('x2', xm); txt(tm, xm, 'm = ' + pot(est.m));
      while (capa.firstChild) capa.removeChild(capa.firstChild);
      res.className = 'mu-res'; res.innerHTML = '<p>Pulsa <b>Analizar un lote</b> para tomar ' + est.n + ' unidades de muestra.</p>';
    }
    function set(r, a, b) { r.setAttribute('x', a || X0); r.setAttribute('width', Math.max(0, b - (a || X0))); }
    function txt(e, x, s) { e.setAttribute('x', x); e.setAttribute('text-anchor', 'middle'); e.textContent = s; }
    b2.onclick = function () { est.clases = 2; ajusta(); };
    b3.onclick = function () { est.clases = 3; ajusta(); };

    function normal() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    go.onclick = function () {
      while (capa.firstChild) capa.removeChild(capa.firstChild);
      var media = [est.m - 1, est.m - .2, est.m + .4, (est.clases === 3 ? est.M : est.m) + .6][Math.floor(Math.random() * 4)];
      var vals = []; for (var i = 0; i < est.n; i++) vals.push(Math.max(.2, Math.min(4.9, media + normal() * .55)));
      var filas = {}; var unidades = vals.map(function (v, i) {
        var x = xl(v), fila = 0; while (filas[fila] && filas[fila].some(function (o) { return Math.abs(o - x) < 24; })) fila++; (filas[fila] = filas[fila] || []).push(x);
        var y = 136 - fila * 24, cl = v <= est.m ? 'ok' : (est.clases === 3 && v <= est.M ? 'mar' : 'mal');
        var g = el('g', { 'class': 'mu-u mu-' + cl, transform: 'translate(' + x + ',-30)' }, capa);
        el('circle', { r: 10 }, g); var t = el('text', { y: 4, 'text-anchor': 'middle' }, g); t.textContent = i + 1;
        el('title', {}, g).textContent = 'Unidad ' + (i + 1) + ': ' + Math.round(Math.pow(10, v)).toLocaleString('es-MX') + ' UFC/g';
        setTimeout(function () { g.setAttribute('transform', 'translate(' + x + ',' + y + ')'); g.classList.add('cae'); }, QUIETO ? 0 : 150 + i * 260);
        return cl;
      });
      var malas = unidades.filter(function (c) { return c === 'mal'; }).length, marg = unidades.filter(function (c) { return c === 'mar'; }).length;
      var acepta, razon;
      if (est.clases === 2) { acepta = malas <= est.c; razon = malas + ' de ' + est.n + ' unidades superan m; se toleran como máximo c = ' + est.c + '.'; }
      else if (malas > 0) { acepta = false; razon = malas + (malas === 1 ? ' unidad supera' : ' unidades superan') + ' M: si alguna unidad supera M, el lote se rechaza.'; }
      else { acepta = marg <= est.c; razon = marg + ' de ' + est.n + ' unidades están entre m y M (medianamente aceptables); se toleran como máximo c = ' + est.c + '.'; }
      res.className = 'mu-res'; res.innerHTML = '<p>Analizando ' + est.n + ' unidades…</p>';
      setTimeout(function () {
        res.className = 'mu-res ' + (acepta ? 'es-acepta' : 'es-rechaza');
        res.innerHTML = '<p class="mu-veredicto">' + (acepta ? '✔ Lote aceptado' : '✖ Lote rechazado') + '</p><p></p>';
        res.lastChild.textContent = razon;
      }, QUIETO ? 0 : 300 + est.n * 260);
    };
    ajusta();
  }

  function iniciar() {
    Array.prototype.forEach.call(document.querySelectorAll('.ilus-kelsen'), kelsen);
    Array.prototype.forEach.call(document.querySelectorAll('.ilus-muestreo'), muestreo);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);
})();
