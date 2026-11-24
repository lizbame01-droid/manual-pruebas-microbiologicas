/* =============================================================
   REACCIONES ANIMADAS  (js/reacciones.js)
   Cada .rxv trae en data-spec: título, sustratos, enzima, productos,
   colores del indicador (c1 → c2), pasos [texto, fase] y, si la tesis
   tiene la ecuación (Figuras 8, 15, 17, 26 y 29), la ecuación.
   Escena: los sustratos entran al sitio activo de la enzima, salen los
   productos y el indicador del medio cambia como en la prueba real.
   Fases: 0 inicio · 1 unión al sitio activo · 2 productos · 3 cambio
   del indicador · 4 reactivo final (anillo).
   Las moléculas pequeñas se dibujan con sus átomos (modelo de esferas);
   las grandes, como cápsula con su nombre.
   ============================================================= */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function txt(p, x, y, s, a) { var t = el('text', Object.assign({ x: x, y: y }, a || {}), p); t.textContent = s; return t; }
  var COLOR = { C: '#4d5656', O: '#d9473f', N: '#3d6fd6', H: '#ffffff', S: '#e2c03a', Fe: '#c56a2a' };
  /* modelos de esferas: átomos [elemento, x, y] y enlaces [i, j, orden] */
  var MOL = {
    'urea': { a: [['C', 0, 0], ['O', 0, -24], ['N', -21, 12], ['N', 21, 12], ['H', -37, 4], ['H', -21, 30], ['H', 37, 4], ['H', 21, 30]], b: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [2, 4, 1], [2, 5, 1], [3, 6, 1], [3, 7, 1]] },
    'amoníaco': { a: [['N', 0, 0], ['H', -16, 9], ['H', 16, 9], ['H', 0, -17]], b: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
    'co₂': { a: [['O', -22, 0], ['C', 0, 0], ['O', 22, 0]], b: [[0, 1, 2], [1, 2, 2]] },
    'h₂o': { a: [['O', 0, 0], ['H', -15, 10], ['H', 15, 10]], b: [[0, 1, 1], [0, 2, 1]] },
    'h₂o₂': { a: [['O', -10, 0], ['O', 10, 0], ['H', -22, -11], ['H', 22, 11]], b: [[0, 1, 1], [0, 2, 1], [1, 3, 1]] },
    'o₂': { a: [['O', -10, 0], ['O', 10, 0]], b: [[0, 1, 2]] },
    'h₂s': { a: [['S', 0, 0], ['H', -16, 11], ['H', 16, 11]], b: [[0, 1, 1], [0, 2, 1]] }
  };
  var ALIAS = { 'nh₃': 'amoníaco', 'amonio': 'amoníaco', '2 h₂o₂': 'h₂o₂', '2 h₂o': 'h₂o', 'gas': 'co₂' };
  function clave(nombre) { var k = nombre.toLowerCase().trim(); return MOL[k] ? k : (ALIAS[k] || null); }
  function esGas(n) { return /^(co₂|o₂|h₂s|gas)$/i.test(n.trim()); }

  function dibujaMol(p, nombre, tipo) {
    var g = el('g', { 'class': 'rxv-mol rxv-' + tipo }, p), k = clave(nombre), m = k && MOL[k];
    var mult = /^2 /.test(nombre) ? 2 : 1;
    if (m) {
      for (var c = 0; c < mult; c++) {
        var dx = mult > 1 ? (c ? 22 : -22) : 0, dy = mult > 1 ? (c ? 10 : -10) : 0, h = el('g', { transform: 'translate(' + dx + ',' + dy + ')' }, g);
        m.b.forEach(function (b) { var A = m.a[b[0]], B = m.a[b[1]]; el('line', { x1: A[1], y1: A[2], x2: B[1], y2: B[2], stroke: '#6f7c7e', 'stroke-width': b[2] > 1 ? 5 : 2.6, 'stroke-linecap': 'round' }, h); if (b[2] > 1) el('line', { x1: A[1], y1: A[2], x2: B[1], y2: B[2], stroke: '#fff', 'stroke-width': 1.4 }, h); });
        m.a.forEach(function (a) { var r = a[0] === 'H' ? 6.5 : 10; el('circle', { cx: a[1], cy: a[2], r: r, fill: COLOR[a[0]], stroke: '#2f3a3c', 'stroke-width': 1 }, h); if (a[0] !== 'H') txt(h, a[1], a[2] + 3.6, a[0], { 'class': 'rxv-atomo', 'text-anchor': 'middle' }); });
      }
      txt(g, 0, 50, nombre, { 'class': 'rxv-nombre', 'text-anchor': 'middle' });
    } else {
      var partes = nombre.length > 18 ? partir(nombre, 18) : [nombre], w = Math.min(150, Math.max(70, Math.max.apply(null, partes.map(function (s) { return s.length; })) * 7.4 + 24)), hh = 22 + partes.length * 14;
      el('rect', { x: -w / 2, y: -hh / 2, width: w, height: hh, rx: hh / 2, 'class': 'rxv-capsula' }, g);
      partes.forEach(function (s, i) { txt(g, 0, -hh / 2 + 25 + i * 14, s, { 'class': 'rxv-cap-txt', 'text-anchor': 'middle' }); });
    }
    return g;
  }
  function partir(t, max) { var p = t.split(' '), l = [], a = ''; p.forEach(function (w) { if ((a + ' ' + w).trim().length > max && a) { l.push(a.trim()); a = w; } else a += ' ' + w; }); l.push(a.trim()); return l.slice(0, 3); }
  function mueve(g, x, y, s, o) { g.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')'; g.style.opacity = o; }
  function vertical(n, centro, paso) { var r = []; for (var i = 0; i < n; i++) r.push(centro + (i - (n - 1) / 2) * paso); return r; }

  var VISTA = { lactosa: 'placa', h2s: 'placa', telurito: 'placa', termonucleasa: 'pozo', emb: 'placa', catalasa: 'gota', indol: 'anillo', vp: 'anillo', coagulasa: 'coagulo' };

  function montar(caja) {
    if (caja.dataset.listo) return; caja.dataset.listo = '1';
    var sp = JSON.parse(caja.dataset.spec), W = 720, H = 310;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'rxv-svg', role: 'img', 'aria-label': sp.titulo });
    var defs = el('defs', {}, svg), mk = el('marker', { id: 'rxm-' + sp.id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#547071' }, mk);
    txt(svg, 95, 24, 'Sustrato' + (sp.sus.length > 1 ? 's' : ''), { 'class': 'rxv-rot', 'text-anchor': 'middle' });
    txt(svg, 330, 24, 'Enzima / proceso', { 'class': 'rxv-rot', 'text-anchor': 'middle' });
    txt(svg, 535, 24, 'Producto' + (sp.prod.length > 1 ? 's' : ''), { 'class': 'rxv-rot', 'text-anchor': 'middle' });
    txt(svg, 662, 24, 'En el medio', { 'class': 'rxv-rot', 'text-anchor': 'middle' });
    // enzima con su sitio activo (muesca a la izquierda)
    var enz = el('g', { 'class': 'rxv-enz' }, svg);
    el('path', { d: 'M282,112 C276,72 330,52 372,70 C414,88 418,146 404,184 C390,222 330,236 296,214 C276,200 270,184 282,170 C296,166 302,158 302,150 C302,142 296,134 282,130 C272,126 276,118 282,112 Z', 'class': 'rxv-enz-forma' }, enz);
    var lineas = partir(sp.enz, 16), et = el('text', { x: 352, y: 150 - (lineas.length - 1) * 7 + 4, 'class': 'rxv-enz-txt', 'text-anchor': 'middle' }, enz);
    lineas.forEach(function (s, i) { var t = el('tspan', { x: 352, dy: i ? 14 : 0 }, et); t.textContent = s; });
    el('path', { d: 'M150,150 L250,150', stroke: '#9fb3b9', 'stroke-width': 2, 'stroke-dasharray': '5 5', 'marker-end': 'url(#rxm-' + sp.id + ')' }, svg);
    el('path', { d: 'M415,150 L470,150', stroke: '#9fb3b9', 'stroke-width': 2, 'stroke-dasharray': '5 5', 'marker-end': 'url(#rxm-' + sp.id + ')' }, svg);
    var flecha3 = el('path', { d: 'M592,150 L622,150', stroke: '#547071', 'stroke-width': 2.4, 'marker-end': 'url(#rxm-' + sp.id + ')', opacity: 0, 'class': 'rxv-fade' }, svg);
    // indicador
    var vista = VISTA[sp.id] || 'tubo', ind = el('g', {}, svg), medio, extra = [];
    if (vista === 'placa' || vista === 'pozo') {
      el('circle', { cx: 662, cy: 150, r: 46, fill: '#e9eef0', stroke: '#9aaab0', 'stroke-width': 1.6 }, ind);
      medio = el('circle', { cx: 662, cy: 150, r: 41, fill: sp.c1, 'class': 'rxv-color' }, ind);
      if (vista === 'pozo') { extra.push(el('circle', { cx: 662, cy: 150, r: 9, fill: sp.c2, opacity: 0, 'class': 'rxv-fade rxv-halo' }, ind)); el('circle', { cx: 662, cy: 150, r: 9, fill: '#fff', stroke: '#9aaab0', 'stroke-width': 1 }, ind); extra[0].setAttribute('r', 24); }
      else [[650, 136], [676, 142], [658, 166], [682, 166], [640, 158], [668, 124]].forEach(function (q) {
        var c = el('circle', { cx: q[0], cy: q[1], r: 6.5, fill: '#efe9d8', stroke: 'rgba(0,0,0,.25)', 'stroke-width': .8, 'class': 'rxv-col', 'data-fin': sp.c2 }, ind); extra.push(c);
      });
      medio.dataset.fija = '1';
    } else if (vista === 'gota') {
      el('rect', { x: 618, y: 160, width: 88, height: 18, rx: 2, fill: '#e8f1f5', stroke: '#8fa3aa' }, ind);
      medio = el('ellipse', { cx: 662, cy: 158, rx: 24, ry: 9, fill: sp.c1, stroke: '#b9c6cb', 'class': 'rxv-color' }, ind);
      for (var b = 0; b < 7; b++) extra.push(el('circle', { cx: 646 + (b * 37) % 32, cy: 156 - (b % 3) * 3, r: 2.5 + (b % 3), fill: '#fff', stroke: '#9fb3b9', opacity: 0, 'class': 'rxv-burbuja', style: 'animation-delay:' + (b * .25) + 's' }, ind));
    } else {
      el('path', { d: 'M644,70 V214 a18,18 0 0 0 36,0 V70', fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.6 }, ind);
      medio = el('path', { d: 'M645.6,118 V214 a16.4,16.4 0 0 0 32.8,0 V118 Z', fill: sp.c1, 'class': 'rxv-color' }, ind);
      el('rect', { x: 641, y: 64, width: 42, height: 8, rx: 2, fill: '#dfe7ea', stroke: '#8fa3aa' }, ind);
      if (vista === 'anillo') { medio.dataset.fija = '1'; extra.push(el('rect', { x: 645.6, y: 112, width: 32.8, height: 10, fill: sp.c2, opacity: 0, 'class': 'rxv-fade' }, ind)); }
      if (vista === 'coagulo') { medio.dataset.fija = '1'; extra.push(el('path', { d: 'M646,150 q16,-10 32,0 v40 q-16,10 -32,0 z', fill: sp.c2, opacity: 0, 'class': 'rxv-fade' }, ind)); }
      if (sp.gas) for (var q = 0; q < 4; q++) extra.push(el('circle', { cx: 654 + q * 6, cy: 206, r: 2.4, fill: '#fff', opacity: 0, 'class': 'rxv-burbuja', style: 'animation-delay:' + (q * .4) + 's' }, ind));
    }
    var partesInd = partir(sp.ind || '', 16);
    partesInd.forEach(function (s, i) { txt(svg, 662, 262 + i * 13, s, { 'class': 'rxv-ind', 'text-anchor': 'middle' }); });
    // moléculas
    var ys = vertical(sp.sus.length, 150, sp.sus.length > 1 ? 92 : 0), yp = vertical(sp.prod.length, 150, sp.prod.length > 2 ? 72 : 92);
    var fantasmas = sp.sus.map(function (n, i) { var g = dibujaMol(svg, n, 'sus'); g.classList.add('rxv-fantasma'); mueve(g, 95, ys[i], 1, 0); return g; });
    var sus = sp.sus.map(function (n, i) { var g = dibujaMol(svg, n, 'sus'); g._ini = [95, ys[i]]; return g; });
    var prod = sp.prod.map(function (n, i) { var g = dibujaMol(svg, n, 'prod'); g._fin = [535, yp[i]]; g._gas = esGas(n); return g; });

    var pie = document.createElement('div'); pie.className = 'rxv-pie';
    var leyenda = document.createElement('p'); leyenda.className = 'rxv-paso'; leyenda.setAttribute('aria-live', 'polite');
    var lista = document.createElement('ol'); lista.className = 'rxv-lista';
    var items = sp.pasos.map(function (p, j) { var li = document.createElement('li'); li.textContent = p[0]; li.onclick = function () { parar(); ir(j); }; lista.appendChild(li); return li; });
    var bar = document.createElement('div'); bar.className = 'anim-control no-imprimir';
    bar.innerHTML = '<button type="button" class="btn peq azul" data-a="play">▶ Reproducir</button> <button type="button" class="btn peq sec" data-a="sig">Paso a paso</button> <button type="button" class="btn peq sec" data-a="ini">Reiniciar</button>';
    caja.appendChild(bar); caja.appendChild(svg);
    if (sp.ec) { var ec = document.createElement('p'); ec.className = 'rxv-ec'; ec.innerHTML = sp.ec; caja.appendChild(ec); }
    pie.appendChild(leyenda); pie.appendChild(lista); caja.appendChild(pie);
    if (sp.fuente) { var f = document.createElement('p'); f.className = 'fuentes'; f.innerHTML = sp.fuente; caja.appendChild(f); }

    var i = -1, reloj = null, bPlay = bar.querySelector('[data-a=play]');
    function pinta(fase) {
      sus.forEach(function (g, k) { if (fase < 1) mueve(g, g._ini[0], g._ini[1], 1, 1); else if (fase < 2) mueve(g, 262 - k * 6, 150 + (k - (sus.length - 1) / 2) * 26, .62, 1); else mueve(g, 330, 150, .3, 0); });
      prod.forEach(function (g, k) { if (fase < 2) mueve(g, 340, 150, .3, 0); else if (g._gas && fase >= 3) mueve(g, g._fin[0], g._fin[1] - 14, 1, .75); else mueve(g, g._fin[0], g._fin[1], 1, 1); });
      fantasmas.forEach(function (g) { g.style.opacity = fase >= 1 ? .28 : 0; });
      enz.classList.toggle('activa', fase === 1 || fase === 2);
      var cambio = fase >= 3;
      if (!medio.dataset.fija) medio.style.fill = cambio ? sp.c2 : sp.c1;
      flecha3.style.opacity = cambio ? 1 : 0;
      extra.forEach(function (e) {
        if (e.classList.contains('rxv-col')) e.style.fill = cambio ? e.dataset.fin : '#efe9d8';
        else if (e.classList.contains('rxv-burbuja')) e.classList.toggle('on', cambio);
        else e.style.opacity = (vista === 'anillo' ? fase >= (sp.pasos.some(function (p) { return p[1] === 4; }) ? 4 : 3) : cambio) ? 1 : 0;
      });
    }
    function ir(k) {
      i = Math.max(-1, Math.min(sp.pasos.length - 1, k));
      items.forEach(function (li, j) { li.classList.toggle('actual', j === i); li.classList.toggle('hecho', j < i); });
      var fase = 0; for (var j = 0; j <= i; j++) fase = Math.max(fase, sp.pasos[j][1]);
      pinta(fase);
      leyenda.textContent = i < 0 ? 'Pulsa Reproducir o Paso a paso para seguir la reacción.' : (i + 1) + '. ' + sp.pasos[i][0];
      if (i >= sp.pasos.length - 1) parar();
    }
    function parar() { clearInterval(reloj); reloj = null; bPlay.textContent = '▶ Reproducir'; }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'sig') { parar(); ir(i >= sp.pasos.length - 1 ? -1 : i + 1); }
      if (b.dataset.a === 'ini') { parar(); ir(-1); }
      if (b.dataset.a === 'play') {
        if (reloj) return parar();
        if (i >= sp.pasos.length - 1) ir(-1);
        b.textContent = '❚❚ Pausa'; ir(i + 1); reloj = setInterval(function () { ir(i + 1); }, 2800);
      }
    });
    ir(-1);
  }
  function iniciar() { (window.MPM ? MPM.$$('.rxv') : Array.prototype.slice.call(document.querySelectorAll('.rxv'))).forEach(montar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);
})();
