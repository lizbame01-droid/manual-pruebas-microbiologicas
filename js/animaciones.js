/* =============================================================
   ANIMACIONES DE LOS PRINCIPIOS TÉCNICOS  (js/animaciones.js)
   1. Interpretación visual (.interp-anim): placas, tubos y pruebas
      que cambian de color o desarrollan colonias, gas, anillos, etc.
      al "incubar". Se reproduce sola al aparecer en pantalla.
   2. Rutas metabólicas (.ruta-anim) y reacciones (.ec-anim): esquema
      de la figura de la tesis que se arma paso a paso; cada paso
      resalta la enzima que actúa.
   Los datos de cada animación vienen en el atributo data-spec (JSON).
   ============================================================= */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a, padre) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (padre) padre.appendChild(e); return e; }
  function azar(sem) { var s = sem || 7; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 1. Interpretación visual ---------- */
  function dibujaPlaca(svg, sp, r, i) {
    var g = el('g', { transform: 'translate(60,62)' }, svg);
    el('circle', { r: 52, fill: '#e9eef0', stroke: '#9aaab0', 'stroke-width': 2 }, g);
    var medio = el('circle', { r: 47, fill: sp.base, 'class': 'cambia', 'data-fin': r.medio || sp.base }, g);
    el('ellipse', { cx: -18, cy: -24, rx: 18, ry: 7, fill: '#fff', opacity: .25, transform: 'rotate(-30)' }, g);
    var c = r.col || {}, rnd = azar(13 + i * 17), n = c.n || 10;
    for (var k = 0; k < n; k++) {
      var ang = rnd() * Math.PI * 2, rad = Math.sqrt(rnd()) * 38, x = Math.cos(ang) * rad, y = Math.sin(ang) * rad, t = (c.moho ? 7 : 2.6) + rnd() * (c.moho ? 4 : 2.4);
      var pos = el('g', { transform: 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' }, g);
      var col = el('g', { 'class': 'crece', style: 'transition-delay:' + (0.6 + rnd() * 1.6).toFixed(2) + 's' }, pos);
      if (c.halo) el('circle', { r: t + (c.haloR || 3.2), fill: c.halo, opacity: .9 }, col);
      if (c.moho) { for (var f = 0; f < 7; f++) { var a = f / 7 * Math.PI * 2; el('line', { x1: 0, y1: 0, x2: (Math.cos(a) * t).toFixed(1), y2: (Math.sin(a) * t).toFixed(1), stroke: c.c, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, col); } }
      el('circle', { r: c.moho ? t * .55 : t, fill: c.c, stroke: c.borde || 'rgba(0,0,0,.18)', 'stroke-width': .6 }, col);
      if (c.centro) el('circle', { r: t * .45, fill: c.centro }, col);
      if (c.brillo) el('circle', { cx: -t * .35, cy: -t * .35, r: t * .3, fill: c.brilloColor || '#fff', opacity: .8 }, col);
    }
  }
  function tuboBase(g, x, y, w, h) {
    el('rect', { x: x - 2, y: y - 12, width: w + 4, height: 14, rx: 3, fill: '#2f3a3c' }, g);
    var vidrio = el('path', { d: 'M' + x + ',' + y + ' v' + (h - w / 2) + ' a' + w / 2 + ',' + w / 2 + ' 0 0 0 ' + w + ',0 v-' + (h - w / 2), fill: '#f4f8f9', stroke: '#9aaab0', 'stroke-width': 1.6 }, g);
    return vidrio;
  }
  function dibujaTubo(svg, sp, r, i) {
    var g = el('g', {}, svg), x = 45, y = 22, w = 30, h = 110, top = y + 34;
    tuboBase(g, x, y, w, h);
    var liq = el('path', { d: 'M' + (x + 1.5) + ',' + top + ' v' + (h - w / 2 - 34) + ' a' + (w / 2 - 1.5) + ',' + (w / 2 - 1.5) + ' 0 0 0 ' + (w - 3) + ',0 v-' + (h - w / 2 - 34) + ' z', fill: sp.base, 'class': 'cambia', 'data-fin': r.color || sp.base }, g);
    if (sp.claridad) for (var ln = 0; ln < 4; ln++) el('line', { x1: x + 4, y1: top + 10 + ln * 11, x2: x + w - 4, y2: top + 10 + ln * 11, stroke: '#2b3436', 'stroke-width': 1.6, opacity: .7, 'class': 'aparece', 'data-op': r.turbio ? .04 : .7 }, g);
    if (r.turbio) {
      var tb = el('path', { d: liq.getAttribute('d'), fill: '#fff', opacity: 0, 'class': 'aparece', 'data-op': sp.claridad ? .5 : .35 }, g);
      if (sp.claridad) { var rnd = azar(70 + i); for (var pz = 0; pz < 26; pz++) el('circle', { cx: (x + 4 + rnd() * (w - 8)).toFixed(1), cy: (top + 4 + rnd() * (h - 52)).toFixed(1), r: (.8 + rnd() * 1.3).toFixed(1), fill: '#b7ad8f', opacity: 0, 'class': 'aparece', 'data-op': .8 }, g); }
    }
    if (sp.sedimento) el('ellipse', { cx: x + w / 2, cy: y + h - 6, rx: 10, ry: 4, fill: sp.sedimento, opacity: .9 }, g);
    if (sp.durham) {
      var dx = x + w / 2 - 6, dy = y + 66;
      el('rect', { x: dx, y: dy, width: 12, height: 36, rx: 5, fill: 'none', stroke: '#7f8f95', 'stroke-width': 1.3 }, g);
      if (r.gas) el('rect', { x: dx + 1.2, y: dy + 25, width: 9.6, height: 10, rx: 4, fill: '#ffffff', 'class': 'gas-sube', 'data-y': dy + 1.2 }, g);
    }
    if (r.anillo) el('rect', { x: x + 1.5, y: top - 1, width: w - 3, height: 8, fill: r.anillo, opacity: 0, 'class': 'aparece', 'data-op': 1 }, g);
    if (r.gas && !sp.durham) for (var b = 0; b < 4; b++) el('circle', { cx: x + 8 + b * 5, cy: y + h - 10, r: 2, fill: '#fff', 'class': 'burbuja', style: 'animation-delay:' + (b * .45) + 's' }, g);
  }
  function dibujaInclinado(svg, sp, r, i) {
    var g = el('g', {}, svg), x = 45, y = 22, w = 30, h = 110;
    tuboBase(g, x, y, w, h);
    var fondo = el('path', { d: 'M' + (x + 1.5) + ',' + (y + 72) + ' v' + (h - w / 2 - 72) + ' a' + (w / 2 - 1.5) + ',' + (w / 2 - 1.5) + ' 0 0 0 ' + (w - 3) + ',0 v-' + (h - w / 2 - 72 + 30) + ' z', fill: sp.base, 'class': 'cambia', 'data-fin': r.fondo || sp.base }, g);
    el('path', { d: 'M' + (x + 1.5) + ',' + (y + 72) + ' L' + (x + w - 1.5) + ',' + (y + 42) + ' L' + (x + w - 1.5) + ',' + (y + 34) + ' Z', fill: sp.base, 'class': 'cambia', 'data-fin': r.sup || sp.base }, g);
    if (r.negro) el('ellipse', { cx: x + w / 2, cy: y + 94, rx: 11, ry: 14, fill: '#111', opacity: 0, 'class': 'aparece', 'data-op': .9 }, g);
    if (r.crec) el('path', { d: 'M' + (x + 4) + ',' + (y + 68) + ' L' + (x + w - 4) + ',' + (y + 42), stroke: '#f7f3e6', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0, 'class': 'aparece', 'data-op': .9 }, g);
  }
  function dibujaGram(svg, sp, r, i) {
    var g = el('g', { transform: 'translate(60,66)' }, svg), rnd = azar(31 + i);
    el('circle', { r: 50, fill: '#f6f2ea', stroke: '#2f3a3c', 'stroke-width': 5 }, g);
    var cel = el('g', { 'class': 'tinte', 'data-fin': r.color, fill: '#d9d4cc' }, g);
    for (var k = 0; k < 9; k++) {
      var cx = (rnd() - .5) * 60, cy = (rnd() - .5) * 60;
      if (r.forma === 'cocos') for (var q = 0; q < 6; q++) el('circle', { cx: (cx + (q % 3) * 5.5).toFixed(1), cy: (cy + Math.floor(q / 3) * 5.5 + (q % 2) * 2).toFixed(1), r: 2.8 }, cel);
      else el('rect', { x: cx.toFixed(1), y: cy.toFixed(1), width: 14, height: 4.4, rx: 2.2, transform: 'rotate(' + Math.round(rnd() * 180) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')' }, cel);
    }
  }
  function dibujaPortaobjetos(svg, sp, r, i) {
    var g = el('g', {}, svg), rnd = azar(51 + i);
    el('rect', { x: 8, y: 44, width: 104, height: 46, rx: 4, fill: '#eef6f8', stroke: '#9aaab0', 'stroke-width': 1.5 }, g);
    el('ellipse', { cx: 60, cy: 67, rx: 26, ry: 14, fill: sp.tipo === 'gota' ? '#f3f0e3' : '#f1ead8', stroke: '#d2c8a8' }, g);
    if (r.burbujas) for (var b = 0; b < 9; b++) el('circle', { cx: (44 + rnd() * 32).toFixed(1), cy: (60 + rnd() * 14).toFixed(1), r: (1.6 + rnd() * 2.6).toFixed(1), fill: '#fff', stroke: '#b9c4c8', 'class': 'crece', style: 'transition-delay:' + (0.5 + rnd()).toFixed(2) + 's' }, g);
    if (r.grumos) for (var k = 0; k < 10; k++) el('circle', { cx: (42 + rnd() * 36).toFixed(1), cy: (59 + rnd() * 16).toFixed(1), r: (1.8 + rnd() * 2.2).toFixed(1), fill: '#9c8a5a', 'class': 'crece', style: 'transition-delay:' + (0.5 + rnd()).toFixed(2) + 's' }, g);
    if (!r.burbujas && !r.grumos) el('ellipse', { cx: 60, cy: 67, rx: 22, ry: 10, fill: '#e6dcc0', opacity: .6 }, g);
  }
  function dibujaCoag(svg, sp, r, i) {
    var g = el('g', {}, svg), x = 45, y = 22, w = 30, h = 110;
    var t = el('g', { 'class': 'invierte' }, g);
    tuboBase(t, x, y, w, h);
    if (r.coagulo) el('path', { d: 'M' + (x + 1.5) + ',' + (y + 70) + ' v' + (h - w / 2 - 70) + ' a' + (w / 2 - 1.5) + ',' + (w / 2 - 1.5) + ' 0 0 0 ' + (w - 3) + ',0 v-' + (h - w / 2 - 70) + ' z', fill: '#e8c27a' }, t);
    else el('path', { d: 'M' + (x + 1.5) + ',' + (y + 70) + ' v' + (h - w / 2 - 70) + ' a' + (w / 2 - 1.5) + ',' + (w / 2 - 1.5) + ' 0 0 0 ' + (w - 3) + ',0 v-' + (h - w / 2 - 70) + ' z', fill: '#f2deaa', 'class': 'liquido' }, t);
  }
  function dibujaPozos(svg, sp, r, i) {
    var g = el('g', { transform: 'translate(60,62)' }, svg);
    el('circle', { r: 52, fill: '#e9eef0', stroke: '#9aaab0', 'stroke-width': 2 }, g);
    el('circle', { r: 47, fill: sp.base }, g);
    [[-18, -14], [16, -16], [0, 18]].forEach(function (p, k) {
      if (r.halo) el('circle', { cx: p[0], cy: p[1], r: 13, fill: r.halo, 'class': 'crece', style: 'transition-delay:' + (0.6 + k * .4) + 's' }, g);
      el('circle', { cx: p[0], cy: p[1], r: 5, fill: '#2b3f7a' }, g);
    });
  }
  var DIBUJO = { placa: dibujaPlaca, tubo: dibujaTubo, inclinado: dibujaInclinado, gram: dibujaGram, gota: dibujaPortaobjetos, aglut: dibujaPortaobjetos, coag: dibujaCoag, pozos: dibujaPozos };

  /* Dibujo fijo (estado final, sin animación) de uno o varios resultados.
     Lo usa la pestaña «Resultados» en lugar de las imágenes de la tesis. */
  function estadoFinal(svg) {
    svg.querySelectorAll('.cambia, .tinte').forEach(function (e) { e.style.fill = e.getAttribute('data-fin'); });
    svg.querySelectorAll('.aparece').forEach(function (e) { e.style.opacity = e.getAttribute('data-op'); });
    svg.querySelectorAll('.gas-sube').forEach(function (e) { e.setAttribute('y', e.getAttribute('data-y')); });
    svg.querySelectorAll('.invierte').forEach(function (e) { e.setAttribute('transform', 'rotate(180 60 76)'); });
    svg.querySelectorAll('.liquido').forEach(function (e) { e.setAttribute('transform', 'translate(0,-52)'); });
    svg.querySelectorAll('.burbuja').forEach(function (e, k) { e.style.opacity = .85; e.setAttribute('cy', parseFloat(e.getAttribute('cy')) - 8 - k * 9); });
  }
  window.MPM = window.MPM || {};
  MPM.dibujoResultado = function (sp) {
    var fila = document.createElement('span'); fila.className = 'res-dib-fila';
    (sp.res || []).forEach(function (r, i) {
      var svg = el('svg', { viewBox: '0 0 120 140', role: 'img', 'aria-label': r.t || '' });
      (DIBUJO[sp.tipo] || dibujaTubo)(svg, sp, r, i);
      estadoFinal(svg); fila.appendChild(svg);
    });
    return fila;
  };

  function interp(cont) {
    var sp = JSON.parse(cont.dataset.spec), fila = document.createElement('div'); fila.className = 'interp-fila';
    sp.res.forEach(function (r, i) {
      var fig = document.createElement('figure'); fig.className = 'interp-res' + (r.s === '+' ? ' pos' : r.s === '−' ? ' neg' : '');
      var svg = el('svg', { viewBox: '0 0 120 140', role: 'img', 'aria-label': (r.s === '+' ? 'Positiva: ' : r.s === '−' ? 'Negativa: ' : '') + r.t });
      (DIBUJO[sp.tipo] || dibujaTubo)(svg, sp, r, i);
      fig.appendChild(svg);
      var cap = document.createElement('figcaption'); cap.innerHTML = (r.s ? '<b>' + r.s + '</b> ' : '') + esc(r.t).replace(/(Salmonella|S\. aureus|E\. coli|Shigella)/g, '<em>$1</em>') + (r.d ? '<small class="interp-d">' + esc(r.d) + '</small>' : '');
      fig.appendChild(cap); fila.appendChild(fig);
    });
    cont.appendChild(fila);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn peq sec interp-repetir no-imprimir'; b.textContent = '↻ Incubar de nuevo';
    cont.appendChild(b);
    var estado = document.createElement('p'); estado.className = 'interp-estado'; cont.insertBefore(estado, fila);
    function reinicia() {
      cont.classList.add('sin-trans'); cont.classList.remove('incubado');
      MPM.$$('.cambia, .tinte', cont).forEach(function (e) { e.style.fill = ''; });
      MPM.$$('.aparece', cont).forEach(function (e) { e.style.opacity = ''; });
      MPM.$$('.gas-sube', cont).forEach(function (e) { e.style.transform = ''; });
      void cont.offsetWidth; cont.classList.remove('sin-trans');
      estado.textContent = 'Antes de incubar: medio sin cambios';
    }
    var reloj = null;
    function incuba() {
      clearTimeout(reloj); reinicia();
      reloj = setTimeout(function () {
        estado.textContent = 'Incubando…';
        cont.classList.add('incubado');
        MPM.$$('.cambia', cont).forEach(function (e) { e.style.fill = e.dataset.fin; });
        MPM.$$('.tinte', cont).forEach(function (e) { e.style.fill = e.dataset.fin; });
        MPM.$$('.aparece', cont).forEach(function (e) { e.style.opacity = e.dataset.op; });
        MPM.$$('.gas-sube', cont).forEach(function (e) { e.style.transform = 'translateY(' + (parseFloat(e.dataset.y) - parseFloat(e.getAttribute('y'))) + 'px)'; });
        reloj = setTimeout(function () { estado.textContent = 'Después de incubar: compara cada resultado'; }, 3000);
      }, 900);
    }
    b.onclick = incuba;
    cont._incuba = incuba;
  }

  /* ---------- 2. Rutas metabólicas ---------- */
  function caja(svg, x, y, txt, tipo) {
    var w = Math.max(tipo === 's' ? 34 : 70, txt.length * (tipo === 's' ? 7.4 : 8.2) + 18), h = tipo === 's' ? 22 : 30;
    var g = el('g', { 'class': 'nodo nodo-' + tipo, transform: 'translate(' + x + ',' + y + ')' }, svg);
    el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 3 }, g);
    var t = el('text', { 'text-anchor': 'middle', y: tipo === 's' ? 4.5 : 5 }, g); t.textContent = txt;
    g._w = w; g._h = h; return g;
  }
  function borde(n, hacia) { // punto en el borde de la caja n en dirección a (hx, hy)
    var dx = hacia[0] - n.x, dy = hacia[1] - n.y, w = n.g._w / 2 + 4, h = n.g._h / 2 + 4;
    var s = Math.min(Math.abs(dx) > 0 ? w / Math.abs(dx) : 1e9, Math.abs(dy) > 0 ? h / Math.abs(dy) : 1e9);
    return [n.x + dx * s, n.y + dy * s];
  }
  function ruta(cont) {
    var sp = JSON.parse(cont.dataset.spec), N = {};
    var svg = el('svg', { viewBox: '0 0 ' + sp.ancho + ' ' + sp.alto, 'class': 'ruta-svg', role: 'img', 'aria-label': sp.titulo });
    var defs = el('defs', {}, svg), m = el('marker', { id: 'pt-' + cont.id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#1c2b2d' }, m);
    (sp.paneles || []).forEach(function (p) { var t = el('text', { x: p[0], y: p[1], 'class': 'panel-letra' }, svg); t.textContent = p[2]; });
    var capaF = el('g', {}, svg), capaN = el('g', {}, svg);
    Object.keys(sp.nodos).forEach(function (k) { var d = sp.nodos[k]; N[k] = { x: d[0], y: d[1], g: caja(capaN, d[0], d[1], d[2], d[3]) }; });
    var pasos = [];
    sp.flechas.forEach(function (f, i) {
      var a = N[f[0]], b = N[f[1]], p1 = borde(a, [b.x, b.y]), p2 = borde(b, [a.x, a.y]);
      var g = el('g', { 'class': 'flecha' }, capaF);
      var len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      el('line', { x1: p1[0].toFixed(1), y1: p1[1].toFixed(1), x2: p2[0].toFixed(1), y2: p2[1].toFixed(1), stroke: '#1c2b2d', 'stroke-width': 2.2, 'marker-end': 'url(#pt-' + cont.id + ')', 'stroke-dasharray': len.toFixed(1), 'stroke-dashoffset': len.toFixed(1), 'class': 'traza' }, g);
      var mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, vert = Math.abs(p2[1] - p1[1]) > Math.abs(p2[0] - p1[0]);
      if (f[2] != null) {
        var e = el('g', { 'class': 'enz', transform: 'translate(' + (vert ? mx - 22 : mx) + ',' + (vert ? my : my + 18) + ')' }, g);
        el('circle', { r: 10 }, e); var t = el('text', { 'text-anchor': 'middle', y: 4 }, e); t.textContent = f[2];
      }
      (f[3] || []).forEach(function (s, k) {
        var t = el('text', { x: (vert ? mx + 12 : mx).toFixed(1), y: (vert ? my - 6 + k * 15 : my - 9 - k * 14).toFixed(1), 'class': 'lado', 'text-anchor': vert ? 'start' : 'middle' }, g); t.textContent = s;
      });
      pasos.push({ g: g, de: f[0], a: f[1], n: f[2] });
    });
    // tabla de enzimas como en la figura
    var tabla = '<table class="ruta-enzimas"><thead><tr><th>#</th><th>Enzima</th></tr></thead><tbody>' + Object.keys(sp.enzimas).map(function (k) { return '<tr data-n="' + k + '"><td>' + k + '</td><td>' + esc(sp.enzimas[k]) + '</td></tr>'; }).join('') + '</tbody></table>';
    var marco = document.createElement('div'); marco.className = 'ruta-marco';
    var izq = document.createElement('div'); izq.className = 'ruta-dibujo'; izq.appendChild(svg);
    var der = document.createElement('div'); der.className = 'ruta-lado'; der.innerHTML = '<p class="ruta-actual" aria-live="polite">Toca ▶ para recorrer la ruta.</p>' + tabla;
    marco.appendChild(izq); marco.appendChild(der); cont.appendChild(marco);
    controlar(cont, pasos.length + 1, function (k) {
      // k = número de pasos mostrados (0 = solo el sustrato inicial)
      var vis = {}; vis[sp.flechas[0][0]] = 1;
      pasos.forEach(function (p, i) { var on = i < k; p.g.classList.toggle('on', on); p.g.classList.toggle('actual', i === k - 1); if (on) { vis[p.de] = 1; vis[p.a] = 1; } });
      Object.keys(N).forEach(function (id) { N[id].g.classList.toggle('on', !!vis[id] || (k === 0 && id === sp.flechas[0][0])); });
      if (k >= pasos.length + 1 || k === pasos.length) Object.keys(N).forEach(function (id) { N[id].g.classList.add('on'); });
      var p = pasos[k - 1], txt = k === 0 ? 'Sustrato inicial: ' + sp.nodos[sp.flechas[0][0]][2] + '.' : (p ? (p.n != null ? '<b>' + p.n + '.</b> ' + esc(sp.enzimas[p.n]) + ': ' : '') + esc(sp.nodos[p.de][2]) + ' → ' + esc(sp.nodos[p.a][2]) : 'Ruta completa.');
      der.querySelector('.ruta-actual').innerHTML = txt;
      MPM.$$('tr[data-n]', der).forEach(function (tr) { tr.classList.toggle('actual', p && String(p.n) === tr.dataset.n); });
    });
  }
  function ecuacion(cont) {
    var sp = JSON.parse(cont.dataset.spec), piezas = [];
    var h = '';
    sp.filas.forEach(function (fila) {
      h += '<div class="ec-fila">';
      fila.forEach(function (p) {
        if (p[1] === 'e' || p[1] === 'r') {
          h += '<span class="ec-flecha ec-p' + (p[1] === 'r' ? ' rev' : '') + '"><span class="ec-lados">' + (p[2] ? '<i>' + esc(p[2]) + '</i>' : '<i></i>') + (p[3] ? '<i class="sale">' + esc(p[3]) + '</i>' : '') + '</span><span class="ec-linea"></span><em>' + esc(p[0]) + '</em></span>';
        } else h += '<span class="ec-mol ec-p ec-' + p[1] + '">' + esc(p[0]) + '</span>';
      });
      h += '</div>';
    });
    cont.insertAdjacentHTML('beforeend', '<div class="ec-marco">' + h + '</div>');
    piezas = MPM.$$('.ec-p', cont);
    controlar(cont, piezas.length, function (k) { piezas.forEach(function (p, i) { p.classList.toggle('on', i < Math.max(1, k)); p.classList.toggle('actual', i === k - 1); }); });
  }
  /* controles comunes: reproducir, paso a paso, reiniciar */
  function controlar(cont, total, pinta) {
    var k = 0, t = null;
    var bar = document.createElement('div'); bar.className = 'anim-control no-imprimir';
    bar.innerHTML = '<button type="button" class="btn peq azul" data-a="play">▶ Reproducir</button> <button type="button" class="btn peq sec" data-a="sig">Paso a paso</button> <button type="button" class="btn peq sec" data-a="ini">Reiniciar</button>';
    cont.insertBefore(bar, cont.firstChild.nextSibling);
    function ir(n) { k = Math.max(0, Math.min(total, n)); pinta(k); }
    function parar() { clearInterval(t); t = null; bar.querySelector('[data-a=play]').textContent = '▶ Reproducir'; }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'sig') { parar(); ir(k >= total ? 0 : k + 1); }
      if (b.dataset.a === 'ini') { parar(); ir(0); }
      if (b.dataset.a === 'play') {
        if (t) { parar(); return; }
        if (k >= total) ir(0);
        b.textContent = '❚❚ Pausa';
        t = setInterval(function () { if (k >= total) parar(); else ir(k + 1); }, 1500);
      }
    });
    ir(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    MPM.$$('.interp-anim').forEach(interp);
    MPM.$$('.ruta-anim').forEach(ruta);
    MPM.$$('.ec-anim').forEach(ecuacion);
    // la incubación se reproduce sola la primera vez que la animación se ve
    var vistos = new WeakSet();
    function revisa() {
      MPM.$$('.interp-anim').forEach(function (c) {
        if (vistos.has(c) || !c.offsetParent) return;
        var r = c.getBoundingClientRect(); if (r.top < innerHeight - 60 && r.bottom > 0) { vistos.add(c); c._incuba(); }
      });
    }
    ['scroll', 'resize'].forEach(function (ev) { addEventListener(ev, revisa, { passive: true }); });
    document.addEventListener('toggle', function () { setTimeout(revisa, 50); }, true);
    document.addEventListener('mpm:pestana', function () { setTimeout(revisa, 80); });
    setTimeout(revisa, 200);
  });
})();
