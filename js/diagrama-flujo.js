// js/diagrama-flujo.js
// Dibuja los diagramas de flujo de js/diagramas-datos.js y los muestra paso
// a paso: cada cuadro aparece con su flecha, y al final se ve completo.
//
// Uso en el HTML:
//   <div class="diagrama-flujo" data-diagrama="mesofilos-aerobios"></div>
//
// Cómo funciona:
//   - Los cuadros son elementos HTML dentro de una cuadrícula (CSS grid);
//     todos ocupan su lugar desde el inicio y los que aún no "aparecen" solo
//     se vuelven transparentes, así el dibujo no se mueve al avanzar.
//   - Las flechas se dibujan en un SVG encima, midiendo dónde quedó cada
//     cuadro. Se redibujan al avanzar, al hacer zoom y al cambiar de tamaño
//     (también cuando la pestaña pasa de oculta a visible).
//   - El zoom cambia el font-size del lienzo; todo lo demás está en "em".

const NS_SVG = 'http://www.w3.org/2000/svg';

function elemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

function crearDiagrama(contenedor, datos) {
  const nodos = datos.nodos;
  // Pasos: los indicados en "pasos"; si no, uno por cada fila de la cuadrícula
  // (los cuadros de una misma fila aparecen juntos) o, con "pasoPorNodo", uno por cuadro.
  let pasos = datos.pasos;
  if (!pasos && datos.pasoPorNodo) pasos = nodos.map((n) => [n.id]);
  if (!pasos) {
    const filas = [];
    nodos.forEach(function (n) {
      let g = filas.find((f) => f.fila === n.fila);
      if (!g) { g = { fila: n.fila, ids: [] }; filas.push(g); }
      g.ids.push(n.id);
    });
    pasos = filas.sort((a, b) => a.fila - b.fila).map((g) => g.ids);
  }

  // Número de paso en el que aparece cada cuadro.
  const pasoDe = {};
  pasos.forEach((grupo, i) => grupo.forEach((id) => { pasoDe[id] = i + 1; }));
  const total = pasos.length;

  let actual = 1;       // paso al que se llegó
  let completo = false; // true = se muestra todo sin resaltar
  let zoom = 1;
  let temporizador = null;

  // --- Estructura -----------------------------------------------------
  contenedor.replaceChildren();
  const marco = elemento('div', 'diagrama');
  contenedor.appendChild(marco);

  if (datos.titulo) marco.appendChild(elemento('p', 'diagrama-titulo', datos.titulo));

  const barra = elemento('div', 'diagrama-barra');
  function boton(texto, etiqueta, alClic, clase) {
    const b = elemento('button', 'btn btn--chico ' + (clase || 'btn--secundario'), texto);
    b.type = 'button';
    if (etiqueta) b.setAttribute('aria-label', etiqueta);
    b.addEventListener('click', alClic);
    barra.appendChild(b);
    return b;
  }
  const bReiniciar = boton('↺ Reiniciar', 'Volver al primer paso', () => { detener(); ir(1); });
  const bAnterior = boton('← Anterior', 'Paso anterior', () => { detener(); ir(actual - 1); });
  const bSiguiente = boton('Siguiente paso →', 'Siguiente paso', () => { detener(); ir(actual + 1); }, '');
  const bPlay = boton('▶ Reproducir', 'Reproducir los pasos', alternarReproduccion);
  const bCompleto = boton('Ver completo', 'Mostrar el diagrama completo', () => { detener(); mostrarCompleto(); });
  const grupoZoom = elemento('span', 'diagrama-zoom');
  const bMenos = elemento('button', 'btn btn--chico btn--secundario', '−');
  bMenos.type = 'button'; bMenos.setAttribute('aria-label', 'Alejar');
  const bMas = elemento('button', 'btn btn--chico btn--secundario', '+');
  bMas.type = 'button'; bMas.setAttribute('aria-label', 'Acercar');
  grupoZoom.appendChild(bMenos); grupoZoom.appendChild(bMas);
  barra.appendChild(grupoZoom);
  const bPantalla = boton('⛶ Pantalla completa', 'Ver el diagrama a pantalla completa', alternarPantalla);
  marco.appendChild(barra);

  const contador = elemento('p', 'diagrama-paso');
  contador.setAttribute('aria-live', 'polite');
  marco.appendChild(contador);

  const visor = elemento('div', 'diagrama-visor');
  visor.tabIndex = 0;
  visor.setAttribute('aria-label', 'Diagrama de flujo. Usar las flechas del teclado para avanzar o retroceder.');
  const lienzo = elemento('div', 'diagrama-lienzo');
  const svg = document.createElementNS(NS_SVG, 'svg');
  svg.setAttribute('class', 'diagrama-flechas');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<defs><marker id="punta-' + (datos.id || 'd') + '" viewBox="0 0 10 10" refX="9" refY="5" ' +
    'markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M0 0L10 5L0 10z" class="diagrama-punta"/></marker></defs>';
  const idPunta = 'punta-' + (datos.id || 'd');
  const rejilla = elemento('div', 'diagrama-rejilla');
  rejilla.style.setProperty('--dg-columnas', datos.columnas || 1);
  if (datos.ancho) rejilla.style.setProperty('--dg-ancho', datos.ancho + 'em');
  lienzo.appendChild(svg);
  lienzo.appendChild(rejilla);
  visor.appendChild(lienzo);
  marco.appendChild(visor);

  // Versión en lista, para quien usa lector de pantalla.
  const lista = elemento('ol', 'solo-lector');
  nodos.forEach((n) => lista.appendChild(elemento('li', null, n.texto.replace(/\n/g, ' '))));
  marco.appendChild(lista);

  // --- Cuadros --------------------------------------------------------
  const porId = {};
  nodos.forEach(function (n) {
    const caja = elemento('div', 'dg-nodo dg-' + n.tipo + (n.alinear === 'izq' ? ' dg-izq' : ''));
    caja.style.gridColumn = n.span ? n.col + ' / span ' + n.span : String(n.col);
    caja.style.gridRow = String(n.fila);
    if (n.tipo === 'decision') {
      const rombo = document.createElementNS(NS_SVG, 'svg');
      rombo.setAttribute('class', 'dg-rombo');
      rombo.setAttribute('viewBox', '0 0 100 100');
      rombo.setAttribute('preserveAspectRatio', 'none');
      rombo.setAttribute('aria-hidden', 'true');
      rombo.innerHTML = '<polygon points="50,1 99,50 50,99 1,50" vector-effect="non-scaling-stroke"/>';
      caja.appendChild(rombo);
    }
    caja.appendChild(elemento('span', 'dg-texto', n.texto));
    rejilla.appendChild(caja);
    porId[n.id] = caja;
  });

  // --- Flechas --------------------------------------------------------
  // Punto de salida/llegada de una flecha en un cuadro, relativo al lienzo.
  function ancla(caja, lado) {
    const r = caja.getBoundingClientRect();
    const l = lienzo.getBoundingClientRect();
    const x = r.left - l.left;
    const y = r.top - l.top;
    if (lado === 'arriba') return { x: x + r.width / 2, y: y };
    if (lado === 'izq') return { x: x, y: y + r.height / 2 };
    if (lado === 'der') return { x: x + r.width, y: y + r.height / 2 };
    return { x: x + r.width / 2, y: y + r.height }; // 'abajo'
  }

  function dibujarFlechas() {
    const l = lienzo.getBoundingClientRect();
    if (l.width === 0) return; // la pestaña aún está oculta
    svg.setAttribute('width', lienzo.scrollWidth);
    svg.setAttribute('height', lienzo.scrollHeight);
    Array.from(svg.querySelectorAll('.dg-arista')).forEach((e) => e.remove());

    (datos.aristas || []).forEach(function (a) {
      const desde = a[0], hasta = a[1], etiqueta = typeof a[2] === 'string' ? a[2] : '';
      const opc = (typeof a[a.length - 1] === 'object' && a[a.length - 1]) || {};
      if (!porId[desde] || !porId[hasta]) return;
      // La flecha aparece cuando ya están visibles sus dos cuadros.
      if (!completo && Math.max(pasoDe[hasta], pasoDe[desde]) > actual) return;
      const l1 = opc.desde || 'abajo';
      const l2 = opc.hasta || 'arriba';
      const p1 = ancla(porId[desde], l1);
      const p2 = ancla(porId[hasta], l2);
      const vert = (l) => l === 'abajo' || l === 'arriba';
      let d;
      if (vert(l1) && vert(l2)) {
        if (l1 === l2) {                       // "U": sale y entra por el mismo lado
          const y = (l1 === 'abajo' ? Math.max(p1.y, p2.y) + 20 : Math.min(p1.y, p2.y) - 20);
          d = 'M' + p1.x + ',' + p1.y + ' V' + y + ' H' + p2.x + ' V' + p2.y;
        } else if (Math.abs(p1.x - p2.x) < 2) {
          d = 'M' + p1.x + ',' + p1.y + ' V' + p2.y;
        } else {
          const ym = p1.y + (p2.y - p1.y) / 2;
          d = 'M' + p1.x + ',' + p1.y + ' V' + ym + ' H' + p2.x + ' V' + p2.y;
        }
      } else if (!vert(l1) && vert(l2)) {      // sale de un lado y baja/sube al cuadro
        d = 'M' + p1.x + ',' + p1.y + ' H' + p2.x + ' V' + p2.y;
      } else if (vert(l1) && !vert(l2)) {      // sale arriba/abajo y entra por un lado
        d = 'M' + p1.x + ',' + p1.y + ' V' + p2.y + ' H' + p2.x;
      } else if (l1 === l2) {                  // bucle: sale y entra por el mismo lado
        const x = (l1 === 'izq' ? Math.min(p1.x, p2.x) - 28 : Math.max(p1.x, p2.x) + 28);
        d = 'M' + p1.x + ',' + p1.y + ' H' + x + ' V' + p2.y + ' H' + p2.x;
      } else if (Math.abs(p1.y - p2.y) < 2) {
        d = 'M' + p1.x + ',' + p1.y + ' H' + p2.x;
      } else {
        const xm = p1.x + (p2.x - p1.x) / 2;
        d = 'M' + p1.x + ',' + p1.y + ' H' + xm + ' V' + p2.y + ' H' + p2.x;
      }
      const trazo = document.createElementNS(NS_SVG, 'path');
      trazo.setAttribute('d', d);
      trazo.setAttribute('class', 'dg-arista');
      trazo.setAttribute('marker-end', 'url(#' + idPunta + ')');
      svg.appendChild(trazo);
      if (etiqueta) {
        const t = document.createElementNS(NS_SVG, 'text');
        t.setAttribute('class', 'dg-arista dg-etiqueta');
        if (l1 === 'izq') { t.setAttribute('text-anchor', 'end'); t.setAttribute('x', p1.x - 8); t.setAttribute('y', p1.y - 6); }
        else if (l1 === 'der') { t.setAttribute('x', p1.x + 8); t.setAttribute('y', p1.y - 6); }
        else if (l1 === 'arriba') { t.setAttribute('x', p1.x + 8); t.setAttribute('y', p1.y - 8); }
        else { t.setAttribute('x', p1.x + 8); t.setAttribute('y', p1.y + 18); }
        t.textContent = etiqueta;
        svg.appendChild(t);
      }
    });
  }

  // --- Estado ---------------------------------------------------------
  function pintar() {
    nodos.forEach(function (n) {
      const caja = porId[n.id];
      const visible = completo || pasoDe[n.id] <= actual;
      caja.classList.toggle('dg-oculto', !visible);
      caja.classList.toggle('dg-actual', !completo && pasoDe[n.id] === actual);
      caja.classList.toggle('dg-previo', !completo && pasoDe[n.id] < actual);
    });
    bAnterior.disabled = !completo && actual <= 1;
    bSiguiente.disabled = !completo && actual >= total;
    bReiniciar.disabled = !completo && actual === 1;
    bPlay.textContent = temporizador ? '⏸ Pausar' : '▶ Reproducir';
    if (completo) {
      contador.textContent = 'Diagrama completo (' + total + ' pasos).';
    } else {
      const textos = pasos[actual - 1].map((id) => nodos.find((n) => n.id === id).texto.replace(/\n/g, ' '));
      contador.textContent = 'Paso ' + actual + ' de ' + total + ': ' + textos.join(' / ');
    }
    dibujarFlechas();
    if (!completo) llevarAlPaso();
  }

  // Desplaza el visor para que el cuadro actual quede a la vista.
  function llevarAlPaso() {
    const caja = porId[pasos[actual - 1][0]];
    const c = caja.getBoundingClientRect();
    const v = visor.getBoundingClientRect();
    if (c.top < v.top + 8 || c.bottom > v.bottom - 8) {
      const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      visor.scrollTo({ top: visor.scrollTop + (c.top - v.top) - v.height / 3, behavior: reducido ? 'auto' : 'smooth' });
    }
  }

  function ir(paso) {
    completo = false;
    actual = Math.min(Math.max(paso, 1), total);
    pintar();
  }

  function mostrarCompleto() {
    completo = true;
    pintar();
  }

  function detener() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
    pintar && bPlay && (bPlay.textContent = '▶ Reproducir');
  }

  function alternarReproduccion() {
    if (temporizador) { detener(); return; }
    if (completo || actual >= total) ir(1);
    temporizador = setInterval(function () {
      if (actual >= total) { detener(); mostrarCompleto(); return; }
      ir(actual + 1);
    }, 1800);
    pintar();
  }

  function aplicarZoom(nuevo) {
    zoom = Math.min(Math.max(nuevo, 0.6), 1.8);
    lienzo.style.fontSize = zoom + 'rem';
    dibujarFlechas();
  }
  bMenos.addEventListener('click', () => aplicarZoom(zoom - 0.15));
  bMas.addEventListener('click', () => aplicarZoom(zoom + 0.15));

  // Pantalla completa (si el navegador no la ofrece, se simula con una capa).
  function alternarPantalla() {
    if (marco.classList.contains('diagrama--pantalla')) {
      if (document.fullscreenElement) document.exitFullscreen();
      salirDePantalla();
    } else {
      marco.classList.add('diagrama--pantalla');
      bPantalla.textContent = '✕ Salir de pantalla completa';
      if (marco.requestFullscreen) marco.requestFullscreen().catch(function () { /* queda la capa */ });
    }
    setTimeout(dibujarFlechas, 50);
  }
  function salirDePantalla() {
    marco.classList.remove('diagrama--pantalla');
    bPantalla.textContent = '⛶ Pantalla completa';
    setTimeout(dibujarFlechas, 50);
  }
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && marco.classList.contains('diagrama--pantalla')) salirDePantalla();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && marco.classList.contains('diagrama--pantalla') && !document.fullscreenElement) salirDePantalla();
  });

  visor.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (completo || actual < total) { e.preventDefault(); detener(); ir(completo ? total : actual + 1); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); detener(); ir(actual - 1);
    }
  });

  // Redibuja las flechas cuando cambia el tamaño (o cuando la pestaña se hace visible).
  // La primera vez que el diagrama es visible, si es más ancho que el visor se reduce
  // el zoom para que quepa (sin bajar de 0.6; el resto se desplaza).
  let ajustado = false;
  function alCambiarTamano() {
    if (!ajustado && visor.clientWidth > 0 && lienzo.scrollWidth > 0) {
      ajustado = true;
      const ratio = visor.clientWidth / lienzo.scrollWidth;
      if (ratio < 1) { aplicarZoom(Math.max(0.6, zoom * ratio)); return; }
    }
    dibujarFlechas();
  }
  if (window.ResizeObserver) new ResizeObserver(alCambiarTamano).observe(lienzo);
  window.addEventListener('resize', dibujarFlechas);

  pintar();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.diagrama-flujo[data-diagrama]').forEach(function (contenedor) {
      const datos = DIAGRAMAS[contenedor.dataset.diagrama];
      if (!datos) {
        contenedor.textContent = 'Diagrama no disponible.';
        return;
      }
      crearDiagrama(contenedor, Object.assign({ id: contenedor.dataset.diagrama }, datos));
    });
  });
}
