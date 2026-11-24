/* =============================================================
   CALCULADORA UFC  (js/calc-ufc.js)
   Recorrido vertical: cada respuesta abre el paso siguiente debajo.
   1) g o mL · 2) número de tubos · 3) alícuota y diluyente de cada
   tubo e intervalo contable · 4) tubos usados y colonias · 5) resultado
   (se recalcula solo al escribir las colonias).
   Fórmula del manual:  UFC = (# colonias × F.D.) / volumen de siembra
   Desde una prueba se puede abrir con ?min=25&max=250&vol=1.
   ============================================================= */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var raiz = document.getElementById('calc-ufc'); if (!raiz) return;
    var C = MPMCalc, V = C.vertical(raiz), q = new URLSearchParams(location.search);
    var E = { unidad: null, tubos: [], usados: {}, vol: parseFloat(q.get('vol')) || 1 };
    var tabla = null;
    var inMin = raiz.querySelector('#ufc-min'), inMax = raiz.querySelector('#ufc-max');
    if (q.get('min')) inMin.value = q.get('min');
    if (q.get('max')) inMax.value = q.get('max');
    function intervalo() { var a = parseFloat(inMin.value), b = parseFloat(inMax.value); return { min: isNaN(a) ? 0 : a, max: isNaN(b) ? Infinity : b }; }

    /* 1. Unidad */
    MPM.$$('[data-unidad]', raiz).forEach(function (b) {
      b.onclick = function () {
        E.unidad = b.dataset.unidad;
        MPM.$$('[data-unidad]', raiz).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        if (tabla) tabla.pinta();
        if (V.visible(4)) pintaUso();
        V.mostrar(2);
      };
    });

    /* 2. Número de tubos */
    var botN = MPM.$$('#ufc-ntubos [data-n]', raiz);
    botN.forEach(function (b) {
      b.onclick = function () {
        var n = +b.dataset.n;
        botN.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        C.ajustarTubos(E, n);
        if (!tabla) tabla = C.tablaDiluciones(raiz.querySelector('#ufc-tabla-dil'), E, function () { if (V.visible(4)) pintaUso(); });
        else tabla.pinta();
        if (V.visible(4)) pintaUso();
        V.mostrar(3);
      };
    });

    /* 3. Continuar → 4 */
    raiz.querySelector('[data-sig="4"]').onclick = function () {
      if (tabla.acumuladas().some(function (x) { return !isFinite(x) || x <= 0; })) { MPM.toast('Revisa la alícuota y el diluyente de cada tubo.'); return; }
      pintaUso(); V.mostrar(4);
    };
    [inMin, inMax].forEach(function (i) { i.addEventListener('input', function () { if (V.visible(4)) { estados(); calcula(); } }); });

    /* 4. Tubos usados y colonias */
    var zonaUso = raiz.querySelector('#ufc-uso');
    function pintaUso() {
      var ac = tabla.acumuladas(), iv = intervalo();
      var h = '<p>Marca los tubos que sembraste y escribe las colonias contadas en cada placa (intervalo contable: <b>' + iv.min + ' a ' + iv.max + '</b> colonias).</p>';
      h += '<div class="tabla-wrap"><table class="tabla-calc"><thead><tr><th>Usar</th><th>Tubo</th><th>Dilución</th><th>Volumen sembrado (mL)</th><th>Colonias placa 1</th><th>Colonias placa 2</th><th>Estado</th></tr></thead><tbody>';
      E.tubos.forEach(function (t, k) {
        var u = E.usados[k] || (E.usados[k] = { on: false, vol: E.vol, p1: '', p2: '' });
        h += '<tr data-k="' + k + '"><td><input type="checkbox" data-f="on" ' + (u.on ? 'checked' : '') + ' aria-label="Usar tubo ' + (k + 1) + '"></td><td><b>' + (k + 1) + '</b></td><td>' + C.dilTxt(ac[k]) + '</td>' +
          '<td><input type="number" min="0" step="any" data-f="vol" value="' + u.vol + '" aria-label="Volumen sembrado, tubo ' + (k + 1) + '"></td>' +
          '<td><input type="number" min="0" step="1" data-f="p1" value="' + u.p1 + '" aria-label="Colonias placa 1, tubo ' + (k + 1) + '"></td><td><input type="number" min="0" step="1" data-f="p2" value="' + u.p2 + '" aria-label="Colonias placa 2, tubo ' + (k + 1) + '"></td>' +
          '<td class="est">—</td></tr>';
      });
      zonaUso.innerHTML = h + '</tbody></table></div><p class="nota">Si solo sembraste una placa por dilución, deja vacía la placa 2. El resultado aparece abajo en cuanto escribes las colonias.</p>';
      estados(); calcula();
    }
    function cuentas(u) { return [u.p1, u.p2].filter(function (x) { return x !== '' && !isNaN(parseFloat(x)); }).map(parseFloat); }
    function estados() {
      var iv = intervalo();
      MPM.$$('tr[data-k]', zonaUso).forEach(function (tr) {
        var u = E.usados[+tr.dataset.k], cs = cuentas(u), td = tr.querySelector('.est');
        tr.className = '';
        if (!cs.length) { td.textContent = '—'; return; }
        var dentro = cs.filter(function (c) { return c >= iv.min && c <= iv.max; }).length;
        if (dentro === cs.length) { td.textContent = 'Dentro del intervalo'; tr.className = 'dentro'; }
        else if (dentro) { td.textContent = 'Una placa fuera del intervalo'; tr.className = 'fuera'; }
        else { td.textContent = cs.every(function (c) { return c < iv.min; }) ? 'Menos de ' + iv.min : (cs.every(function (c) { return c > iv.max; }) ? 'Más de ' + iv.max : 'Fuera del intervalo'); tr.className = 'fuera'; }
        if (dentro && !u.on && !u._tocado) { u.on = true; tr.querySelector('[data-f=on]').checked = true; }
      });
    }
    zonaUso.addEventListener('input', function (e) {
      var inp = e.target.closest('[data-f]'); if (!inp) return; var u = E.usados[+inp.closest('tr').dataset.k];
      if (inp.dataset.f === 'on') { u.on = inp.checked; u._tocado = true; } else u[inp.dataset.f] = inp.value;
      estados(); calcula();
    });

    /* 5. Resultado (automático) */
    var zonaRes = raiz.querySelector('#ufc-res');
    function calcula() {
      var ac = tabla.acumuladas(), iv = intervalo(), U = 'UFC/' + (E.unidad || 'g'), lin = [], filas = [];
      E.tubos.forEach(function (t, k) {
        var u = E.usados[k]; if (!u || !u.on) return; var cs = cuentas(u); if (!cs.length) return;
        var prom = cs.reduce(function (a, b) { return a + b; }, 0) / cs.length, fd = 1 / ac[k], vol = parseFloat(u.vol) || 1;
        var val = prom * fd / vol;
        filas.push({ k: k, cs: cs, prom: prom, fd: fd, vol: vol, val: val, dentro: cs.some(function (c) { return c >= iv.min && c <= iv.max; }), todoCero: cs.every(function (c) { return c === 0; }) });
        lin.push('Tubo ' + (k + 1) + ' (' + C.dilTxt(ac[k]) + '): colonias ' + cs.join(' y ') + ' → promedio ' + C.fmt(prom, 1) +
          '\n   ' + C.fmt(prom, 1) + ' × ' + C.fmt(fd) + ' ÷ ' + C.fmt(vol) + ' mL = ' + C.fmt(val) + ' ' + U);
      });
      if (!filas.length) { return null; }
      V.mostrar(5, !V.visible(5));
      var final, leyenda = '', regla = '';
      var enRango = filas.filter(function (f) { return f.dentro; });
      if (filas.every(function (f) { return f.todoCero; })) {
        var men = filas.reduce(function (a, b) { return a.fd < b.fd ? a : b; });
        final = men.fd / men.vol; leyenda = 'menor'; regla = 'Placas sin colonias: se reporta como menor que una vez el valor de la dilución más baja usada.';
      } else if (enRango.length >= 2) {
        final = enRango.reduce(function (s, f) { return s + f.val; }, 0) / enRango.length;
        regla = 'Dos diluciones en el intervalo: se calcula la cuenta de cada dilución y después se promedian entre sí.';
      } else if (enRango.length === 1) { final = enRango[0].val; regla = 'Una dilución dentro del intervalo: se calcula la cuenta promedio y se reporta.'; }
      else {
        final = filas.reduce(function (s, f) { return s + f.val; }, 0) / filas.length; leyenda = 'estimado';
        regla = 'Ninguna placa está dentro del intervalo de ' + iv.min + ' a ' + iv.max + ' colonias: el resultado lleva la leyenda «valor estimado».';
      }
      var txt = (leyenda === 'menor' ? '< ' : '') + C.fmt(final) + ' ' + U;
      var notas = zonaRes.querySelector('#ufc-notas'), mues = zonaRes.querySelector('#ufc-muestra');
      var keep = { m: mues ? mues.value : '', n: notas ? notas.value : '', t: (zonaRes.querySelector('#inf-t') || {}).value || '', c: (zonaRes.querySelector('#inf-c') || {}).value || '' };
      zonaRes.innerHTML = '<div class="resultado-final"><div class="valor">' + txt + '</div><div>' + (leyenda === 'menor' ? '' : '≈ ' + C.cient(final) + ' ' + U) + (leyenda === 'estimado' ? ' · <span class="leyenda">valor estimado</span>' : '') + '</div></div>' +
        '<div class="aviso">' + regla + '</div><h3>Desarrollo</h3><div class="desarrollo">' + MPM.esc(lin.join('\n')) + '</div>' +
        '<section class="informe"><header><span>Informe de la prueba</span></header><ol><li><p>Unidades formadoras de colonias, <b>' + txt + '</b>, incubadas <input type="text" size="4" id="inf-t" aria-label="Tiempo de incubación" value="' + MPM.esc(keep.t) + '"> horas o días a <input type="text" size="4" id="inf-c" aria-label="Temperatura" value="' + MPM.esc(keep.c) + '"> ºC.</p></li></ol></section>' +
        '<div class="form-fila no-imprimir"><div class="campo"><label for="ufc-muestra">Código o lote de la muestra</label><input id="ufc-muestra" type="text" value="' + MPM.esc(keep.m) + '"></div><div class="campo"><label for="ufc-notas">Observaciones</label><input id="ufc-notas" type="text" value="' + MPM.esc(keep.n) + '"></div></div>' +
        '<p class="no-imprimir"><button type="button" class="btn azul" id="ufc-guardar">Enviar a registros</button></p>';
      document.getElementById('ufc-guardar').onclick = function () {
        var mu = document.getElementById('ufc-muestra').value.trim();
        if (!mu) { MPM.toast('Escribe el código o lote de la muestra.'); document.getElementById('ufc-muestra').focus(); return; }
        MPM.Reg.guardar({ tipo: 'Calculadora UFC', metodo: 'Cuenta en placa (intervalo ' + iv.min + '–' + iv.max + ')', muestra: mu, notas: document.getElementById('ufc-notas').value, resumen: txt + (leyenda === 'estimado' ? ' (valor estimado)' : ''),
          filas: filas.map(function (f) { return { etapa: 'Tubo ' + (f.k + 1) + ' · ' + C.dilTxt(ac[f.k]), prueba: 'Colonias: ' + f.cs.join(' y '), resultado: C.fmt(f.val) + ' ' + U, observacion: 'F.D. ' + C.fmt(f.fd) + ' · ' + C.fmt(f.vol) + ' mL sembrados', interpretacion: f.dentro ? 'Dentro del intervalo' : 'Fuera del intervalo' }; }),
          desarrollo: lin.join('\n') + '\n' + regla });
      };
      return final;
    }
  });
})();
