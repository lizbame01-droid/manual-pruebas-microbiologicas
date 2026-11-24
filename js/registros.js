/* =============================================================
   REGISTROS  (js/registros.js)
   Lista lo que se envió desde Resultados, las calculadoras y las
   hojas de verificación. Los registros viven en este navegador
   (localStorage); «Exportar a Excel» los descarga como .xlsx e
   «Imprimir» los imprime con formato (sin el resto de la página).
   ============================================================= */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var zona = document.getElementById('reg-lista'); if (!zona) return;
    var fTipo = document.getElementById('reg-tipo'), fTxt = document.getElementById('reg-buscar'), esc = MPM.esc;
    function fecha(iso) { var d = new Date(iso); return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
    function pinta() {
      var todos = MPM.Reg.todos(), tipos = todos.map(function (r) { return r.tipo; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var sel = fTipo.value; fTipo.innerHTML = '<option value="">Todos los tipos</option>' + tipos.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join(''); fTipo.value = sel;
      var q = fTxt.value.toLowerCase();
      var l = todos.filter(function (r) { return (!fTipo.value || r.tipo === fTipo.value) && (!q || JSON.stringify(r).toLowerCase().indexOf(q) >= 0); });
      document.getElementById('reg-cuenta').textContent = l.length + ' de ' + todos.length + ' registros';
      if (!todos.length) { zona.innerHTML = '<div class="vacio"><p><b>Aún no hay registros.</b></p><p>Aparecerán aquí cuando uses «Enviar a registros» en la interpretación de resultados de una prueba, en las calculadoras o en una hoja de verificación.</p></div>'; return; }
      zona.innerHTML = l.map(function (r) {
        var filas = (r.filas || []), cols = ['etapa', 'prueba', 'resultado', 'observacion', 'interpretacion'].filter(function (c) { return filas.some(function (f) { return f[c]; }); });
        var nom = { etapa: 'Etapa', prueba: 'Prueba o campo', resultado: 'Resultado', observacion: 'Observación', interpretacion: 'Interpretación' };
        return '<article class="reg-tarjeta" data-id="' + r.id + '"><header><span class="etq azul">' + esc(r.tipo) + '</span><b>' + esc(r.metodo || '') + '</b><span class="meta">Muestra: <b>' + esc(r.muestra || '—') + '</b>' + (r.alimento ? ' · ' + esc(r.alimento) : '') + ' · ' + fecha(r.fecha) + (r.usuario ? ' · ' + esc(r.usuario) : '') + ' · ' + r.id + '</span></header>' +
          (r.resumen ? '<p style="margin:.6em 0 0"><b>' + esc(r.resumen) + '</b></p>' : '') + (r.notas ? '<p class="nota" style="margin:.3em 0 0">Observaciones: ' + esc(r.notas) + '</p>' : '') +
          '<details class="reg-det"><summary>Ver detalle (' + filas.length + ' filas)</summary><div class="tabla-wrap"><table><thead><tr>' + cols.map(function (c) { return '<th>' + nom[c] + '</th>'; }).join('') + '</tr></thead><tbody>' +
          filas.map(function (f) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(f[c] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
          (r.desarrollo ? '<div class="desarrollo">' + esc(r.desarrollo) + '</div>' : '') + '</details>' +
          '<p class="no-imprimir" style="margin:.8em 0 0"><button type="button" class="btn sec peq" data-a="imprimir1">Imprimir este registro</button> <button type="button" class="btn sec peq" data-a="borrar">Eliminar</button></p></article>';
      }).join('') || '<div class="vacio">Ningún registro coincide con el filtro.</div>';
    }
    zona.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a=borrar]'); if (!b) return;
      if (confirm('¿Eliminar este registro? No se puede deshacer.')) { MPM.Reg.borrar(b.closest('article').dataset.id); pinta(); }
    });
    fTipo.onchange = pinta; fTxt.oninput = pinta;
    function bajar(nombre, tipo, texto) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    }
    var NOM = { etapa: 'Etapa', prueba: 'Prueba o campo', resultado: 'Resultado', observacion: 'Observación', interpretacion: 'Interpretación' };
    function visibles() {
      var q = fTxt.value.toLowerCase();
      return MPM.Reg.todos().filter(function (r) { return (!fTipo.value || r.tipo === fTipo.value) && (!q || JSON.stringify(r).toLowerCase().indexOf(q) >= 0); });
    }
    /* Excel: hoja «Registros» (un renglón por registro) y hoja «Detalle» (un renglón por fila) */
    document.getElementById('reg-xlsx').onclick = function () {
      var todos = MPM.Reg.todos(); if (!todos.length) { MPM.toast('No hay registros para exportar.'); return; }
      function f(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
      var reg = todos.map(function (r) { return [r.id, f(r.fecha), r.usuario || '', r.tipo || '', r.metodo || '', r.muestra || '', r.alimento || '', r.resumen || '', r.notas || '', (r.filas || []).length]; });
      var det = []; todos.forEach(function (r) { (r.filas || []).forEach(function (x) { det.push([r.id, f(r.fecha), r.muestra || '', r.tipo || '', r.metodo || '', x.etapa || '', x.prueba || '', x.resultado || '', x.observacion || '', x.interpretacion || '']); }); });
      MPMXlsx.descargar('registros-manual-microbiologia.xlsx', [
        { nombre: 'Registros', columnas: [{ t: 'ID', ancho: 13 }, { t: 'Fecha', ancho: 18 }, { t: 'Usuario', ancho: 18 }, { t: 'Tipo', ancho: 22 }, { t: 'Método', ancho: 40 }, { t: 'Muestra', ancho: 16 }, { t: 'Alimento', ancho: 22 }, { t: 'Resumen', ancho: 40 }, { t: 'Observaciones', ancho: 30 }, { t: 'Filas de detalle', ancho: 12 }], filas: reg },
        { nombre: 'Detalle', columnas: [{ t: 'ID', ancho: 13 }, { t: 'Fecha', ancho: 18 }, { t: 'Muestra', ancho: 16 }, { t: 'Tipo', ancho: 22 }, { t: 'Método', ancho: 36 }, { t: 'Etapa', ancho: 24 }, { t: 'Prueba o campo', ancho: 36 }, { t: 'Resultado', ancho: 24 }, { t: 'Observación', ancho: 30 }, { t: 'Interpretación', ancho: 34 }], filas: det }
      ]);
    };
    /* Impresión con formato: cada registro como ficha, con su tabla de detalle */
    function fichas(l) {
      return l.map(function (r) {
        var filas = r.filas || [], cols = ['etapa', 'prueba', 'resultado', 'observacion', 'interpretacion'].filter(function (c) { return filas.some(function (x) { return x[c]; }); });
        return '<section class="ficha"><h2>' + esc(r.tipo) + (r.metodo ? ' · ' + esc(r.metodo) : '') + '</h2>' +
          '<table class="meta"><tr><th>Muestra</th><td>' + esc(r.muestra || '—') + '</td><th>Fecha</th><td>' + fecha(r.fecha) + '</td></tr><tr><th>Usuario</th><td>' + esc(r.usuario || '—') + '</td><th>Registro</th><td>' + esc(r.id) + '</td></tr>' +
          (r.alimento ? '<tr><th>Alimento</th><td colspan="3">' + esc(r.alimento) + '</td></tr>' : '') +
          (r.resumen ? '<tr><th>Resultado</th><td colspan="3"><b>' + esc(r.resumen) + '</b></td></tr>' : '') + (r.notas ? '<tr><th>Observaciones</th><td colspan="3">' + esc(r.notas) + '</td></tr>' : '') + '</table>' +
          (filas.length ? '<table class="det"><thead><tr>' + cols.map(function (c) { return '<th>' + NOM[c] + '</th>'; }).join('') + '</tr></thead><tbody>' + filas.map(function (x) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(x[c] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '') +
          (r.desarrollo ? '<pre>' + esc(r.desarrollo) + '</pre>' : '') + '</section>';
      }).join('');
    }
    function imprimir(l) {
      if (!l.length) { MPM.toast('No hay registros para imprimir.'); return; }
      MPMImprimir.documento('Registros', '<div class="encabezado"><div><h1>Registros</h1><small>Manual de pruebas microbiológicas · ENCB-IPN</small></div><small>Impreso el ' + MPMImprimir.hoy() + ' · ' + l.length + ' registro' + (l.length === 1 ? '' : 's') + '</small></div>' + fichas(l),
        '.ficha{break-inside:avoid;margin-bottom:6mm;padding-bottom:4mm;border-bottom:.6pt dashed #9fb2b4}.ficha h2{color:#547071}table.meta th{width:24mm;background:#eef2f2;color:#1c2b2d}table.det{margin-top:2mm}pre{white-space:pre-wrap;font-family:Consolas,monospace;font-size:8pt;background:#f4f7f2;padding:2mm;margin:2mm 0 0}');
    }
    document.getElementById('reg-imprimir').onclick = function () { imprimir(visibles()); };
    zona.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a=imprimir1]'); if (!b) return;
      var id = b.closest('article').dataset.id; imprimir(MPM.Reg.todos().filter(function (r) { return r.id === id; }));
    });
    document.getElementById('reg-borrar-todo').onclick = function () { if (confirm('¿Eliminar TODOS los registros de este navegador? Expórtalos a Excel antes si los necesitas.')) { MPM.Reg.escribir([]); pinta(); } };
    pinta();
  });
})();
