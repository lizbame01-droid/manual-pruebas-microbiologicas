/* =============================================================
   PIEZAS COMUNES DE LAS CALCULADORAS  (js/calc-comun.js)
   - Asistente por pasos (indicador + botones Atrás / Siguiente)
   - Tabla de diluciones: alícuota + diluyente por tubo
   - Formato de números
   ============================================================= */
window.MPMCalc = (function () {
  function fmt(v, dec) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a !== 0 && (a < 0.001)) return v.toExponential(2).replace('e', ' × 10^');
    return v.toLocaleString('es-MX', { maximumFractionDigits: dec == null ? (a < 10 ? 2 : (a < 100 ? 1 : 0)) : dec });
  }
  function sup(n) { return String(n).replace(/[-0-9]/g, function (c) { return { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c]; }); }
  function cient(v) {
    if (!isFinite(v) || v === 0) return fmt(v);
    var e = Math.floor(Math.log10(Math.abs(v)) + 1e-9), m = v / Math.pow(10, e);
    return m.toLocaleString('es-MX', { maximumFractionDigits: 2 }) + ' × 10' + sup(e);
  }
  function dilTxt(d) { // d = fracción acumulada (0.01 → 10⁻²)
    if (!isFinite(d) || d <= 0) return '—';
    var e = Math.log10(d);
    if (Math.abs(e - Math.round(e)) < 1e-6) return Math.round(e) === 0 ? 'directa (10⁰)' : '10' + sup(Math.round(e));
    return '1:' + fmt(1 / d);
  }
  function sig2(v) { if (!isFinite(v) || v === 0) return v; var e = Math.floor(Math.log10(Math.abs(v))); var f = Math.pow(10, e - 1); return Math.round(v / f + 1e-9) * f; }

  /* Asistente: recibe el contenedor y una función validar(paso) → true/false */
  function asistente(raiz, alCambiar, validar) {
    var paneles = MPM.$$('.paso-panel', raiz), ind = MPM.$$('.pasos-ind li', raiz), i = 0;
    var bA = raiz.querySelector('[data-nav=atras]'), bS = raiz.querySelector('[data-nav=sig]');
    function ir(k) {
      i = Math.max(0, Math.min(paneles.length - 1, k));
      paneles.forEach(function (p, j) { p.hidden = j !== i; });
      ind.forEach(function (li, j) { li.classList.toggle('actual', j === i); li.classList.toggle('hecho', j < i); });
      bA.disabled = i === 0; bS.hidden = i === paneles.length - 1;
      if (alCambiar) alCambiar(i);
      raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    bA.onclick = function () { ir(i - 1); };
    bS.onclick = function () { if (!validar || validar(i)) ir(i + 1); };
    ind.forEach(function (li, j) { li.style.cursor = 'pointer'; li.onclick = function () { if (j < i) ir(j); }; });
    ir(0);
    return { ir: ir, paso: function () { return i; } };
  }

  /* Tabla de diluciones. estado.tubos = [{ali, dil}] ; unidad = 'g' | 'mL' */
  function tablaDiluciones(cont, estado, alCambiar) {
    function acumuladas() {
      var ac = 1; return estado.tubos.map(function (t) { var d = t.ali / (t.ali + t.dil); ac *= (isFinite(d) && d > 0 ? d : NaN); return ac; });
    }
    function pinta() {
      var ac = acumuladas();
      var h = '<div class="tubos">' + estado.tubos.map(function (t, k) {
        var alto = Math.max(12, Math.min(88, 88 + Math.log10(ac[k] || 1e-9) * 13));
        return '<div class="tubo-v"><div class="vid"><i style="height:78%;opacity:' + (alto / 100 + .1).toFixed(2) + '"></i></div><b>Tubo ' + (k + 1) + '</b><br>' + dilTxt(ac[k]) + '</div>';
      }).join('<div style="align-self:center;color:var(--lila-600)">→</div>') + '</div>';
      h += '<div class="tabla-wrap"><table class="tabla-calc"><thead><tr><th>Tubo</th><th>Se toma de</th><th>Alícuota</th><th>Diluyente (mL)</th><th>Dilución del tubo</th><th>Dilución acumulada</th><th>Factor de dilución (F.D.)</th></tr></thead><tbody>';
      estado.tubos.forEach(function (t, k) {
        var u = k === 0 ? estado.unidad : 'mL';
        h += '<tr><td><b>' + (k + 1) + '</b></td><td>' + (k === 0 ? 'Muestra' : 'Tubo ' + k) + '</td>' +
          '<td><input type="number" min="0" step="any" value="' + t.ali + '" data-k="' + k + '" data-f="ali" aria-label="Alícuota del tubo ' + (k + 1) + '"> ' + u + '</td>' +
          '<td><input type="number" min="0" step="any" value="' + t.dil + '" data-k="' + k + '" data-f="dil" aria-label="Diluyente del tubo ' + (k + 1) + '"></td>' +
          '<td>1:' + fmt((t.ali + t.dil) / t.ali) + '</td><td>' + dilTxt(ac[k]) + '</td><td>' + fmt(1 / ac[k]) + '</td></tr>';
      });
      cont.innerHTML = h + '</tbody></table></div>';
    }
    cont.addEventListener('change', function (e) {
      var inp = e.target.closest('input[data-k]'); if (!inp) return;
      var v = parseFloat(inp.value); estado.tubos[+inp.dataset.k][inp.dataset.f] = isNaN(v) ? 0 : v; pinta(); if (alCambiar) alCambiar();
    });
    pinta();
    return { pinta: pinta, acumuladas: acumuladas };
  }
  function ajustarTubos(estado, n) {
    while (estado.tubos.length < n) estado.tubos.push(estado.tubos.length === 0 ? { ali: 10, dil: 90 } : { ali: 1, dil: 9 });
    estado.tubos.length = n;
  }
  /* Recorrido vertical: cada paso aparece debajo del anterior al elegir una opción.
     mostrar(n) hace visible el paso n (y los anteriores) y lo lleva a la vista. */
  function vertical(raiz) {
    var pasos = MPM.$$('.paso-v', raiz);
    function mostrar(n, mover) {
      var nuevo = null;
      pasos.forEach(function (p) { var k = +p.dataset.paso; if (k <= n && p.hidden) { p.hidden = false; nuevo = p; } });
      if (nuevo && mover !== false) setTimeout(function () { nuevo.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      return nuevo;
    }
    return { mostrar: mostrar, visible: function (n) { var p = raiz.querySelector('.paso-v[data-paso="' + n + '"]'); return p && !p.hidden; } };
  }
  return { fmt: fmt, cient: cient, dilTxt: dilTxt, sig2: sig2, asistente: asistente, vertical: vertical, tablaDiluciones: tablaDiluciones, ajustarTubos: ajustarTubos };
})();
