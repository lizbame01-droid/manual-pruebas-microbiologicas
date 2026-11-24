/* =============================================================
   PREPARACIÓN DE MEDIOS  (js/medios.js)
   Ajusta las cantidades de una fórmula al volumen que se quiere
   preparar (regla de tres sobre la fórmula del manual).
   ============================================================= */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    MPM.$$('.receta-escala').forEach(function (z) {
      var inp = z.querySelector('input'), base = parseFloat(z.dataset.base), tabla = z.parentElement.querySelector('table');
      function aplica() {
        var v = parseFloat(inp.value), f = v > 0 ? v / base : 1;
        MPM.$$('td[data-cant]', tabla).forEach(function (td) {
          var c = parseFloat(td.dataset.cant) * f, hi = td.dataset.cant2 ? parseFloat(td.dataset.cant2) * f : null;
          var n = function (x) { return x.toLocaleString('es-MX', { maximumFractionDigits: x < 1 ? 4 : (x < 10 ? 3 : 2) }); };
          td.textContent = n(c) + (hi != null ? ' a ' + n(hi) : '') + ' ' + td.dataset.uni; td.classList.toggle('escalado', Math.abs(f - 1) > 1e-9);
        });
      }
      inp.addEventListener('input', aplica);
      z.querySelector('button').onclick = function () { inp.value = base; aplica(); };
    });
  });
})();
