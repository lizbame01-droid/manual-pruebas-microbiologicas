/* =============================================================
   ACCESO AL MANUAL  (js/auth.js)
   -------------------------------------------------------------
   Este archivo controla quién puede ver el manual. Tiene dos
   "proveedores" de acceso:

   1) LOCAL (temporal): contraseñas definidas en js/config.js.
      No se guarda la contraseña. Cada acceso guarda la llave del
      contenido cifrada con su contraseña (PBKDF2-SHA256 + AES-GCM):
      al escribir la contraseña correcta se obtiene la llave y con
      ella js/cifrado.js descifra las páginas.
   2) MICROSOFT (futuro): inicio de sesión con la cuenta de la
      escuela mediante MSAL. Está programado pero apagado; se
      enciende en js/config.js cuando la escuela entregue los datos
      de registro de la aplicación (clientId y tenantId).

   El contenido del manual está cifrado (AES-256). Sin una
   contraseña válida, los archivos publicados son ilegibles.
   Nota: el acceso con Microsoft no entrega la llave del contenido;
   para usarlo habría que guardar la llave en un servidor.
   ============================================================= */
(function () {
  var CFG = (window.MPM_CONFIG && window.MPM_CONFIG.acceso) || {};
  var CLAVE = 'mpm.sesion';
  var guion = document.currentScript;
  var RAIZ = (guion && guion.dataset.raiz) || '';
  var ES_PAGINA_ACCESO = !!(guion && guion.dataset.acceso);

  /* ---- SHA-256 (implementación compacta, sin dependencias) ---- */
  function sha256(texto) {
    function rot(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [], H = [], i, j, primo = 2, n = 0;
    function esPrimo(p) { for (var d = 2; d * d <= p; d++) if (p % d === 0) return false; return true; }
    while (n < 64) {
      if (esPrimo(primo)) {
        if (n < 8) H[n] = (Math.pow(primo, 1 / 2) * 4294967296) | 0;
        K[n++] = (Math.pow(primo, 1 / 3) * 4294967296) | 0;
      }
      primo++;
    }
    var bytes = unescape(encodeURIComponent(texto)), l = bytes.length, palabras = [];
    for (i = 0; i < l; i++) palabras[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
    palabras[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    palabras[(((l + 8) >> 6) << 4) + 15] = l * 8;
    for (i = 0; i < palabras.length; i += 16) {
      var w = [], a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = palabras[i + j] | 0;
        else {
          var s0 = rot(w[j - 15], 7) ^ rot(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          var s1 = rot(w[j - 2], 17) ^ rot(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }
        var S1 = rot(e, 6) ^ rot(e, 11) ^ rot(e, 25), ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rot(a, 2) ^ rot(a, 13) ^ rot(a, 22), maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  function leerSesion() {
    try {
      var s = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (!s || !s.exp || Date.now() > s.exp) return null;
      // Si el acceso local con el que se entró fue eliminado o desactivado, la sesión deja de valer.
      if (s.proveedor === 'local' && !s.k) return null;   // sesión anterior al cifrado
      if (s.proveedor === 'local') {
        var vigente = (CFG.accesosLocales || []).some(function (a) { return a.id === s.id && a.activo !== false; });
        if (!vigente) return null;
      }
      if (s.proveedor === 'microsoft' && !(CFG.microsoft && CFG.microsoft.habilitado)) return null;
      return s;
    } catch (e) { return null; }
  }
  function crearSesion(datos) {
    datos.exp = Date.now() + (CFG.duracionSesionHoras || 8) * 3600 * 1000;
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    return datos;
  }

  /* ---- utilidades de cifrado ---- */
  var ITER = 250000;
  function b64(t) { var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function aB64(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function llaveDe(base, a) {
    var env = b64(a.llave);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(a.sal), iterations: a.iter || ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
      .then(function (kek) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: env.slice(0, 12) }, kek, env.slice(12)); });
  }

  var Auth = {
    sha256: sha256,
    sesion: leerSesion,
    modoLocal: function () { return CFG.modo !== 'microsoft'; },
    modoMicrosoft: function () { return !!(CFG.microsoft && CFG.microsoft.habilitado) && CFG.modo !== 'local'; },

    /* Acceso temporal con contraseña: devuelve una promesa con la sesión (o null si no coincide) */
    entrarLocal: function (clave) {
      var lista = (CFG.accesosLocales || []).filter(function (a) { return a.activo !== false && a.llave; });
      if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('Este navegador no puede descifrar el manual. Ábrelo desde la dirección https del sitio.'));
      return crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveKey']).then(function (base) {
        function prueba(i) {
          if (i >= lista.length) return null;
          var a = lista[i];
          return llaveDe(base, a).then(function (k) {
            return crearSesion({ proveedor: 'local', id: a.id, etiqueta: a.etiqueta || a.id, k: aB64(new Uint8Array(k)) });
          }, function () { return prueba(i + 1); });
        }
        return prueba(0);
      });
    },

    /* Para admin/generar-acceso.html: con la sesión abierta, envuelve la llave del contenido con una contraseña nueva */
    generarAcceso: function (etiqueta, clave) {
      var s = leerSesion(); if (!s || !s.k) return Promise.reject(new Error('Primero entra al manual con una contraseña vigente.'));
      var sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      return crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveKey']).then(function (base) {
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
      }).then(function (kek) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, kek, b64(s.k)); }).then(function (env) {
        var todo = new Uint8Array(12 + env.byteLength); todo.set(iv, 0); todo.set(new Uint8Array(env), 12);
        return "{ id: 'acceso-" + Date.now().toString(36) + "', etiqueta: '" + etiqueta.replace(/'/g, '') + "', sal: '" + aB64(sal) + "', llave: '" + aB64(todo) + "', activo: true },";
      });
    },

    /* Acceso con cuenta Microsoft de la escuela (se activa en config.js) */
    entrarMicrosoft: function () {
      var ms = CFG.microsoft || {};
      if (!ms.habilitado || !ms.clientId) return Promise.reject(new Error('El acceso con Microsoft aún no está configurado.'));
      return new Promise(function (ok, mal) {
        function iniciar() {
          var app = new msal.PublicClientApplication({
            auth: {
              clientId: ms.clientId,
              authority: 'https://login.microsoftonline.com/' + (ms.tenantId || 'organizations'),
              redirectUri: ms.redirectUri || (location.origin + location.pathname)
            },
            cache: { cacheLocation: 'sessionStorage' }
          });
          var listo = app.initialize ? app.initialize() : Promise.resolve();
          listo.then(function () {
            return app.loginPopup({ scopes: ms.permisos || ['openid', 'profile', 'email'], prompt: 'select_account' });
          }).then(function (r) {
            var correo = (r.account && r.account.username || '').toLowerCase();
            var dominios = ms.dominiosPermitidos || [];
            var permitido = !dominios.length || dominios.some(function (d) { return correo.endsWith('@' + d.toLowerCase()); });
            if (!permitido) return mal(new Error('Esta cuenta no pertenece a un dominio autorizado.'));
            ok(crearSesion({ proveedor: 'microsoft', id: r.account.homeAccountId, etiqueta: r.account.name || correo, correo: correo }));
          }).catch(mal);
        }
        if (window.msal) return iniciar();
        var s = document.createElement('script');
        s.src = ms.msalCdn; s.onload = iniciar;
        s.onerror = function () { mal(new Error('No se pudo cargar la biblioteca de Microsoft.')); };
        document.head.appendChild(s);
      });
    },

    salir: function () {
      localStorage.removeItem(CLAVE);
      location.href = RAIZ + 'acceso.html';
    }
  };
  window.MPMAuth = Auth;

  /* ---- Candado de página ---- */
  if (!ES_PAGINA_ACCESO) {
    if (!leerSesion()) {
      var volver = location.pathname.split('/').slice(-3).join('/') + location.search + location.hash;
      sessionStorage.setItem('mpm.volver', location.href);
      location.replace(RAIZ + 'acceso.html');
    } else {
      document.addEventListener('DOMContentLoaded', function () { document.body.classList.remove('sin-sesion'); });
    }
  }
})();
