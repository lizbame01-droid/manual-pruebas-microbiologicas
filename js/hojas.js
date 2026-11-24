/* =============================================================
   HOJAS DE VERIFICACIÓN  (js/hojas.js)
   Las hojas son las mismas tablas del anexo del manual, con los
   espacios convertidos en campos. Lo que escribes se guarda como
   borrador en este navegador; con "Enviar a registros" queda una
   copia fechada en la página de Registros.
   ============================================================= */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    MPM.$$('.hoja-app').forEach(function (app) {
      var id = app.dataset.hoja, clave = 'mpm.hoja.' + id;
      var campos = MPM.$$('input[data-i], textarea[data-i]', app), est = {};
      try { est = JSON.parse(localStorage.getItem(clave) || '{}'); } catch (e) {}
      var av = app.querySelector('.hoja-avance');
      function marca(c) { if (c.type === 'text') c.classList.toggle('lleno', !!c.value); }
      function avance() {
        var n = campos.filter(function (c) { return c.type === 'checkbox' ? c.checked : c.value.trim(); }).length;
        if (av) av.textContent = n + ' campos llenos';
      }
      campos.forEach(function (c) {
        var v = est[c.dataset.i];
        if (v != null) { if (c.type === 'checkbox') c.checked = !!v; else c.value = v; }
        marca(c);
        c.addEventListener('input', function () {
          est[c.dataset.i] = c.type === 'checkbox' ? c.checked : c.value; localStorage.setItem(clave, JSON.stringify(est)); marca(c); avance();
        });
      });
      // el analista se propone con el nombre de la sesión
      var s = window.MPMAuth && MPMAuth.sesion();
      avance();
      app.querySelector('[data-a=limpiar]').onclick = function () {
        if (!confirm('¿Borrar todo lo capturado en esta hoja?')) return;
        campos.forEach(function (c) { if (c.type === 'checkbox') c.checked = false; else c.value = ''; marca(c); }); est = {}; localStorage.removeItem(clave); avance();
      };
      // Imprime solo la hoja, en tamaño carta (dos páginas), con lo capturado.
      app.querySelector('[data-a=imprimir]').onclick = function () {
        var tablas = MPM.$$('.hoja', app), mitad = Math.ceil(tablas.length / 2), marcada = false;
        var partes = tablas.map(function (h) {
          var c = h.cloneNode(true);
          MPM.$$('input[type=text], textarea', c).forEach(function (i) {
            var o = h.querySelector('[data-i="' + i.dataset.i + '"]'), sp = document.createElement('span');
            sp.className = i.tagName === 'TEXTAREA' ? 'campo-p area' : 'campo-p'; sp.textContent = o ? o.value : '';
            if (i.style.width) sp.style.minWidth = i.style.width;
            i.replaceWith(sp);
          });
          MPM.$$('input[type=checkbox]', c).forEach(function (i) {
            var o = h.querySelector('[data-i="' + i.dataset.i + '"]'), sp = document.createElement('span');
            sp.className = 'casilla'; sp.textContent = o && o.checked ? '✕' : ''; i.replaceWith(sp);
          });
          // la hoja del manual marca «Página 2 de 2»: ahí empieza la segunda hoja carta
          MPM.$$('td.tit', c).forEach(function (td) { if (/P[aá]gina\s*2/i.test(td.textContent)) { td.parentNode.className += ' salto'; marcada = true; } });
          return c.innerHTML;
        });
        // dos páginas tamaño carta: la primera mitad de las tablas en la página 1 y el resto en la 2
        var html = marcada ? '<div class="pagina-hoja">' + partes.join('') + '</div>' :
          '<div class="pagina-hoja">' + partes.slice(0, mitad).join('') + '</div><div class="pagina-hoja">' + partes.slice(mitad).join('') + '</div>';
        MPMImprimir.documento(app.dataset.titulo + ' (' + id + ')', html,
          'tr.salto{break-before:page;page-break-before:always}.pagina-hoja table+table{margin-top:3mm}.pagina-hoja{break-after:page;page-break-after:always}.pagina-hoja:last-child{break-after:auto;page-break-after:auto}' +
          'table{font-size:8.6pt}td{padding:1mm 1.4mm}td.tit{background:#547071;color:#fff;font-weight:700;font-size:10.5pt}td.sec{background:#d7ebc8;font-weight:700}td.rot{background:#eef2f2;font-weight:600}' +
          '.campo-p{display:inline-block;min-width:14mm;border-bottom:.6pt solid #1c2b2d;min-height:3.6mm;padding:0 1mm}.campo-p.area{display:block;width:100%;min-height:7mm;border-bottom:0}' +
          '.casilla{display:inline-block;width:3.2mm;height:3.2mm;border:.6pt solid #1c2b2d;text-align:center;line-height:3mm;font-size:7pt;vertical-align:middle;margin-left:1mm}label.op{white-space:nowrap;margin-right:3mm}tr{break-inside:avoid}');
      };
      app.querySelector('[data-a=enviar]').onclick = function () {
        var filas = [], muestra = '';
        campos.forEach(function (c) {
          var lleno = c.type === 'checkbox' ? c.checked : c.value.trim(); if (!lleno) return;
          var et = c.dataset.et || '';
          if (!muestra && /lote de la muestra/i.test(et) && c.type !== 'checkbox') muestra = c.value.trim();
          filas.push({ etapa: c.dataset.sec || '', prueba: et, resultado: c.type === 'checkbox' ? '✓ ' + (c.dataset.op || '') : c.value.trim(), observacion: '', interpretacion: '' });
        });
        if (!filas.length) { MPM.toast('La hoja está vacía.'); return; }
        if (!muestra) { MPM.toast('Escribe el código o lote de la muestra en la hoja antes de enviarla.'); return; }
        MPM.Reg.guardar({ tipo: 'Hoja de verificación', metodo: app.dataset.titulo + ' (' + id + ')', muestra: muestra, filas: filas });
      };
    });
  });
})();
