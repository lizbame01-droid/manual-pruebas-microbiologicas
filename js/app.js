/* =============================================================
   INTERACCIONES GENERALES  (js/app.js)
   Menú, pestañas, citas, acordeones, tarjetas, línea de tiempo,
   glosario, cuestionarios, listas de verificación y buscador.
   ============================================================= */
(function () {
  var RAIZ = document.documentElement.dataset.raiz || '';
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Aviso flotante ---------- */
  var toastEl;
  function toast(html, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = html; toastEl.classList.add('ver');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('ver'); }, ms || 3600);
  }

  /* ---------- Registros (se guardan en este navegador) ---------- */
  var Reg = {
    clave: 'mpm.registros',
    todos: function () { try { return JSON.parse(localStorage.getItem(this.clave) || '[]'); } catch (e) { return []; } },
    escribir: function (l) { localStorage.setItem(this.clave, JSON.stringify(l)); },
    guardar: function (r) {
      var s = window.MPMAuth && MPMAuth.sesion();
      r.id = 'R' + Date.now().toString(36).toUpperCase();
      r.fecha = new Date().toISOString();
      r.usuario = (s && s.etiqueta) || '';
      var l = this.todos(); l.unshift(r); this.escribir(l);
      toast('Guardado en registros. <a href="' + RAIZ + 'paginas/registros.html">Ver registros</a>');
      return r;
    },
    borrar: function (id) { this.escribir(this.todos().filter(function (r) { return r.id !== id; })); }
  };
  window.MPM = { $: $, $$: $$, esc: esc, toast: toast, Reg: Reg, RAIZ: RAIZ };

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------- Menú: marca la página actual (la barra "Contenido" la arma estructura.js) ---------- */
    var aqui = location.pathname.split('/').pop() || 'index.html';
    $$('.menu-lateral li a[href]').forEach(function (a) {
      if (a.getAttribute('href').split('/').pop().split('#')[0] === aqui) { a.classList.add('activo'); var d = a.closest('details'); if (d) d.open = true; }
    });
    var s = window.MPMAuth && MPMAuth.sesion(), u = $('.usuario');
    if (u && s) {
      // Botón "Salir" con el mismo formato que los demás botones del encabezado.
      u.innerHTML = '<button type="button" class="boton-salir" title="Cerrar sesión (' + esc(s.etiqueta) + ')"><img src="' + RAIZ + 'img/iconos/salir.svg" alt="" width="30" height="30"><p>Salir</p></button>';
      $('button', u).onclick = MPMAuth.salir;
    }

    /* ---------- Pestañas ----------
       Cada grupo es un <div class="pestanas"> con botones .pestana-boton
       (data-pestana="nombre") y paneles #pestana-nombre. En las páginas de
       método (.pestanas--metodo) hay un panel predeterminado que se ve cuando
       no hay botón activo; volver a tocar el botón activo regresa a él. */
    $$('.pestanas').forEach(function (g) {
      var btns = $$('.pestana-boton', g).filter(function (b) { return b.closest('.pestanas') === g; });
      var pred = $('.pestana-panel--predeterminado', g);
      function abrir(id, mover) {
        var existe = btns.some(function (b) { return b.dataset.pestana === id; });
        btns.forEach(function (b) {
          var on = b.dataset.pestana === id;
          b.classList.toggle('pestana-boton--activo', on); b.setAttribute('aria-pressed', on);
          var p = document.getElementById('pestana-' + b.dataset.pestana); if (p) p.classList.toggle('pestana-panel--activo', on);
        });
        if (pred) pred.classList.toggle('pestana-panel--activo', !existe);
        if (mover) history.replaceState(null, '', existe ? '#' + id : location.pathname + location.search);
        document.dispatchEvent(new CustomEvent('mpm:pestana', { detail: id }));
      }
      g._abrir = abrir;
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var ya = b.classList.contains('pestana-boton--activo');
          abrir(ya && pred ? null : b.dataset.pestana, true);
        });
      });
      var h = location.hash.slice(1), esBoton = function (k) { return btns.some(function (b) { return b.dataset.pestana === k; }); };
      abrir(esBoton(h) ? h : (pred ? null : btns[0].dataset.pestana));
      window.addEventListener('hashchange', function () { var k = location.hash.slice(1); if (esBoton(k)) abrir(k); });
    });

    /* ---------- Acordeones: al salir de la página se cierran todos ----------
       Así, al volver (también con el botón "atrás" del navegador), la página
       aparece otra vez con todo plegado. */
    window.addEventListener('pagehide', function () {
      $$('details.acordeon, .mini details, details.reg-det').forEach(function (d) { d.open = false; });
    });
    // si el ancla apunta dentro de un acordeón cerrado, se abre
    function abrirAncla() {
      var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
      var el = document.getElementById(id); if (!el) return;
      var pn = el.closest('.pestana-panel'); if (pn && !pn.classList.contains('pestana-panel--activo')) { var gp = pn.closest('.pestanas'); if (gp && gp._abrir) gp._abrir(pn.id.replace('pestana-', '')); }
      var d = el.closest('details'); while (d) { d.open = true; d = d.parentElement.closest('details'); }
      if (el.tagName === 'DETAILS') el.open = true;
      setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 60);
    }
    abrirAncla(); window.addEventListener('hashchange', abrirAncla);

    /* ---------- Citas: número → globo con la referencia ---------- */
    var globo;
    function cerrarGlobo() { if (globo) { globo.remove(); globo = null; } $$('sup.cita.abierta').forEach(function (x) { x.classList.remove('abierta'); }); }
    function abrirCita(sup) {
      var n = sup.dataset.ref, r = (window.MPM_REFS || {})[n]; if (!r) return;
      cerrarGlobo(); sup.classList.add('abierta');
      globo = document.createElement('div'); globo.className = 'cita-globo'; globo.setAttribute('role', 'tooltip');
      globo.innerHTML = '<b>Referencia ' + n + '</b><br>' + r.h + '<div class="acciones">' +
        (r.u ? '<a href="' + esc(r.u) + '" target="_blank" rel="noopener">Abrir fuente ↗</a>' : '') +
        '<a href="' + RAIZ + 'paginas/referencias.html#ref-' + n + '" style="background:transparent;border:1px solid #9fd0f3">Ver en la lista</a></div>';
      document.body.appendChild(globo);
      var b = sup.getBoundingClientRect(), gw = globo.offsetWidth, gh = globo.offsetHeight;
      var x = Math.max(8, Math.min(window.innerWidth - gw - 8, b.left + b.width / 2 - gw / 2));
      var y = b.top - gh - 8; if (y < 8) y = b.bottom + 8;
      globo.style.left = (x + window.scrollX) + 'px'; globo.style.top = (y + window.scrollY) + 'px';
    }
    var fijo = false, tCierre;
    document.addEventListener('click', function (e) {
      var sup = e.target.closest('sup.cita');
      if (sup) { e.preventDefault(); if (sup.classList.contains('abierta') && fijo) { cerrarGlobo(); fijo = false; } else { abrirCita(sup); fijo = true; } return; }
      if (globo && !e.target.closest('.cita-globo')) { cerrarGlobo(); fijo = false; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cerrarGlobo(); fijo = false; var v = $('.visor'); if (v) v.remove(); }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('sup.cita')) { e.preventDefault(); abrirCita(e.target); fijo = true; }
    });
    // con ratón: se asoma al pasar y se queda al hacer clic
    document.addEventListener('mouseover', function (e) {
      if (!window.matchMedia('(hover:hover)').matches) return;
      var sup = e.target.closest && e.target.closest('sup.cita');
      if (sup) { clearTimeout(tCierre); if (!sup.classList.contains('abierta')) { abrirCita(sup); fijo = false; } }
      else if (e.target.closest && e.target.closest('.cita-globo')) clearTimeout(tCierre);
    });
    document.addEventListener('mouseout', function (e) {
      if (fijo || !globo) return;
      if (e.target.closest && (e.target.closest('sup.cita') || e.target.closest('.cita-globo'))) { clearTimeout(tCierre); tCierre = setTimeout(function () { if (!fijo) cerrarGlobo(); }, 350); }
    });

    /* ---------- Tarjetas giratorias ---------- */
    $$('.volteable').forEach(function (v) { v.addEventListener('click', function (e) { if (e.target.closest('sup.cita,a')) return; v.classList.toggle('girada'); }); });

    /* ---------- Línea de tiempo ---------- */
    var items = $$('.tiempo li');
    if (items.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            var a = en.target.dataset.anio; $$('.tiempo-nav button').forEach(function (b) { b.classList.toggle('activo', b.dataset.anio === a); });
          }
        });
      }, { rootMargin: '-25% 0px -45% 0px' });
      items.forEach(function (li) { io.observe(li); });
      $$('.tiempo-nav button').forEach(function (b) {
        b.addEventListener('click', function () { var li = $('.tiempo li[data-anio="' + b.dataset.anio + '"]'); if (li) li.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      });
    } else items.forEach(function (li) { li.classList.add('visible'); });

    /* ---------- Glosario ---------- */
    var gi = $('#glosario-filtro');
    if (gi) gi.addEventListener('input', function () {
      var q = gi.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), n = 0;
      $$('.termino').forEach(function (t) {
        var ok = t.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) >= 0;
        t.classList.toggle('oculto', !ok); if (ok) n++;
      });
      var c = $('#glosario-cuenta'); if (c) c.textContent = n + ' términos';
    });

    /* ---------- Cuestionario de interpretación ---------- */
    $$('.quiz[data-quiz]').forEach(function (q) {
      var datos = JSON.parse($('script', q).textContent), i = 0, buenas = 0, orden = datos.slice().sort(function () { return Math.random() - .5; }).slice(0, Math.min(6, datos.length));
      var zona = $('.quiz-zona', q);
      function pinta() {
        if (i >= orden.length) { zona.innerHTML = '<p><b>' + buenas + ' de ' + orden.length + ' correctas.</b></p><button class="btn sec peq" type="button">Repetir</button>'; $('button', zona).onclick = function () { i = 0; buenas = 0; orden.sort(function () { return Math.random() - .5; }); pinta(); }; return; }
        var p = orden[i], ops = [p.r].concat(datos.filter(function (d) { return d.r !== p.r; }).map(function (d) { return d.r; }).filter(function (v, k, a) { return a.indexOf(v) === k; }).sort(function () { return Math.random() - .5; }).slice(0, 2)).sort(function () { return Math.random() - .5; });
        zona.innerHTML = '<p class="nota">Pregunta ' + (i + 1) + ' de ' + orden.length + '</p><p><b>' + esc(p.p) + '</b><br>Observas: <em>' + esc(p.o) + '</em>. ¿Cómo se interpreta?</p>' + ops.map(function (o) { return '<button type="button" class="quiz-op">' + esc(o) + '</button>'; }).join('');
        $$('.quiz-op', zona).forEach(function (b) {
          b.onclick = function () {
            if (zona.dataset.listo) return; zona.dataset.listo = 1;
            var ok = b.textContent === p.r; if (ok) buenas++;
            b.classList.add(ok ? 'bien' : 'mal');
            $$('.quiz-op', zona).forEach(function (x) { if (x.textContent === p.r) x.classList.add('bien'); });
            var s = document.createElement('button'); s.className = 'btn peq'; s.type = 'button'; s.textContent = 'Siguiente'; s.onclick = function () { delete zona.dataset.listo; i++; pinta(); }; zona.appendChild(s);
          };
        });
      }
      pinta();
    });

    /* ---------- Listas de verificación con memoria ---------- */
    $$('[data-check]').forEach(function (g) {
      var clave = 'mpm.check.' + g.dataset.check, est = {};
      try { est = JSON.parse(localStorage.getItem(clave) || '{}'); } catch (e) {}
      var cajas = $$('input[type=checkbox]', g), barra = $('.check-avance i', g), txt = $('.check-cuenta', g);
      function avance() {
        var n = cajas.filter(function (c) { return c.checked; }).length;
        if (barra) barra.style.width = (cajas.length ? n / cajas.length * 100 : 0) + '%';
        if (txt) txt.textContent = n + ' de ' + cajas.length + ' listos';
      }
      cajas.forEach(function (c, k) {
        c.checked = !!est[k];
        c.addEventListener('change', function () { est[k] = c.checked; localStorage.setItem(clave, JSON.stringify(est)); avance(); });
      });
      var lim = $('[data-check-limpiar]', g);
      if (lim) lim.onclick = function () { cajas.forEach(function (c) { c.checked = false; }); est = {}; localStorage.removeItem(clave); avance(); };
      avance();
    });

    /* ---------- Ampliar imágenes ---------- */
    document.addEventListener('click', function (e) {
      var im = e.target.closest('img.zoomable'); if (!im) { var v = e.target.closest('.visor'); if (v) v.remove(); return; }
      var d = document.createElement('div'); d.className = 'visor'; d.innerHTML = '<img src="' + im.src + '" alt="' + esc(im.alt) + '">'; document.body.appendChild(d);
    });

    /* ---------- Barra de progreso de lectura ---------- */
    var pr = $('.progreso-lectura');
    if (pr) window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight; pr.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
    }, { passive: true });

    /* ---------- Buscador ---------- */
    var bi = $('#buscar'), br = $('.buscador-res');
    if (bi && br) {
      var norm = function (t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
      bi.addEventListener('input', function () {
        var q = norm(bi.value.trim()); if (q.length < 2) { br.hidden = true; return; }
        var res = (window.MPM_INDICE || []).filter(function (x) { return norm(x.t + ' ' + (x.s || '')).indexOf(q) >= 0; }).slice(0, 12);
        br.innerHTML = res.length ? res.map(function (x) { return '<a href="' + RAIZ + x.u + '">' + esc(x.t) + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</a>'; }).join('') : '<a>Sin resultados</a>';
        br.hidden = false;
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('.buscador')) br.hidden = true; });
    }
  });
})();
