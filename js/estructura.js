// js/estructura.js
// Partes comunes a todas las páginas:
//   1. Barra superior con el botón "Contenido": convierte el menú
//      (<nav class="menu-lateral">, que cada página ya trae) en un menú
//      desplegable. Si la página tiene un elemento con el atributo
//      data-barra-extra (solo el inicio), se coloca a la derecha de la barra.
//      En las páginas interiores también se suben a esa barra los botones
//      de herramientas (si la página los tiene). El regreso al inicio lo
//      hace el primer renglón del menú "Contenido".
//   2. Pie de página (footer) con una frase de ciencia y el año.
//   3. Inicio de sesión con Microsoft (opcional): solo si js/config-login.js
//      tiene un clientId se carga js/login.js, que agrega a la barra superior
//      el botón "Iniciar sesión". Sin clientId no se carga nada de Microsoft.
//
// Para cambiar la frase del pie, se edita FRASE_DEL_PIE aquí abajo
// (un solo lugar para todas las páginas).

// Dirección de este archivo: sirve para encontrar la raíz del sitio sin importar
// en qué carpeta esté la página (index.html, paginas/, paginas/metodos/...).
const URL_ESTRUCTURA = document.currentScript ? document.currentScript.src : '';

function cargarScript(url) {
  return new Promise(function (resolver, rechazar) {
    const s = document.createElement('script');
    s.src = url;
    s.onload = function () { resolver(url); };
    s.onerror = function () { s.remove(); rechazar(new Error('No se pudo cargar ' + url)); };
    document.head.appendChild(s);
  });
}

// Carga la configuración del inicio de sesión y, si está activado, el botón.
// Al terminar avisa con el evento "login-listo" (window.loginListo = true) para
// las páginas que muestran la cuenta (por ejemplo, Mis registros).
async function cargarLogin() {
  window.loginListo = false;
  try {
    if (URL_ESTRUCTURA) {
      const raiz = new URL('../', URL_ESTRUCTURA).href;
      window.RAIZ_SITIO = raiz;
      await cargarScript(raiz + 'js/config-login.js');
      if (typeof CONFIG_LOGIN !== 'undefined' && CONFIG_LOGIN.clientId) {
        // El inicio (index.html) no carga almacen.js; la sesión se guarda con él.
        if (typeof leerSesion === 'undefined') await cargarScript(raiz + 'js/almacen.js');
        await cargarScript(raiz + 'js/login.js');
        await iniciarLogin(CONFIG_LOGIN, raiz);
      }
    }
  } catch (error) {
    // Sin configuración o sin conexión: el sitio funciona en modo invitado.
    // (Si el inicio de sesión estaba activado, el motivo queda en la consola.)
    if (typeof CONFIG_LOGIN !== 'undefined' && CONFIG_LOGIN.clientId) console.warn('Inicio de sesión:', error);
  }
  window.loginListo = true;
  document.dispatchEvent(new Event('login-listo'));
}

const FRASE_DEL_PIE = '«En el campo de la observación, el azar solo favorece a las mentes preparadas.» — Louis Pasteur';

document.addEventListener('DOMContentLoaded', function () {
  const menu = document.querySelector('nav.menu-lateral');

  // --- 1. Barra superior con el menú desplegable -------------------
  if (menu) {
    const barra = document.createElement('header');
    barra.className = 'barra-superior';

    const desplegable = document.createElement('details');
    desplegable.className = 'menu-contenido';
    const resumen = document.createElement('summary');
    resumen.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Contenido</span>';
    desplegable.appendChild(resumen);
    desplegable.appendChild(menu); // mueve el menú existente dentro del desplegable
    barra.appendChild(desplegable);

    const extra = document.querySelector('[data-barra-extra]');
    if (extra) barra.appendChild(extra);

    // En las páginas interiores (todas menos el inicio), los botones de
    // herramientas se colocan en la misma fila que "Contenido", a la derecha.
    if (!extra) {
      barra.classList.add('barra-superior--interior');
      const herramientas = document.querySelector('main .herramientas-superior');
      if (herramientas) barra.appendChild(herramientas);
      const fila = document.querySelector('main .fila-superior');
      if (fila && !fila.children.length) fila.remove();
    }

    document.body.insertBefore(barra, document.body.firstChild);

    // Se cierra al hacer clic fuera o al presionar Escape.
    document.addEventListener('click', function (e) {
      if (desplegable.open && !desplegable.contains(e.target)) desplegable.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && desplegable.open) {
        desplegable.open = false;
        resumen.focus();
      }
    });
  }

  // --- 2. Pie de página -------------------------------------------
  const pie = document.createElement('footer');
  pie.className = 'pie';
  const frase = document.createElement('span');
  frase.className = 'pie-frase';
  frase.textContent = FRASE_DEL_PIE;
  const anio = document.createElement('span');
  anio.className = 'pie-anio';
  anio.textContent = String(new Date().getFullYear());
  pie.appendChild(frase);
  pie.appendChild(anio);
  document.body.appendChild(pie);

  // --- 3. Inicio de sesión (opcional) -----------------------------
  cargarLogin();
});
