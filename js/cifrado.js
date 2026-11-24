/* =============================================================
   CONTENIDO CIFRADO  (js/cifrado.js)
   El contenido de cada página, los datos del manual y las figuras
   están cifrados con AES-256-GCM. La llave se obtiene al escribir la
   contraseña (js/auth.js) y queda en la sesión de este navegador.
   Este archivo:
     1. descifra el contenido de la página y lo coloca,
     2. carga en orden los scripts de la página (los de datos, cifrados),
     3. avisa a los scripts que la página está lista (DOMContentLoaded),
     4. descifra las figuras conforme aparecen.
   ============================================================= */
(function () {
  var RAIZ = document.documentElement.dataset.raiz || '';
  var caja = document.getElementById('mpm-cifrado');
  var dec = new TextDecoder();
  function bytes(b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  var llaveP = null;
  function llave() {
    if (!llaveP) {
      var s = window.MPMAuth && MPMAuth.sesion();
      if (!s || !s.k || !(window.crypto && crypto.subtle)) return Promise.reject(new Error('sin llave'));
      llaveP = crypto.subtle.importKey('raw', bytes(s.k), 'AES-GCM', false, ['decrypt']);
    }
    return llaveP;
  }
  function descifrar(b64) {
    var d = bytes(b64);
    return llave().then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: d.slice(0, 12) }, k, d.slice(12)); });
  }

  /* ---- datos cifrados (referencias, índice, guías) ---- */
  var esperas = {};
  function cargar(url) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = url; s.async = false;
      s.onload = function () { ok(); }; s.onerror = function () { mal(new Error('No se pudo cargar ' + url)); };
      document.body.appendChild(s);
    });
  }
  function cargarDatos(url) {
    var nombre = url.split('/').pop().replace('.enc.js', '');
    return new Promise(function (ok, mal) { esperas[nombre] = { ok: ok, mal: mal }; cargar(RAIZ + url).catch(mal); });
  }

  /* ---- figuras cifradas ---- */
  var figs = {};   // nombre → {url} o {pendiente:true}
  function ponerFig(img) {
    var n = img.dataset.fig, f = figs[n];
    if (f && f.url) { img.src = f.url; img.removeAttribute('data-fig'); return; }
    if (!f) { figs[n] = { pendiente: true }; cargar(RAIZ + 'img/figuras/' + n + '.js').catch(function () {}); }
  }
  function buscarFigs(raiz) {
    Array.prototype.forEach.call((raiz || document).querySelectorAll('img[data-fig]'), ponerFig);
  }

  window.MPMCifrado = {
    datos: function (nombre, b64) {
      var e = esperas[nombre]; if (!e) return;
      descifrar(b64).then(function (buf) { (new Function(dec.decode(buf)))(); e.ok(); }, e.mal);
    },
    imagen: function (nombre, tipo, b64) {
      descifrar(b64).then(function (buf) {
        figs[nombre] = { url: URL.createObjectURL(new Blob([buf], { type: tipo })) };
        buscarFigs();
      });
    }
  };

  function fallo() {
    if (caja) caja.innerHTML = '<div class="cifrado-error"><p><b>No se pudo abrir el contenido.</b></p><p>Vuelve a entrar con tu contraseña.</p><p><a class="btn" href="' + RAIZ + 'acceso.html">Ir al acceso</a></p></div>';
  }

  if (!caja) return;
  descifrar(caja.dataset.c).then(function (buf) {
    var p = JSON.parse(dec.decode(buf));
    caja.removeAttribute('data-c'); caja.removeAttribute('id');
    caja.innerHTML = p.h;
    buscarFigs(caja);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { if (n.matches('img[data-fig]')) ponerFig(n); else buscarFigs(n); } }); });
    }).observe(document.body, { childList: true, subtree: true });
    // scripts de la página, en orden
    return p.s.reduce(function (cadena, s) {
      return cadena.then(function () { return typeof s === 'string' ? cargar(RAIZ + s) : cargarDatos(s.enc); });
    }, Promise.resolve());
  }).then(function () {
    document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
    if (location.hash) { var e = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (e && !e.classList.contains('pestana-panel')) e.scrollIntoView(); }
  }).catch(function (e) { console.warn('Contenido cifrado:', e); fallo(); });
})();
