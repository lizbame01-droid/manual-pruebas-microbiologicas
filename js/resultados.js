/* =============================================================
   RESULTADOS E INTERPRETACIÓN  (js/resultados.js)
   Dos tipos de panel:
   - .res-app   : pruebas con resultado + / − (tablas de
                  interpretación del manual).
   - .conteo-app: métodos de cuenta en placa; compara contra el
                  límite de la norma con el plan de 2 clases.
   En ambos casos el resultado puede enviarse a Registros.
   ============================================================= */
(function () {
  var esc = function (s) { return MPM.esc(s); };
  function datosMuestra(app) {
    var o = {}; MPM.$$('[data-campo]', app).forEach(function (c) { o[c.dataset.campo] = c.value.trim(); }); return o;
  }

  /* ---------- Pruebas + / − ---------- */
  function montarRes(app) {
    var d = JSON.parse(app.querySelector('script[type="application/json"]').textContent);
    var zona = app.querySelector('.res-zona'), cuenta = app.querySelector('.res-cuenta'), estado = {};
    var h = '', k = 0;
    d.etapas.forEach(function (et) {
      h += '<div class="res-etapa">' + esc(et.nombre) + '</div>';
      et.pruebas.forEach(function (p) {
        p._k = k++; p._etapa = et.nombre;
        h += '<div class="res-prueba" data-k="' + p._k + '"><h4>' + p.nombreHtml + '</h4><div class="res-ops">' +
          ['pos', 'neg'].map(function (s) {
            var r = p[s]; if (!r) return '';
            return '<button type="button" class="res-op" aria-pressed="false" data-s="' + s + '">' +
              '<span class="res-cab"><span class="signo">' + (s === 'pos' ? '+' : '−') + '</span><span class="etq ' + (s === 'pos' ? 'azul' : '') + '">' + (s === 'pos' ? 'Positivo' : 'Negativo') + '</span></span>' +
              (r.dib ? '<span class="res-imgs res-dib" data-k="' + p._k + '" data-s="' + s + '"></span>' : '') +
              '<span>' + r.obs + '</span></button>';
          }).join('') + '</div><div class="res-salida"></div></div>';
      });
    });
    zona.innerHTML = h;
    // dibujos propios de cada resultado (js/animaciones.js)
    var todas = []; d.etapas.forEach(function (e) { e.pruebas.forEach(function (p) { todas.push(p); }); });
    if (MPM.dibujoResultado) MPM.$$('.res-dib', zona).forEach(function (c) { c.appendChild(MPM.dibujoResultado(todas[+c.dataset.k][c.dataset.s].dib)); });
    var pruebas = []; d.etapas.forEach(function (e) { e.pruebas.forEach(function (p) { pruebas.push(p); }); });
    function refresca() {
      var n = Object.keys(estado).length; cuenta.textContent = n + ' de ' + pruebas.length + ' pruebas registradas';
    }
    zona.addEventListener('click', function (e) {
      var b = e.target.closest('.res-op'); if (!b) return;
      var caja = b.closest('.res-prueba'), p = pruebas[+caja.dataset.k], s = b.dataset.s, sal = caja.querySelector('.res-salida');
      var ya = estado[p._k] === s;
      MPM.$$('.res-op', caja).forEach(function (x) { x.setAttribute('aria-pressed', !ya && x === b); });
      if (ya) { delete estado[p._k]; sal.innerHTML = ''; }
      else { estado[p._k] = s; sal.innerHTML = '<div class="res-interp ' + (s === 'neg' ? 'neg' : '') + '"><b>Interpretación:</b> ' + p[s].int + '</div>'; }
      refresca();
    });
    app.querySelector('[data-a=limpiar]').onclick = function () { estado = {}; MPM.$$('.res-op', zona).forEach(function (x) { x.setAttribute('aria-pressed', false); }); MPM.$$('.res-salida', zona).forEach(function (x) { x.innerHTML = ''; }); refresca(); };
    app.querySelector('[data-a=enviar]').onclick = function () {
      var m = datosMuestra(app);
      if (!m.muestra) { MPM.toast('Escribe el código o lote de la muestra antes de enviar.'); app.querySelector('[data-campo=muestra]').focus(); return; }
      if (!Object.keys(estado).length) { MPM.toast('Selecciona al menos un resultado.'); return; }
      var filas = pruebas.filter(function (p) { return estado[p._k]; }).map(function (p) {
        var s = estado[p._k], div = document.createElement('div');
        function plano(x) { div.innerHTML = x; return div.textContent; }
        return { etapa: p._etapa, prueba: plano(p.nombreHtml), resultado: s === 'pos' ? '+' : '−', observacion: plano(p[s].obs), interpretacion: plano(p[s].int) };
      });
      MPM.Reg.guardar({ tipo: 'Interpretación de resultados', metodo: d.metodo, muestra: m.muestra, alimento: m.alimento, notas: m.notas, filas: filas });
    };
    refresca();
  }

  /* ---------- Cuenta en placa contra el límite ---------- */
  function montarConteo(app) {
    var d = JSON.parse(app.querySelector('script[type="application/json"]').textContent);
    var selA = app.querySelector('[data-c=alimento]'), selP = app.querySelector('[data-c=param]'), zona = app.querySelector('.conteo-zona'), sal = app.querySelector('.conteo-salida');
    selA.innerHTML = d.opciones.map(function (o, i) { return '<option value="' + i + '">' + esc(o.etq) + '</option>'; }).join('');
    function op() { return d.opciones[+selA.value]; }
    function pintaParams() {
      selP.innerHTML = op().params.map(function (p, i) { return '<option value="' + i + '">' + esc(p.nombre) + '</option>'; }).join('');
      selP.closest('.campo').classList.toggle('oculto', op().params.length < 2); pinta();
    }
    function par() { return op().params[+selP.value || 0]; }
    function pinta() {
      var p = par(), o = op();
      var n = p.n || 5, h = '<p><span class="etq azul">Límite m: ' + esc(p.limTxt) + '</span> <span class="etq">n = ' + (p.n || '—') + '</span> <span class="etq">c = ' + (p.c == null ? '—' : p.c) + '</span> <span class="nota">' + esc(o.fuente) + '</span></p>';
      if (p.lim == null) { zona.innerHTML = h + '<div class="aviso ambar">La norma no establece límite para este parámetro en el alimento elegido (NA).</div>'; sal.innerHTML = ''; return; }
      h += '<div class="tabla-wrap"><table class="tabla-calc"><thead><tr><th>Unidad</th><th>Resultado (' + esc(p.unidad) + ')</th><th>¿Excede m?</th></tr></thead><tbody>';
      for (var i = 1; i <= n; i++) h += '<tr><td>' + i + '</td><td><input type="number" min="0" step="any" data-u="' + i + '" aria-label="Resultado de la unidad ' + i + '"></td><td class="exc">—</td></tr>';
      zona.innerHTML = h + '</tbody></table></div>'; sal.innerHTML = '';
    }
    function evalua() {
      var p = par(); if (p.lim == null) return null;
      var vals = [], exc = 0;
      MPM.$$('input[data-u]', zona).forEach(function (inp) {
        var td = inp.closest('tr').querySelector('.exc'), v = parseFloat(inp.value);
        if (isNaN(v)) { td.textContent = '—'; inp.closest('tr').className = ''; return; }
        var e = p.estricto ? v >= p.lim : v > p.lim; if (e) exc++;
        td.textContent = e ? 'Sí' : 'No'; inp.closest('tr').className = e ? 'fuera' : 'dentro'; vals.push({ unidad: +inp.dataset.u, valor: v, excede: e });
      });
      if (!vals.length) { sal.innerHTML = ''; return null; }
      var c = p.c == null ? 0 : p.c, cumple = exc <= c, completo = vals.length >= (p.n || 5);
      sal.innerHTML = '<div class="res-interp ' + (cumple ? '' : 'neg') + '"><b>' + (cumple ? 'CUMPLE' : 'NO CUMPLE') + '</b> · ' + exc + ' unidad(es) con resultado mayor que m; se toleran c = ' + c + '.' + (completo ? '' : ' <em>Faltan unidades por capturar (n = ' + (p.n || 5) + ').</em>') + '</div>';
      return { vals: vals, exc: exc, cumple: cumple };
    }
    selA.onchange = pintaParams; selP.onchange = pinta; zona.addEventListener('input', evalua);
    app.querySelector('[data-a=enviar]').onclick = function () {
      var m = datosMuestra(app), r = evalua(), p = par();
      if (!m.muestra) { MPM.toast('Escribe el código o lote de la muestra antes de enviar.'); app.querySelector('[data-campo=muestra]').focus(); return; }
      if (!r) { MPM.toast('Captura al menos un resultado.'); return; }
      MPM.Reg.guardar({ tipo: 'Cuenta en placa contra límite', metodo: d.metodo, muestra: m.muestra, alimento: op().etq, notas: m.notas,
        resumen: (r.cumple ? 'CUMPLE' : 'NO CUMPLE') + ' · m = ' + p.limTxt + ', n = ' + (p.n || '—') + ', c = ' + (p.c == null ? '—' : p.c),
        filas: r.vals.map(function (v) { return { etapa: p.nombre, prueba: 'Unidad ' + v.unidad, resultado: v.valor + ' ' + p.unidad, observacion: v.excede ? 'Excede m' : 'No excede m', interpretacion: '' }; }) });
    };
    pintaParams();
  }
  document.addEventListener('DOMContentLoaded', function () { MPM.$$('.res-app').forEach(montarRes); MPM.$$('.conteo-app').forEach(montarConteo); });
})();
