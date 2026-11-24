/* =============================================================
   ANIMACIONES DE LAS TÉCNICAS MICROBIOLÓGICAS  (js/tecnicas.js)
   Una animación por técnica, basada en las figuras 47 a 52 de la tesis:
     diluciones · extendida · estria · inclinado · vertido · gram
   Uso en el HTML:  <div class="tec-anim" data-tec="estria" data-nombre="…"></div>
   Cada animación es un dibujo SVG propio que avanza por pasos. Se reproduce
   sola cuando aparece en pantalla y se repite; los números permiten ir a un
   paso, y el botón pausarla. Si el sistema pide reducir el movimiento, empieza
   detenida en el resultado final.
   ============================================================= */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(t) { t = cl(t); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function seg(T, a, b) { return ease((T - a) / (b - a)); }
  function lin(a, b, t) { return a + (b - a) * t; }
  function hx(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); t = cl(t); return 'rgb(' + Math.round(lin(x[0], y[0], t)) + ',' + Math.round(lin(x[1], y[1], t)) + ',' + Math.round(lin(x[2], y[2], t)) + ')'; }
  function azar(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function rot(p, deg) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  function set(e, a) { for (var k in a) e.setAttribute(k, a[k]); }
  function f1(x) { return Math.round(x * 10) / 10; }
  function camino(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(p[0]) + ',' + f1(p[1]); }).join(''); }
  /* recorrido por una polilínea: punto en t (0..1) y la parte ya trazada */
  function poli(pts) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var L = cum[cum.length - 1];
    return {
      pts: pts, largo: L,
      en: function (t) {
        var d = cl(t) * L, i = 1; while (i < pts.length - 1 && cum[i] < d) i++;
        var a = pts[i - 1], b = pts[i], u = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
        return [lin(a[0], b[0], u), lin(a[1], b[1], u)];
      },
      hasta: function (t) {
        var d = cl(t) * L, out = [pts[0]], i = 1;
        while (i < pts.length && cum[i] <= d) { out.push(pts[i]); i++; }
        if (i < pts.length && t > 0) out.push(this.en(t));
        return out;
      }
    };
  }
  /* trayecto entre puntos clave: [[T, x, y], …] → posición en T */
  function trayecto(claves, T) {
    if (T <= claves[0][0]) return [claves[0][1], claves[0][2]];
    for (var i = 1; i < claves.length; i++) if (T <= claves[i][0]) {
      var a = claves[i - 1], b = claves[i], u = ease((T - a[0]) / ((b[0] - a[0]) || 1));
      return [lin(a[1], b[1], u), lin(a[2], b[2], u)];
    }
    var z = claves[claves.length - 1]; return [z[1], z[2]];
  }

  /* ---------- instrumentos (la punta queda en 0,0) ---------- */
  function asa(p) {
    var g = el('g', { 'class': 'tec-asa' }, p);
    el('rect', { x: -4.5, y: -138, width: 9, height: 62, rx: 3.5, fill: '#2f3a3c' }, g);
    el('line', { x1: 0, y1: -77, x2: 0, y2: -6, stroke: '#9aa7ab', 'stroke-width': 2.2 }, g);
    el('circle', { cx: 0, cy: 0, r: 5, fill: 'none', stroke: '#6f7f84', 'stroke-width': 2.2 }, g);
    var carga = el('circle', { cx: 0, cy: 0, r: 3.2, fill: '#b79ad6', opacity: 0 }, g);
    return { g: g, carga: carga };
  }
  function pipeta(p, color) {
    var g = el('g', {}, p);
    el('rect', { x: -9, y: -132, width: 18, height: 24, rx: 5, fill: '#7f8f95' }, g);
    el('path', { d: 'M-6,-108 L6,-108 L4,-30 L1.2,0 L-1.2,0 L-4,-30 Z', fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.4 }, g);
    var liq = el('path', { d: 'M-3.6,-50 L3.6,-50 L3.4,-30 L1,-3 L-1,-3 L-3.4,-30 Z', fill: color || '#b79ad6', opacity: 0 }, g);
    return { g: g, liq: liq };
  }
  function gotero(p) {
    var g = el('g', {}, p);
    el('rect', { x: -8, y: -74, width: 16, height: 26, rx: 8, fill: '#2f3a3c' }, g);
    el('rect', { x: -10, y: -50, width: 20, height: 5, rx: 2, fill: '#2f3a3c' }, g);
    el('path', { d: 'M-4.5,-45 L4.5,-45 L2,-2 L-2,-2 Z', fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.3 }, g);
    var liq = el('path', { d: 'M-3.6,-30 L3.6,-30 L1.6,-4 L-1.6,-4 Z', fill: '#7c4fb0' }, g);
    return { g: g, liq: liq };
  }
  function matraz(p, color, esc) {
    var g = el('g', {}, p), s = esc || 1;
    var cuerpo = el('g', { transform: 'scale(' + s + ')' }, g);
    el('path', { d: 'M-38,0 L38,0 L12,-50 L12,-78 L-12,-78 L-12,-50 Z', fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, cuerpo);
    var liq = el('path', { d: 'M-34,-3 L34,-3 L21,-28 L-21,-28 Z', fill: color }, cuerpo);
    el('rect', { x: -15, y: -84, width: 30, height: 7, rx: 3, fill: '#dfe7ea', stroke: '#8fa3aa', 'stroke-width': 1.4 }, cuerpo);
    return { g: g, liq: liq };
  }
  function flecha(p, id) {
    var d = el('defs', {}, p), m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#2f3a3c' }, m);
    return 'url(#' + id + ')';
  }
  var uid = 0;
  function texto(p, x, y, t, a) { var e = el('text', Object.assign({ x: x, y: y, 'class': 'tec-txt' }, a || {}), p); e.textContent = t; return e; }

  /* =========================================================
     1. DILUCIONES DECIMALES (Figura 47)
     ========================================================= */
  function diluciones(svg) {
    var X = [125, 185, 245, 305, 365, 425], TOP = 52, FON = 152, NIV = 100;
    var TONOS = ['#55252a', '#5d4434', '#8e5f3f', '#b99a6e', '#cdb38b', '#e8dbc8'], DIL = '#f1ebe0';
    var ETQ = ['1:10', '1:100', '1:10³', '1:10⁴', '1:10⁵', '1:10⁶'], COL = [70, 44, 24, 10, 3, 0];
    var mk = flecha(svg, 'tf' + (++uid));
    var fl = matraz(svg, '#5a1f22', .62); fl.g.setAttribute('transform', 'translate(48,112)');
    texto(svg, 48, 132, 'Muestra', { 'text-anchor': 'middle' });
    texto(svg, 70, 176, '9 mL de', { 'text-anchor': 'middle' }); texto(svg, 70, 189, 'diluyente', { 'text-anchor': 'middle' });
    var arcos = [], liqs = [], etqs = [], bajadas = [], gotas = [], cols = [];
    for (var k = 0; k < 6; k++) {
      var x0 = k ? X[k - 1] + 6 : 62, x1 = X[k] - 3, mx = (x0 + x1) / 2;
      var a = el('path', { d: 'M' + x0 + ',' + (k ? 44 : 60) + ' Q' + mx + ',' + (k ? 12 : 20) + ' ' + x1 + ',' + (TOP - 6), fill: 'none', stroke: '#2f3a3c', 'stroke-width': 1.6, 'marker-end': mk, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, svg);
      var at = texto(svg, mx, k ? 22 : 30, '1 mL', { 'text-anchor': 'middle', opacity: 0 });
      arcos.push([a, at]);
      var g = el('g', {}, svg), w = 22;
      el('path', { d: 'M' + (X[k] - w / 2) + ',' + TOP + ' V' + (FON - w / 2) + ' A' + w / 2 + ',' + w / 2 + ' 0 0 0 ' + (X[k] + w / 2) + ',' + (FON - w / 2) + ' V' + TOP, fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.5 }, g);
      liqs.push(el('path', { d: 'M' + (X[k] - w / 2 + 1.5) + ',' + NIV + ' V' + (FON - w / 2) + ' A' + (w / 2 - 1.5) + ',' + (w / 2 - 1.5) + ' 0 0 0 ' + (X[k] + w / 2 - 1.5) + ',' + (FON - w / 2) + ' V' + NIV + ' Z', fill: DIL }, g));
      el('rect', { x: X[k] - w / 2 - 2, y: TOP - 5, width: w + 4, height: 6, rx: 2, fill: '#dfe7ea', stroke: '#8fa3aa', 'stroke-width': 1.1 }, g);
      etqs.push(texto(svg, X[k], 170, ETQ[k], { 'text-anchor': 'middle', opacity: 0, 'font-weight': 600 }));
      bajadas.push(el('line', { x1: X[k], y1: 178, x2: X[k], y2: 216, stroke: '#2f3a3c', 'stroke-width': 1.5, 'marker-end': mk, opacity: 0 }, svg));
      var pl = el('g', {}, svg);
      el('ellipse', { cx: X[k], cy: 238, rx: 25, ry: 10, fill: '#e9eef0', stroke: '#9aaab0', 'stroke-width': 1.4 }, pl);
      el('ellipse', { cx: X[k], cy: 237, rx: 21, ry: 7.6, fill: '#f6edcf' }, pl);
      gotas.push(el('ellipse', { cx: X[k], cy: 237, rx: 6, ry: 2.4, fill: TONOS[k], opacity: 0 }, pl));
      var r = azar(11 + k * 7), cs = [];
      for (var c = 0; c < COL[k]; c++) {
        var an = r() * 6.283, rd = Math.sqrt(r());
        cs.push(el('circle', { cx: f1(X[k] + Math.cos(an) * rd * 18), cy: f1(237 + Math.sin(an) * rd * 6), r: 0, fill: '#d6b44c', stroke: '#a88a2c', 'stroke-width': .5 }, pl));
      }
      cols.push(cs);
    }
    texto(svg, 70, 214, 'Inóculo 1 mL', { 'text-anchor': 'middle' });
    var pip = pipeta(svg, '#5a1f22');
    var gotaCae = el('circle', { r: 2.6, fill: '#5a1f22', opacity: 0 }, svg);
    return {
      pasos: [
        { t: 'Agregar 1 mL de muestra al primer tubo con 9 mL de diluyente (dilución 1:10)', d: 4200 },
        { t: 'Transferir 1 mL de cada tubo al siguiente para obtener 1:100, 1:10³ … 1:10⁶', d: 7600 },
        { t: 'Inocular 1 mL de cada dilución en una caja Petri', d: 6000 },
        { t: 'Incubar: cada dilución tiene menos colonias que la anterior', d: 3800 }
      ],
      dibuja: function (T) {
        var claves = [[0, 48, 18], [.22, 48, 92], [.38, 48, 30], [.7, X[0], 38], [.8, X[0], 92]], color = '#5a1f22', cae = null;
        // tubo 1
        var c0 = seg(T, .78, .98);
        set(liqs[0], { fill: mix(DIL, TONOS[0], c0) });
        set(arcos[0][0], { 'stroke-dashoffset': 1 - seg(T, .38, .7), opacity: T > .39 ? 1 : 0 }); set(arcos[0][1], { opacity: seg(T, .45, .65) });
        set(etqs[0], { opacity: seg(T, .85, 1) });
        if (T > .76 && T < .9) cae = [X[0], lin(92, NIV, (T - .76) / .14)];
        // transferencias
        for (var k = 1; k < 6; k++) {
          var a = 1 + (k - 1) / 5, b = a + 1 / 5, q = function (u) { return a + u / 5; };
          claves.push([q(.12), X[k - 1], 92], [q(.3), X[k - 1], 38], [q(.62), X[k], 38], [q(.74), X[k], 92]);
          set(arcos[k][0], { 'stroke-dashoffset': 1 - seg(T, q(.3), q(.62)), opacity: T > q(.31) ? 1 : 0 }); set(arcos[k][1], { opacity: seg(T, q(.35), q(.55)) });
          set(liqs[k], { fill: mix(DIL, TONOS[k], seg(T, q(.72), q(.95))) });
          set(etqs[k], { opacity: seg(T, q(.8), q(1)) });
          if (T > q(.7) && T < q(.86)) { cae = [X[k], lin(92, NIV, (T - q(.7)) / (q(.86) - q(.7)))]; color = TONOS[k - 1]; }
          if (T > q(0) && T < q(.62)) color = TONOS[k - 1];
        }
        // inoculación en cajas
        for (var j = 0; j < 6; j++) {
          var a2 = 2 + j / 6, q2 = function (u) { return a2 + u / 6; };
          claves.push([q2(.15), X[j], 90], [q2(.3), X[j], 40], [q2(.45), X[j] + 30, 60], [q2(.6), X[j] + 30, 196], [q2(.72), X[j], 226], [q2(.9), X[j], 226]);
          set(bajadas[j], { opacity: seg(T, q2(.45), q2(.65)) });
          set(gotas[j], { opacity: seg(T, q2(.72), q2(.88)) * (1 - seg(T, 3.2, 3.8)) });
          if (T > q2(.1) && T < q2(.95)) color = TONOS[j];
        }
        claves.push([3.08, X[5], 30], [3.25, 520, -40]);
        // colonias
        for (var m = 0; m < 6; m++) cols[m].forEach(function (c, i) { set(c, { r: f1(2.1 * seg(T, 3.15 + (i % 9) * .05, 3.55 + (i % 9) * .05)) }); });
        var p = trayecto(claves, T);
        set(pip.g, { transform: 'translate(' + f1(p[0]) + ',' + f1(p[1]) + ')' });
        set(pip.liq, { fill: color, opacity: T < .2 || T > 3.05 ? 0 : 1 });
        if (cae) set(gotaCae, { cx: cae[0], cy: f1(cae[1]), opacity: 1, fill: color }); else set(gotaCae, { opacity: 0 });
      }
    };
  }

  /* =========================================================
     2. SIEMBRA POR ESTRÍA EN PLACA (Figura 48)
     ========================================================= */
  function estria(svg) {
    var CX = 240, CY = 136;
    el('circle', { cx: CX, cy: CY, r: 110, fill: '#e9eef0', stroke: '#9aaab0', 'stroke-width': 2 }, svg);
    var G = el('g', {}, svg);
    el('circle', { cx: CX, cy: CY, r: 101, fill: '#f2e6bd' }, G);
    el('ellipse', { cx: CX - 40, cy: CY - 62, rx: 30, ry: 9, fill: '#fff', opacity: .3, transform: 'rotate(-28 ' + (CX - 40) + ' ' + (CY - 62) + ')' }, G);
    function zig(x0, x1, yA, yB, n, deriva) {
      var p = []; for (var i = 0; i <= n; i++) { var x = lin(x0, x1, i / n), y = (i % 2 ? yB : yA) + (deriva || 0) * i / n; p.push([x, y]); } return p;
    }
    var SC = [zig(-50, 48, -64, -82, 12), zig(-66, 40, -48, -72, 10), zig(-66, 40, -48, -72, 10), zig(-62, 34, -46, -62, 9, 58)];
    SC[0].unshift([-48, -64]);
    var trazos = [], locs = [];
    for (var k = 0; k < 4; k++) {
      var L = SC[k].map(function (p) { return rot(p, 90 * k); });
      locs.push(poli(L.map(function (p) { return [p[0] + CX, p[1] + CY]; })));
      trazos.push(el('path', { d: '', fill: 'none', stroke: '#b5473f', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, G));
    }
    var blob = el('ellipse', { cx: CX - 48, cy: CY - 66, rx: 10, ry: 7, fill: '#c9b06a', opacity: 0 }, G);
    // colonias: densas en la 1.ª estría, aisladas en la 4.ª
    var DENS = [30, 15, 8, 4], colonias = [], rr = azar(5);
    for (var s = 0; s < 4; s++) for (var c = 0; c < DENS[s]; c++) {
      var t = s === 3 ? .12 + c * .26 : (c + rr() * .6) / DENS[s], pt = locs[s].en(t), j = s < 2 ? 4 : 1.5;
      colonias.push({ e: el('circle', { cx: f1(pt[0] + (rr() - .5) * j * 2), cy: f1(pt[1] + (rr() - .5) * j * 2), r: 0, fill: '#efe3b4', stroke: '#b59c55', 'stroke-width': .8 }, G), r: s === 3 ? 5 : s === 2 ? 3.8 : 3 + rr() * 1.4, d: s * .08 + rr() * .12 });
    }
    var ult = locs[3].en(.9);
    var lupa = el('circle', { cx: f1(ult[0]), cy: f1(ult[1]), r: 15, fill: 'none', stroke: '#c0453f', 'stroke-width': 1.8, 'stroke-dasharray': '4 3', opacity: 0 }, G);
    var A = asa(svg);
    function inicioPantalla(k) { return [SC[k][0][0] + CX, SC[k][0][1] + CY]; }
    function finPantalla(k) { var z = SC[k][SC[k].length - 1]; return [z[0] + CX, z[1] + CY]; }
    return {
      pasos: [
        { t: 'Inoculación inicial: depositar el inóculo en un extremo de la placa con el asa', d: 3000 },
        { t: 'Primera estría', d: 3200 },
        { t: 'Segunda estría (giro de la placa)', d: 4200 },
        { t: 'Tercera estría (giro)', d: 4200 },
        { t: 'Cuarta estría (agotamiento)', d: 4200 },
        { t: 'Incubación y observación de colonias aisladas', d: 4200 }
      ],
      dibuja: function (T) {
        var giro = 0, pos, s0 = inicioPantalla(0);
        if (T < 1) pos = trayecto([[0, CX + 170, CY - 150], [.55, s0[0], s0[1]], [.7, s0[0] + 5, s0[1] - 3], [.85, s0[0] - 3, s0[1] + 3], [1, s0[0], s0[1]]], T);
        else if (T < 2) pos = locs[0].en(T - 1).slice(), pos = rot([pos[0] - CX, pos[1] - CY], 0), pos = [pos[0] + CX, pos[1] + CY];
        set(blob, { opacity: seg(T, .6, .95) * (1 - .5 * seg(T, 5, 5.6)) });
        for (var k = 1; k < 4; k++) {
          giro = -90 * (k - 1) - 90 * seg(T, k + 1 + .08, k + 1 + .4);
          if (T >= k + 1 && T < k + 2) {
            var u = T - k - 1, e0 = finPantalla(k - 1), e1 = rot([e0[0] - CX, e0[1] - CY], -90), arr = [CX + 40, CY - 150], st = inicioPantalla(k);
            if (u < .5) pos = trayecto([[0, e0[0], e0[1]], [.12, arr[0], arr[1]], [.4, arr[0], arr[1]], [.5, st[0], st[1]]], u);
            else { var lp = locs[k].en((u - .5) / .5); var sp = rot([lp[0] - CX, lp[1] - CY], -90 * k); pos = [sp[0] + CX, sp[1] + CY]; }
            break;
          }
        }
        if (T >= 5) giro = -270;
        else if (T < 2) giro = 0;
        if (T >= 5) { var f = finPantalla(3); pos = trayecto([[0, f[0], f[1]], [.35, CX + 190, CY - 160], [1, CX + 190, CY - 160]], T - 5); }
        set(G, { transform: 'rotate(' + f1(giro) + ' ' + CX + ' ' + CY + ')' });
        for (var s = 0; s < 4; s++) {
          var pr = cl(s === 0 ? T - 1 : (T - s - 1 - .5) / .5);
          set(trazos[s], { d: pr > 0 ? camino(locs[s].hasta(pr)) : '', opacity: 1 - .65 * seg(T, 5.05, 5.6) });
        }
        colonias.forEach(function (c) { set(c.e, { r: f1(c.r * seg(T, 5.15 + c.d, 5.55 + c.d)) }); });
        set(lupa, { opacity: seg(T, 5.7, 5.95) });
        set(A.g, { transform: 'translate(' + f1(pos[0]) + ',' + f1(pos[1]) + ') rotate(32)' });
        set(A.carga, { opacity: T < .6 ? 1 : 0 });
      }
    };
  }

  /* =========================================================
     3. SIEMBRA EN TUBO INCLINADO (Figura 49)
     ========================================================= */
  function inclinado(svg) {
    // tubo con cultivo (vertical)
    var tx = 105, tt = 40, tf = 205, w = 30;
    el('path', { d: 'M' + (tx - w / 2) + ',' + tt + ' V' + (tf - w / 2) + ' A' + w / 2 + ',' + w / 2 + ' 0 0 0 ' + (tx + w / 2) + ',' + (tf - w / 2) + ' V' + tt, fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.6 }, svg);
    el('path', { d: 'M' + (tx - w / 2 + 1.5) + ',125 V' + (tf - w / 2) + ' A' + (w / 2 - 1.5) + ',' + (w / 2 - 1.5) + ' 0 0 0 ' + (tx + w / 2 - 1.5) + ',' + (tf - w / 2) + ' V125 Z', fill: '#c9b6e6' }, svg);
    el('rect', { x: tx - w / 2 - 2, y: tt - 6, width: w + 4, height: 7, rx: 2, fill: '#dfe7ea', stroke: '#8fa3aa', 'stroke-width': 1.2 }, svg);
    texto(svg, tx, 238, 'Cultivo', { 'text-anchor': 'middle' });
    // tubo inclinado: marco local (eje en y, boca en y = -200, fondo en 0)
    var OX = 248, OY = 228, ANG = 56;
    var G = el('g', { transform: 'translate(' + OX + ',' + OY + ') rotate(' + ANG + ')' }, svg);
    el('path', { d: 'M-17,-200 V-17 A17,17 0 0 0 17,-17 V-200', fill: '#f4f8f9', stroke: '#8fa3aa', 'stroke-width': 1.6 }, G);
    el('path', { d: 'M-15.5,-34 V-17 A15.5,15.5 0 0 0 15.5,-17 V-34 Z', fill: '#e2cc8c' }, G);
    el('path', { d: 'M-15.5,-34 C-15.5,-110 -9,-158 0,-160 C9,-158 15.5,-110 15.5,-34 Z', fill: '#f3e5b8', stroke: '#d9c486', 'stroke-width': 1 }, G);
    el('rect', { x: -19, y: -206, width: 38, height: 7, rx: 2, fill: '#dfe7ea', stroke: '#8fa3aa', 'stroke-width': 1.2 }, G);
    texto(svg, 330, 254, 'Agar inclinado', { 'text-anchor': 'middle' });
    function ancho(y) { return 12.5 * Math.sqrt(cl((-y - 34) < 0 ? 1 : (160 + y) / 126)); }
    var recta = [], zz = [];
    for (var i = 0; i <= 10; i++) recta.push([0, lin(-40, -146, i / 10)]);
    for (var j = 0; j <= 16; j++) { var yy = lin(-42, -146, j / 16); zz.push([(j % 2 ? 1 : -1) * ancho(yy) * .78, yy]); }
    var Pr = poli(recta), Pz = poli(zz);
    var trR = el('path', { d: '', fill: 'none', stroke: '#b5473f', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, G);
    var trZ = el('path', { d: '', fill: 'none', stroke: '#b5473f', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, G);
    var crec = el('path', { d: camino(zz), fill: 'none', stroke: '#efe2b0', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, G);
    var crec2 = el('path', { d: camino(zz), fill: 'none', stroke: '#c9ad5c', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0 }, G);
    function pant(p) { var r = rot(p, ANG); return [r[0] + OX, r[1] + OY]; }
    var A = asa(svg), boca = pant([0, -215]);
    return {
      pasos: [
        { t: 'Toma del inóculo con el asa', d: 3200 },
        { t: 'Deslizar el asa suavemente sobre la superficie inclinada', d: 3400 },
        { t: 'Completar la estría sobre toda la superficie', d: 4000 }
      ],
      dibuja: function (T) {
        var pos, ang = 0, a0 = pant(recta[0]);
        if (T < 1) pos = trayecto([[0, tx, -10], [.4, tx, 168], [.55, tx, 168], [1, tx, 20]], T);
        else if (T < 2) {
          var u = T - 1;
          if (u < .35) { pos = trayecto([[0, tx, 20], [.18, boca[0], boca[1]], [.35, a0[0], a0[1]]], u); ang = ANG * seg(u, .05, .2); }
          else { pos = pant(Pr.en((u - .35) / .65)); ang = ANG; }
        } else if (T < 3) {
          var v = T - 2; ang = ANG;
          if (v < .15) pos = trayecto([[0, pant(recta[10])[0], pant(recta[10])[1]], [.15, pant(zz[0])[0], pant(zz[0])[1]]], v);
          else if (v < .88) pos = pant(Pz.en((v - .15) / .73));
          else pos = trayecto([[.88, pant(zz[16])[0], pant(zz[16])[1]], [1, boca[0] + 40, boca[1] - 60]], v);
        } else { pos = [boca[0] + 40, boca[1] - 60]; ang = ANG; if (T > 3) pos = trayecto([[3, boca[0] + 40, boca[1] - 60], [3.3, 560, -60]], T); }
        set(trR, { d: T > 1.35 ? camino(Pr.hasta((T - 1.35) / .65)) : '', opacity: 1 - .7 * seg(T, 3.1, 3.6) });
        set(trZ, { d: T > 2.15 ? camino(Pz.hasta((T - 2.15) / .73)) : '', opacity: 1 - .7 * seg(T, 3.1, 3.6) });
        set(crec, { opacity: .95 * seg(T, 3.15, 3.8) }); set(crec2, { opacity: seg(T, 3.3, 3.9) });
        set(A.g, { transform: 'translate(' + f1(pos[0]) + ',' + f1(pos[1]) + ') rotate(' + f1(ang) + ')' });
        set(A.carga, { opacity: T > .45 && T < 1.4 ? 1 : 0 });
      }
    };
  }

  /* =========================================================
     4. SIEMBRA EXTENDIDA (Figura 50)
     ========================================================= */
  function extendida(svg) {
    var CX = 240, CY = 140;
    el('circle', { cx: CX, cy: CY, r: 108, fill: '#e9eef0', stroke: '#9aaab0', 'stroke-width': 2 }, svg);
    var G = el('g', {}, svg);
    el('circle', { cx: CX, cy: CY, r: 99, fill: '#f2e6bd' }, G);
    el('ellipse', { cx: CX - 42, cy: CY - 60, rx: 28, ry: 8, fill: '#fff', opacity: .3, transform: 'rotate(-28 ' + (CX - 42) + ' ' + (CY - 60) + ')' }, G);
    var pelicula = el('circle', { cx: CX, cy: CY, r: 0, fill: '#b79ad6', opacity: .7 }, G);
    var marcas = el('g', { opacity: 0 }, G);
    for (var i = 0; i < 6; i++) el('path', { d: 'M' + (CX - 70) + ',' + (CY - 50 + i * 20) + ' q70,' + (i % 2 ? 10 : -10) + ' 140,0', fill: 'none', stroke: '#9b7fc4', 'stroke-width': 1, opacity: .45 }, marcas);
    var cols = [], r = azar(23);
    for (var c = 0; c < 46; c++) { var a = r() * 6.283, d = Math.sqrt(r()) * 84; cols.push({ e: el('circle', { cx: f1(CX + Math.cos(a) * d), cy: f1(CY + Math.sin(a) * d), r: 0, fill: c % 3 ? '#e9dca6' : '#c7b0e3', stroke: c % 3 ? '#b59c55' : '#8f74b8', 'stroke-width': .7 }, G), r: 2.6 + r() * 2.4, d: r() * .25 }); }
    var V = el('g', {}, svg);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -150, stroke: '#cfdde1', 'stroke-width': 6, 'stroke-linecap': 'round' }, V);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -150, stroke: '#9fb3b9', 'stroke-width': 1.2 }, V);
    el('line', { x1: -26, y1: 0, x2: 26, y2: 0, stroke: '#cfdde1', 'stroke-width': 6, 'stroke-linecap': 'round' }, V);
    el('line', { x1: -26, y1: 0, x2: 26, y2: 0, stroke: '#9fb3b9', 'stroke-width': 1.2 }, V);
    var P = pipeta(svg), gota = el('circle', { r: 3, fill: '#b79ad6', opacity: 0 }, svg);
    return {
      pasos: [
        { t: 'Inocular un volumen de muestra diluida en el centro de la placa', d: 3400 },
        { t: 'Extender uniformemente con la varilla acodada', d: 5200 },
        { t: 'Incubar: se forman colonias aisladas', d: 3800 }
      ],
      dibuja: function (T) {
        var p = trayecto([[0, CX, -10], [.45, CX, CY - 14], [.75, CX, CY - 14], [1, CX + 10, -40]], T);
        set(P.g, { transform: 'translate(' + f1(p[0]) + ',' + f1(p[1]) + ')', opacity: T < 1.05 ? 1 : 0 });
        set(P.liq, { opacity: T < .55 ? 1 : 0 });
        if (T > .5 && T < .66) set(gota, { cx: CX, cy: f1(lin(CY - 12, CY, (T - .5) / .16)), opacity: 1 }); else set(gota, { opacity: 0 });
        var u = seg(T, 1.1, 1.95);
        set(pelicula, { r: f1(lin(13 * seg(T, .6, .8), 88, u)), opacity: f1(lin(.7, .28, u) * (1 - .75 * seg(T, 2.05, 2.6))) });
        set(marcas, { opacity: .8 * seg(T, 1.2, 1.5) * (1 - seg(T, 1.9, 2.2)) });
        var giro = 540 * seg(T, 1.05, 2);
        set(G, { transform: 'rotate(' + f1(giro) + ' ' + CX + ' ' + CY + ')' });
        var ida = T > 1 && T < 2 ? Math.sin((T - 1) * Math.PI * 6) * 34 : 0, ve = seg(T, .95, 1.1) * (1 - seg(T, 2, 2.3));
        var dirx = Math.cos(-50 * Math.PI / 180), diry = Math.sin(-50 * Math.PI / 180);
        var vx = CX + dirx * (ida + 6) + (T >= 2 ? 160 * seg(T, 2, 2.3) : 0), vy = CY + diry * (ida + 6) - (T >= 2 ? 100 * seg(T, 2, 2.3) : 0);
        set(V, { transform: 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(40)', opacity: f1(ve) });
        cols.forEach(function (c) { set(c.e, { r: f1(c.r * seg(T, 2.25 + c.d, 2.7 + c.d)) }); });
      }
    };
  }

  /* =========================================================
     5. SIEMBRA POR VERTIDO EN PLACA (Figura 51, tesis V3.1)
     ========================================================= */
  function vertido(svg) {
    var CX = 262, CY = 186, RX = 90, RY = 30, H = 20, IRX = 86, IRY = 28;
    var mk = flecha(svg, 'tv' + (++uid));
    var placa = el('g', {}, svg);
    el('ellipse', { cx: CX, cy: CY + H, rx: RX, ry: RY, fill: '#dfe7ea', stroke: '#9aaab0', 'stroke-width': 1.6 }, placa);
    el('rect', { x: CX - RX, y: CY, width: RX * 2, height: H, fill: '#e9eef0' }, placa);
    el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: '#f1f5f6', stroke: '#9aaab0', 'stroke-width': 1.4 }, placa);
    var cont = el('g', {}, placa);
    var cLado = el('rect', { x: CX - IRX, y: CY + H - 2, width: IRX * 2, height: 0, fill: '#f0d48a' }, cont);
    var cFondo = el('ellipse', { cx: CX, cy: CY + H - 2, rx: IRX, ry: IRY, fill: '#f0d48a', opacity: 0 }, cont);
    var cSup = el('ellipse', { cx: CX, cy: CY + H - 2, rx: IRX, ry: IRY, fill: '#f6e2a6', opacity: 0 }, cont);
    var mancha = el('ellipse', { cx: CX - 6, cy: CY + H - 4, rx: 0, ry: 0, fill: '#b79ad6', opacity: .85 }, placa);
    var cols = [], r = azar(41);
    for (var c = 0; c < 30; c++) {
      var a = r() * 6.283, d = Math.sqrt(r()), prof = c % 5 < 3;
      cols.push({ e: el('ellipse', { cx: f1(CX + Math.cos(a) * d * 74), cy: f1(CY + 4 + Math.sin(a) * d * 22), rx: 0, ry: 0, fill: c % 2 ? '#9b7fc4' : '#e2c48a', stroke: c % 2 ? '#6f569b' : '#b08f4f', 'stroke-width': .6, opacity: prof ? .55 : 1 }, placa), r: prof ? 3 : 4.6, d: r() * .3 });
    }
    el('path', { d: 'M' + (CX - RX) + ',' + CY + ' V' + (CY + H) + ' A' + RX + ',' + RY + ' 0 0 0 ' + (CX + RX) + ',' + (CY + H) + ' V' + CY, fill: 'none', stroke: '#9aaab0', 'stroke-width': 1.6 }, placa);
    el('ellipse', { cx: CX - 40, cy: CY - 8, rx: 26, ry: 5, fill: '#fff', opacity: .55 }, placa);
    var giroF = el('path', { d: 'M' + (CX + 52) + ',' + (CY - 44) + ' A62,18 0 1 0 ' + (CX - 52) + ',' + (CY - 44), fill: 'none', stroke: '#2f3a3c', 'stroke-width': 2, 'marker-end': mk, opacity: 0 }, svg);
    // detalle (corte lateral)
    var lupa = el('g', { opacity: 0 }, svg);
    var LX = 362, LY = 118, LW = 108, LH = 96, zx = CX + 62, zy = CY + 6;
    el('rect', { x: zx - 9, y: zy - 7, width: 18, height: 14, fill: 'none', stroke: '#2f3a3c', 'stroke-width': 1.3 }, lupa);
    el('line', { x1: zx + 9, y1: zy - 7, x2: LX, y2: LY, stroke: '#2f3a3c', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, lupa);
    el('line', { x1: zx + 9, y1: zy + 7, x2: LX, y2: LY + LH, stroke: '#2f3a3c', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, lupa);
    el('rect', { x: LX, y: LY, width: LW, height: LH, fill: '#fff', stroke: '#2f3a3c', 'stroke-width': 1.6 }, lupa);
    el('rect', { x: LX + 6, y: LY + 44, width: LW - 12, height: 40, fill: '#f0d48a' }, lupa);
    el('line', { x1: LX + 6, y1: LY + 86, x2: LX + LW - 6, y2: LY + 86, stroke: '#9aaab0', 'stroke-width': 3 }, lupa);
    [[24, 64, 9, 3.5], [58, 72, 8, 3], [84, 58, 7, 3], [40, 52, 6, 2.5]].forEach(function (q) { el('ellipse', { cx: LX + q[0], cy: LY + q[1], rx: q[2], ry: q[3], fill: '#e2c48a', stroke: '#b08f4f', 'stroke-width': .7 }, lupa); });
    [[30, 44, 8], [72, 44, 7]].forEach(function (q) { el('path', { d: 'M' + (LX + q[0] - q[2]) + ',' + (LY + q[1]) + ' a' + q[2] + ',' + (q[2] * .6) + ' 0 0 1 ' + q[2] * 2 + ',0 Z', fill: '#9b7fc4', stroke: '#6f569b', 'stroke-width': .7 }, lupa); });
    texto(lupa, LX + LW / 2, LY + 16, 'En superficie y', { 'text-anchor': 'middle' }); texto(lupa, LX + LW / 2, LY + 29, 'dentro del agar', { 'text-anchor': 'middle' });
    // matraz y pipeta
    var FO = [116, 140], F = matraz(svg, '#f0d48a'), lab = [195, 150];
    var chorro = el('path', { d: 'M' + lab[0] + ',' + lab[1] + ' Q' + (lab[0] + 40) + ',' + (lab[1] - 4) + ' ' + (CX - 30) + ',' + (CY + 6), fill: 'none', stroke: '#f0d48a', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0, 'stroke-dasharray': '14 6' }, svg);
    var P = pipeta(svg), gota = el('circle', { r: 3, fill: '#b79ad6', opacity: 0 }, svg);
    var reloj = texto(svg, 262, 262, '', { 'text-anchor': 'middle', 'font-style': 'italic' });
    return {
      pasos: [
        { t: 'Inocular la muestra en la caja Petri estéril', d: 3400 },
        { t: 'Verter el medio atemperado (45 ºC) en la caja Petri inoculada', d: 4800 },
        { t: 'Mezclar con movimientos suaves', d: 3600 },
        { t: 'Incubar: el agar se solidifica y se presentan colonias aisladas', d: 4600 }
      ],
      dibuja: function (T) {
        var p = trayecto([[0, CX - 6, -20], [.45, CX - 6, CY - 12], [.75, CX - 6, CY - 12], [1, CX + 20, -60]], T);
        set(P.g, { transform: 'translate(' + f1(p[0]) + ',' + f1(p[1]) + ')', opacity: T < 1.05 ? 1 : 0 });
        set(P.liq, { opacity: T < .55 ? 1 : 0 });
        if (T > .5 && T < .68) set(gota, { cx: CX - 6, cy: f1(lin(CY - 10, CY + H - 4, (T - .5) / .18)), opacity: 1 }); else set(gota, { opacity: 0 });
        var m = seg(T, .6, .85);
        // vertido
        var ang = 100 * seg(T, 1.05, 1.3) * (1 - seg(T, 1.85, 2)), sale = seg(T, 1.85, 2);
        set(F.g, { transform: 'translate(' + f1(FO[0] - 40 * sale) + ',' + f1(FO[1]) + ') rotate(' + f1(ang) + ')', opacity: f1(1 - sale) });
        set(F.liq, { opacity: f1(1 - .8 * seg(T, 1.3, 1.82)) });
        var fluye = T > 1.3 && T < 1.82;
        set(chorro, { opacity: fluye ? 1 : 0, 'stroke-dashoffset': f1(-T * 120) });
        var nivel = 12 * seg(T, 1.32, 1.85), yS = CY + H - 2 - nivel;
        var agar = '#f0d48a', mezcla = '#cdb3d6';
        var col = T < 3 ? mix(agar, mezcla, seg(T, 2.1, 2.8)) : mix(mezcla, '#f2d690', seg(T, 3.05, 3.5));
        set(cLado, { y: f1(yS), height: f1(nivel), fill: col });
        set(cFondo, { opacity: nivel > .3 ? 1 : 0, fill: col }); set(cSup, { cy: f1(yS), opacity: nivel > .3 ? 1 : 0, fill: T < 3 ? mix('#f6e2a6', '#dcc6e2', seg(T, 2.1, 2.8)) : mix('#dcc6e2', '#f6e2a6', seg(T, 3.05, 3.5)) });
        set(mancha, { rx: f1(22 * m * (1 + 2.6 * seg(T, 2.1, 2.8))), ry: f1(7 * m * (1 + 2.6 * seg(T, 2.1, 2.8))), opacity: f1(.85 * (1 - .55 * seg(T, 1.4, 1.85)) * (1 - seg(T, 2.3, 2.85))), cy: f1(lin(CY + H - 4, yS, seg(T, 1.4, 1.85))) });
        // mezclar
        var mov = T > 2 && T < 3 ? (T - 2) * Math.PI * 6 : 0, amp = 7 * (T > 2 && T < 3 ? Math.sin((T - 2) * Math.PI) : 0);
        set(placa, { transform: 'translate(' + f1(Math.cos(mov) * amp) + ',' + f1(Math.sin(mov) * amp * .4) + ')' });
        set(giroF, { opacity: seg(T, 2.05, 2.25) * (1 - seg(T, 2.8, 3)) });
        cols.forEach(function (c) { var k = seg(T, 3.3 + c.d, 3.65 + c.d); set(c.e, { rx: f1(c.r * k), ry: f1(c.r * .38 * k) }); });
        set(lupa, { opacity: seg(T, 3.65, 3.95) });
        reloj.textContent = T > 3.05 && T < 3.6 ? '⌛ Incubar' : '';
      }
    };
  }

  /* =========================================================
     6. TINCIÓN DE GRAM (Figura 52)
     ========================================================= */
  function gram(svg) {
    var PASO = [
      { n: 'Tinción inicial', r: 'Cristal violeta', a: 'Las bacterias absorben el cristal violeta', t: '1 min', c: '#7c4fb0', fr: '#6a43a0', pos: '#5e3a7e', neg: '#5e3a7e', negTxt: 'violeta' },
      { n: 'Fijación del colorante', r: 'Yodo', a: 'Se forma el complejo cristal violeta-yodo', t: '1 min', c: '#b98a55', fr: '#4e2c6b', pos: '#4b2a66', neg: '#4b2a66', negTxt: 'violeta' },
      { n: 'Decoloración', r: 'Etanol-acetona', a: 'La capa lipídica de las gramnegativas se disuelve y pierden el color', t: '10 s', c: '#bcd6ea', fr: '#d8cca2', pos: '#4b2a66', neg: '#d0d0d0', negTxt: 'incoloro' },
      { n: 'Contratinción', r: 'Fucsina básica', a: 'Se da color a las bacterias gramnegativas decoloradas', t: '1 min', c: '#d0567a', fr: '#8e1f3c', pos: '#4b2a66', neg: '#d65a7a', negTxt: 'rojo' }
    ];
    var tN = texto(svg, 24, 34, '', { 'class': 'tec-txt tec-gram-n' }), tR = texto(svg, 24, 54, '', { 'class': 'tec-txt tec-gram-r' });
    var tA = el('text', { x: 24, y: 72, 'class': 'tec-txt tec-gram-a' }, svg);
    var tA1 = el('tspan', { x: 24, dy: 0 }, tA), tA2 = el('tspan', { x: 24, dy: 14 }, tA);
    el('polygon', { points: '296,122 246,166 346,166', fill: '#dfe6ee', opacity: .8 }, svg);
    el('rect', { x: 200, y: 106, width: 192, height: 16, rx: 2, fill: '#e8f1f5', stroke: '#8fa3aa', 'stroke-width': 1.3 }, svg);
    el('rect', { x: 200, y: 106, width: 30, height: 16, rx: 2, fill: '#b9c6cb' }, svg);
    var frotis = el('ellipse', { cx: 296, cy: 114, rx: 34, ry: 6, fill: '#e9dfc9' }, svg);
    var tiempo = texto(svg, 210, 140, '', { 'class': 'tec-txt tec-gram-t' });
    var G = gotero(svg), gota = el('circle', { r: 3, fill: '#7c4fb0', opacity: 0 }, svg);
    el('circle', { cx: 296, cy: 206, r: 54, fill: '#f3f0f6', stroke: '#2f3a3c', 'stroke-width': 2.4 }, svg);
    var cocos = [], bacilos = [];
    [[268, 196], [304, 214], [324, 186], [290, 236], [258, 224]].forEach(function (q) { cocos.push(el('circle', { cx: q[0], cy: q[1], r: 6.5, stroke: 'rgba(0,0,0,.25)', 'stroke-width': .8 }, svg)); });
    [[284, 172, 20], [320, 210, -35], [262, 210, 60], [312, 238, 15], [276, 190, -20], [330, 228, 80]].forEach(function (q) { bacilos.push(el('rect', { x: q[0] - 12, y: q[1] - 4.5, width: 24, height: 9, rx: 4.5, transform: 'rotate(' + q[2] + ' ' + q[0] + ' ' + q[1] + ')', stroke: 'rgba(0,0,0,.25)', 'stroke-width': .8 }, svg)); });
    var ley = el('g', {}, svg);
    var lc = el('circle', { cx: 32, cy: 214, r: 6 }, ley), lb = el('rect', { x: 22, y: 232, width: 20, height: 8, rx: 4 }, ley);
    texto(ley, 50, 218, 'Gram (+): violeta', { 'font-weight': 600 });
    var lt = texto(ley, 50, 240, '', { 'font-weight': 600 });
    return {
      pasos: PASO.map(function (p) { return { t: p.n + ': ' + p.r.toLowerCase() + ' (' + p.t + ')', d: 3800 }; }),
      dibuja: function (T) {
        var k = Math.min(3, Math.floor(T)), u = T - k, P = PASO[k], prev = k ? PASO[k - 1] : null;
        if (T >= 4) { k = 3; u = 1; P = PASO[3]; prev = PASO[2]; }
        tN.textContent = P.n; tN.setAttribute('fill', '#8e5aa8'); tR.textContent = P.r;
        var pal = P.a.split(' '), mitad = Math.ceil(pal.length / 2);
        tA1.textContent = pal.slice(0, mitad).join(' '); tA2.textContent = pal.slice(mitad).join(' ');
        tiempo.textContent = u > .4 ? '⏱ ' + P.t : '';
        var y = trayecto([[0, 296, 30], [.22, 296, 96], [.75, 296, 96], [1, 296, 40]], u);
        set(G.g, { transform: 'translate(' + y[0] + ',' + f1(y[1]) + ')' }); set(G.liq, { fill: P.c });
        if (u > .22 && u < .4) set(gota, { cx: 296, cy: f1(lin(98, 112, (u - .22) / .18)), fill: P.c, opacity: 1 }); else set(gota, { opacity: 0 });
        var c = seg(u, .38, .8);
        set(frotis, { fill: mix(prev ? prev.fr : '#e9dfc9', P.fr, c) });
        var pos = mix(prev ? prev.pos : '#e2dbcf', P.pos, c), neg = mix(prev ? prev.neg : '#e2dbcf', P.neg, c);
        cocos.forEach(function (e) { e.setAttribute('fill', pos); }); bacilos.forEach(function (e) { e.setAttribute('fill', neg); });
        lc.setAttribute('fill', P.pos); lb.setAttribute('fill', c > .5 ? P.neg : (prev ? prev.neg : '#e2dbcf'));
        lt.textContent = 'Gram (−): ' + (c > .5 ? P.negTxt : (prev ? prev.negTxt : 'sin teñir'));
      }
    };
  }

  var TECNICAS = { diluciones: diluciones, estria: estria, inclinado: inclinado, extendida: extendida, vertido: vertido, gram: gram };
  var QUIETO = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function montar(caja) {
    if (caja.dataset.listo) return; caja.dataset.listo = '1';
    var fab = TECNICAS[caja.dataset.tec]; if (!fab) return;
    var esc = document.createElement('div'); esc.className = 'tec-escena';
    var svg = el('svg', { viewBox: '0 0 480 270', role: 'img', 'aria-label': 'Animación: ' + (caja.dataset.nombre || '') }, esc);
    var A = fab(svg), N = A.pasos.length;
    var pie = document.createElement('div'); pie.className = 'tec-pie';
    var leyenda = document.createElement('p'); leyenda.className = 'tec-paso'; leyenda.setAttribute('aria-live', 'polite');
    var ctr = document.createElement('div'); ctr.className = 'tec-control';
    var bPlay = document.createElement('button'); bPlay.type = 'button'; bPlay.className = 'tec-btn';
    var bOtra = document.createElement('button'); bOtra.type = 'button'; bOtra.className = 'tec-btn'; bOtra.textContent = '↺ Repetir';
    var lista = document.createElement('ol'); lista.className = 'tec-pasos';
    var chips = A.pasos.map(function (p, i) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = i + 1; b.title = p.t; b.setAttribute('aria-label', 'Paso ' + (i + 1) + ': ' + p.t);
      b.onclick = function () { k = i; t = 0; espera = 0; jugar(true); };
      li.appendChild(b); lista.appendChild(li); return b;
    });
    ctr.appendChild(bPlay); ctr.appendChild(bOtra); ctr.appendChild(lista);
    pie.appendChild(leyenda); pie.appendChild(ctr);
    caja.innerHTML = ''; caja.appendChild(esc); caja.appendChild(pie);

    var k = 0, t = 0, espera = 0, quiere = !QUIETO, visible = false, ultimo = null, raf = null, pasoMostrado = -1;
    function pinta() {
      var T = k >= N ? N : k + t / A.pasos[k].d;
      A.dibuja(T);
      var kk = Math.min(k, N - 1);
      if (kk !== pasoMostrado) {
        pasoMostrado = kk;
        leyenda.innerHTML = '<span class="tec-num">' + (kk + 1) + '</span><span>' + A.pasos[kk].t + '</span>';
        chips.forEach(function (c, i) { c.classList.toggle('es-actual', i === kk); c.classList.toggle('es-hecho', i < kk); });
      }
    }
    function cuadro(ahora) {
      raf = null;
      var dt = ultimo == null ? 16 : Math.min(60, ahora - ultimo); ultimo = ahora;
      if (k < N) { t += dt; if (t >= A.pasos[k].d) { t = 0; k++; } }
      else { espera += dt; if (espera > 2600) { k = 0; t = 0; espera = 0; } }
      pinta();
      if (quiere && visible) raf = requestAnimationFrame(cuadro);
    }
    function jugar(si) {
      quiere = si; bPlay.textContent = si ? '❚❚ Pausa' : '▶ Reproducir'; bPlay.setAttribute('aria-pressed', si ? 'true' : 'false');
      if (si && visible && !raf) { ultimo = null; raf = requestAnimationFrame(cuadro); }
      if (!si) { if (raf) cancelAnimationFrame(raf); raf = null; pinta(); }
    }
    bPlay.onclick = function () { if (k >= N) { k = 0; t = 0; espera = 0; } jugar(!quiere); };
    bOtra.onclick = function () { k = 0; t = 0; espera = 0; jugar(true); };
    if (QUIETO) { k = N; } pinta(); jugar(quiere);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; if (visible && quiere && !raf) { ultimo = null; raf = requestAnimationFrame(cuadro); } });
      }, { threshold: .35 }).observe(caja);
    } else { visible = true; jugar(quiere); }
  }

  function iniciar() {
    Array.prototype.forEach.call(document.querySelectorAll('.tec-anim'), montar);
    Array.prototype.forEach.call(document.querySelectorAll('.tec-alterna'), function (g) {
      if (g.dataset.listo) return; g.dataset.listo = '1';
      var tarjeta = g.closest('.tec-tarjeta');
      Array.prototype.forEach.call(g.querySelectorAll('.tec-alt'), function (b) {
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(g.querySelectorAll('.tec-alt'), function (x) { x.classList.toggle('es-activa', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          Array.prototype.forEach.call(tarjeta.querySelectorAll('.tec-vista'), function (v) { v.hidden = v.dataset.vista !== b.dataset.ver; });
        });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  document.addEventListener('DOMContentLoaded', iniciar);
})();
