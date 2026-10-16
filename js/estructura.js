// js/estructura.js
// Partes comunes a todas las páginas:
//   1. Barra superior con el botón "Contenido": convierte el menú
//      (<nav class="menu-lateral">, que cada página ya trae) en un menú
//      desplegable. Si la página tiene un elemento con el atributo
//      data-barra-extra (solo el inicio), se coloca a la derecha de la barra.
//   2. Pie de página (footer) con una frase de ciencia y el año.
//
// Para cambiar la frase del pie, se edita FRASE_DEL_PIE aquí abajo
// (un solo lugar para todas las páginas).

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
});
