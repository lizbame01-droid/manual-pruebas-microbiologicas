/* =============================================================
   CALCULADORA NMP  (js/calc-nmp.js)
   Igual que la versión anterior: 1) Muestra · 2) Siembra (tubos por
   dilución, inóculo por tubo y primer tubo que se lee) · 3) Lectura de
   los tubos (0 a n positivos por dilución) · 4) Resultado.
   - Las tres diluciones consecutivas se eligen solas según H.8.5.3 de
     la NOM-210-SSA1-2014.
   - El NMP se calcula por máxima verosimilitud (el principio con el que
     se construyen las tablas H.8.4.1 y H.8.4.2) y se muestra también el
     ajuste del manual: valor de tabla × o ÷ 10.
   ============================================================= */
(function () {
  /* NMP por máxima verosimilitud. v[i] = porción de muestra por tubo, n[i] tubos, p[i] positivos */
  function nmp(v, n, p) {
    var tot = 0, pos = 0, i; for (i = 0; i < v.length; i++) { tot += n[i] * v[i]; pos += p[i]; }
    if (pos === 0) return { menor: true, valor: 1 / tot };
    if (p.every(function (x, k) { return x === n[k]; })) {
      var q = p.slice(); q[q.length - 1] -= 1; return { mayor: true, valor: nmp(v, n, q).valor };
    }
    function f(l) { var s = 0; for (var k = 0; k < v.length; k++) if (p[k]) s += p[k] * v[k] / (1 - Math.exp(-l * v[k])); return s - tot; }
    var lo = 1e-9, hi = 1e12; for (i = 0; i < 300; i++) { var mid = Math.sqrt(lo * hi); if (f(mid) > 0) lo = mid; else hi = mid; }
    return { valor: Math.sqrt(lo * hi) };
  }
  window.MPMnmp = nmp;

  /* Selección de tres diluciones consecutivas (H.8.5.3). pos: positivos de mayor a menor porción */
  function seleccionar(pos, tubos) {
    var n = pos.length, inicio = -1, todos = [];
    pos.forEach(function (p, i) { if (p === tubos) todos.push(i); });
    if (todos.length) inicio = Math.min(todos[todos.length - 1], n - 3);
    else {
      for (var s = 0; s + 2 < n; s++) if (pos[s + 1] > 0) { inicio = s; break; }
      if (inicio === -1) { var pr = pos.findIndex(function (p) { return p > 0; }); inicio = pr === -1 ? 0 : Math.min(Math.max(pr - 1, 0), n - 3); }
    }
    var idx = [inicio, inicio + 1, inicio + 2], sel = idx.map(function (i) { return pos[i]; }), sumado = false;
    if (idx[2] < n - 1 && pos[n - 1] > 0) { sel[2] = Math.min(tubos, sel[2] + pos[n - 1]); sumado = true; }
    return { indices: idx, positivos: sel, sumado: sumado };
  }
  window.MPMnmpSel = seleccionar;

  var DET = { ct: { nombre: 'Coliformes totales', medio: 'caldo lauril triptosa' }, cf: { nombre: 'Coliformes fecales', medio: 'caldo EC' }, ec: { nombre: 'E. coli', medio: 'tubos de caldo EC confirmados' } };
  var SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function dil(n) { return '10' + String(-n).split('').map(function (c) { return SUP[c]; }).join(''); }

  document.addEventListener('DOMContentLoaded', function () {
    var raiz = document.getElementById('calc-nmp'); if (!raiz) return;
    var C = MPMCalc, E = { unidad: 'g', det: 'ct', tubos: 3, niveles: 3, pos: [] };
    var cont = raiz.querySelector('#nmp-niveles'), resumen = raiz.querySelector('#nmp-siembra'), res = raiz.querySelector('#nmp-res');
    var selP = raiz.querySelector('#nmp-primero'), inoc = raiz.querySelector('#nmp-inoculo'), bG = raiz.querySelector('#nmp-guardar');
    for (var k = 1; k <= 8; k++) selP.insertAdjacentHTML('beforeend', '<option value="' + k + '">Tubo ' + k + ' (' + dil(k) + ')</option>');
    var ultimo = null;

    function primero() { return +selP.value || 1; }
    function porcion(i) { var v = parseFloat(inoc.value); return v > 0 ? +(v * Math.pow(10, -(primero() + i))).toPrecision(12) : null; }
    function cant(c) { return c == null ? '—' : c.toLocaleString('es-MX', { maximumFractionDigits: 7 }) + ' ' + E.unidad; }

    MPM.$$('.segmentado', raiz).forEach(function (g) {
      MPM.$$('button', g).forEach(function (b) {
        b.onclick = function () {
          MPM.$$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          var v = b.dataset.v, gr = g.dataset.grupo;
          if (gr === 'tubos') { E.tubos = +v; E.pos = E.pos.map(function (p) { return p != null && p <= E.tubos ? p : null; }); }
          else E[gr] = v;
          dibujar(); calcular();
        };
      });
    });

    function tubosHTML(n, m) { var s = ''; for (var t = 0; t < n; t++) s += '<span class="tubo-nmp' + (m != null && t < m ? ' pos' : '') + '"></span>'; return '<div class="nivel-tubos" aria-hidden="true">' + s + '</div>'; }
    function dibujar() {
      var h = '';
      for (var i = 0; i < E.niveles; i++) {
        var num = primero() + i, c = porcion(i);
        h += '<div class="nivel" data-i="' + i + '"><div class="nivel-cab"><strong>Tubo ' + num + '</strong><span>dilución ' + dil(num) + ' · ' + cant(c) + ' de muestra por tubo</span></div>' +
          '<div class="pastillas" role="radiogroup" aria-label="Tubos positivos en la dilución ' + dil(num) + '">';
        for (var v = 0; v <= E.tubos; v++) h += '<button type="button" class="pastilla" data-v="' + v + '" aria-pressed="' + (E.pos[i] === v) + '">' + v + '</button>';
        h += '</div>' + tubosHTML(E.tubos, E.pos[i]) + '<span class="nivel-estado"></span></div>';
      }
      cont.innerHTML = h;
      raiz.querySelector('#nmp-agregar').disabled = E.niveles >= 6;
      raiz.querySelector('#nmp-quitar').disabled = E.niveles <= 3;
      var v = parseFloat(inoc.value), por = []; for (var j = 0; j < E.niveles; j++) por.push(cant(porcion(j)));
      resumen.textContent = v > 0 ? (E.tubos + ' tubos por dilución, ' + v.toLocaleString('es-MX') + ' mL de inóculo por tubo. Muestra por tubo en la serie leída: ' + por.join(', ') + '. Cada tubo de la serie es la décima parte del anterior (el tubo 1 es la dilución ' + dil(1) + ').') : 'Escribe el inóculo por tubo en mililitros (por ejemplo, 1).';
    }
    cont.addEventListener('click', function (e) {
      var b = e.target.closest('.pastilla'); if (!b) return;
      var niv = b.closest('.nivel'), i = +niv.dataset.i; E.pos[i] = +b.dataset.v;
      MPM.$$('.pastilla', niv).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      niv.querySelector('.nivel-tubos').outerHTML = tubosHTML(E.tubos, E.pos[i]);
      calcular();
    });
    raiz.querySelector('#nmp-agregar').onclick = function () { if (E.niveles < 6) { E.niveles++; dibujar(); calcular(); } };
    raiz.querySelector('#nmp-quitar').onclick = function () { if (E.niveles > 3) { E.niveles--; E.pos.length = E.niveles; dibujar(); calcular(); } };
    selP.onchange = function () { dibujar(); calcular(); };
    inoc.oninput = function () { dibujar(); calcular(); };

    function vacio(t) { ultimo = null; bG.disabled = true; res.innerHTML = '<p class="calc-vacio">' + t + '</p>'; MPM.$$('.nivel', cont).forEach(function (n) { n.classList.remove('usado'); n.querySelector('.nivel-estado').textContent = ''; }); }
    function calcular() {
      var pos = [], por = [];
      for (var i = 0; i < E.niveles; i++) { pos.push(E.pos[i]); por.push(porcion(i)); }
      if (por.some(function (x) { return x == null; })) return vacio('Escribe el inóculo por tubo para calcular.');
      if (pos.some(function (x) { return x == null; })) return vacio('Elige los tubos positivos de cada dilución (0 si no hubo).');
      var s = seleccionar(pos, E.tubos), pv = s.indices.map(function (i) { return por[i]; }), n = [E.tubos, E.tubos, E.tubos];
      var r = nmp(pv, n, s.positivos), t = nmp([0.1, 0.01, 0.001], n, s.positivos), comb = s.positivos.join('-');
      var pre = r.menor ? '< ' : (r.mayor ? '> ' : ''), U = 'NMP/' + E.unidad, val = C.sig2(r.valor), txt = pre + C.fmt(val) + ' ' + U;
      var factor = pv[0] / 0.1;
      var ajuste = Math.abs(factor - 1) < 1e-9 ? 'Las porciones coinciden con las de la tabla (0.1, 0.01 y 0.001 ' + E.unidad + '): el valor se toma directo.' :
        (factor < 1 ? 'Porciones ' + C.fmt(1 / factor) + ' veces menores que las de la tabla: valor de tabla × ' + C.fmt(1 / factor) + '.' : 'Porciones ' + C.fmt(factor) + ' veces mayores que las de la tabla: valor de tabla ÷ ' + C.fmt(factor) + '.');
      MPM.$$('.nivel', cont).forEach(function (nv, i) {
        var k = s.indices.indexOf(i), est = nv.querySelector('.nivel-estado');
        nv.classList.toggle('usado', k >= 0);
        est.textContent = k >= 0 ? 'Usado en la combinación' + (k === 2 && s.sumado ? ' (con los positivos del último tubo sumados)' : '') : (i === E.niveles - 1 && s.sumado ? 'Sumado al último usado' : 'No se usa');
      });
      var d = DET[E.det];
      res.innerHTML = '<div class="resultado-final"><div class="nota" style="color:#dfe9dc">' + (E.det === 'ec' ? '<em>E. coli</em>' : d.nombre) + ' · combinación ' + comb + ' · serie de ' + E.tubos + ' tubos</div><div class="valor">' + txt + '</div></div>' +
        '<div class="aviso">Valor de tabla para ' + comb + ' con porciones de 0.1, 0.01 y 0.001 ' + E.unidad + ': <b>' + (t.menor ? '< ' : (t.mayor ? '> ' : '')) + C.fmt(C.sig2(t.valor)) + '</b>. ' + ajuste + '</div>' +
        '<p class="nota">Diluciones elegidas según H.8.5.3: ' + s.indices.map(function (i) { return dil(primero() + i); }).join(', ') + '. Confirma el valor con la tabla ' + (E.tubos === 3 ? 'H.8.4.1' : 'H.8.4.2') + ' del Apéndice H de la NOM-210-SSA1-2014 antes de informarlo.</p>';
      ultimo = { txt: txt, comb: comb, d: d, pv: pv, r: r };
      bG.disabled = false;
    }
    bG.onclick = function () {
      if (!ultimo) return;
      var mu = raiz.querySelector('#nmp-muestra').value.trim();
      if (!mu) { MPM.toast('Escribe el código o lote de la muestra.'); raiz.querySelector('#nmp-muestra').focus(); return; }
      var obs = 'Porciones: ' + ultimo.pv.map(function (x) { return C.fmt(x, 6); }).join(', ') + ' ' + E.unidad;
      MPM.Reg.guardar({ tipo: 'Calculadora NMP', metodo: 'Coliformes totales, fecales y E. coli por NMP', muestra: mu, notas: raiz.querySelector('#nmp-notas').value,
        resumen: ultimo.d.nombre + ': ' + ultimo.txt,
        filas: [{ etapa: ultimo.d.nombre + ' (' + ultimo.d.medio + ')', prueba: 'Combinación ' + ultimo.comb + ' (' + E.tubos + ' tubos)', resultado: ultimo.txt, observacion: obs, interpretacion: ultimo.r.menor ? 'Serie sin tubos positivos' : (ultimo.r.mayor ? 'Todos los tubos positivos' : '') }],
        desarrollo: ultimo.d.nombre + ': combinación ' + ultimo.comb + ' · ' + obs + ' → ' + ultimo.txt });
    };
    dibujar(); calcular();
  });
})();
