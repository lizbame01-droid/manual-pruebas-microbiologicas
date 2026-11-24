// js/guia-diagrama.js
// Diagrama de flujo del "procedimiento completo" de cada método.
// Se arma solo a partir de los mismos datos de js/guias-datos.js que usa la guía
// paso a paso (cada paso trae su lugar en el diagrama, "pos": [columna, fila]).
//
// Qué hace:
//   - Dibuja los cuadros en una cuadrícula y las flechas encima (SVG).
//   - Si el método tiene etapas (Salmonella, S. aureus, NMP...), muestra una
//     pestaña por etapa y otra "Todo" con el diagrama completo. Al ver una sola
//     etapa, las flechas que salen o llegan de otra etapa se indican con un
//     enlace ("Viene de..." / "Continúa en...") que lleva a esa etapa.
//   - Marca en el diagrama el camino ya recorrido en la guía y el paso actual.
//   - Un clic en un cuadro lleva a ese paso de la guía.
//   - Zoom (+ / −) y ajuste automático al ancho disponible.
//   Todo el texto se escribe con textContent.

const NS_DG = 'http://www.w3.org/2000/svg';
let contadorDiagramas = 0;

function dgEl(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined && texto !== null) e.textContent = texto;
  return e;
}

// opc: { datos, porId, visitado(id), idActual, etapaInicial, dibujar(paso), alIr(id) }
function crearDiagramaGuia(opc) {
  const datos = opc.datos;
  const pasos = datos.pasos;
  const porId = opc.porId;
  const etapas = datos.etapas || [];
  const nombreEtapa = {};
  etapas.forEach((e) => { nombreEtapa[e.id] = e.nombre; });
  const idPunta = 'dg-punta-' + (++contadorDiagramas);

  let vista = (opc.etapaInicial && (nombreEtapa[opc.etapaInicial] || (etapas.length && opc.etapaInicial === 'todo'))) ? opc.etapaInicial : (etapas.length ? etapas[0].id : 'todo');
  let zoom = 1;
  let ajusteAuto = true;

  // --- Flechas: salen de los datos de cada paso ----------------------------
  const aristas = [];
  pasos.forEach(function (p) {
    const nueva = (a, b, etq, punteada) => aristas.push({ de: a, a: b, etq: etq || '', punteada: !!punteada });
    if (p.tipo === 'nota') { if (p.sig) nueva(p.id, p.sig, '', true); return; }
    if (p.tipo === 'fin') return;
    if (p.opciones) { p.opciones.forEach((o) => nueva(p.id, o.ir, o.etq || o.t)); return; }
    if (p.ramas) { p.ramas.forEach((r) => nueva(p.id, r.ir)); return; }
    const sig = p.sig ? porId[p.sig] : pasos[p.i + 1];
    if (!sig) return;
    // El último paso de una ruta no vuelve al paso "paralelo": sigue después de él.
    if (sig.tipo === 'paralelo' && p.ramaDe === sig.id) {
      const despues = sig.sig ? porId[sig.sig] : pasos[sig.i + 1];
      if (despues) nueva(p.id, despues.id);
      return;
    }
    nueva(p.id, sig.id);
  });

  // --- Estructura ----------------------------------------------------------
  const raiz = dgEl('div', 'dg');

  const barra = dgEl('div', 'dg-barra');
  const pestanas = dgEl('div', 'dg-pestanas');
  pestanas.setAttribute('role', 'tablist');
  pestanas.setAttribute('aria-label', 'Etapas del método');
  const botonesVista = {};
  if (etapas.length) {
    const opciones = [{ id: 'todo', nombre: 'Todo' }].concat(etapas);
    opciones.forEach(function (e, n) {
      const b = dgEl('button', 'dg-pestana', (n ? n + '. ' : '') + e.nombre);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => mostrar(e.id));
      pestanas.appendChild(b);
      botonesVista[e.id] = b;
    });
    barra.appendChild(pestanas);
  }
  const zoomGrupo = dgEl('span', 'dg-zoom');
  const bMenos = dgEl('button', 'btn btn--chico btn--secundario', '−');
  bMenos.type = 'button'; bMenos.setAttribute('aria-label', 'Alejar el diagrama');
  const bMas = dgEl('button', 'btn btn--chico btn--secundario', '+');
  bMas.type = 'button'; bMas.setAttribute('aria-label', 'Acercar el diagrama');
  const bAjustar = dgEl('button', 'btn btn--chico btn--secundario', 'Ajustar');
  bAjustar.type = 'button'; bAjustar.setAttribute('aria-label', 'Ajustar el diagrama al ancho disponible');
  zoomGrupo.append(bMenos, bMas, bAjustar);
  barra.appendChild(zoomGrupo);

  const ayuda = dgEl('p', 'dg-ayuda', 'Un clic en un cuadro lleva a ese paso de la guía. Los cuadros resaltados son el camino que ya se recorrió. En pantallas pequeñas se desliza para ver el resto.');

  const visor = dgEl('div', 'dg-visor');
  visor.tabIndex = 0;
  visor.setAttribute('aria-label', 'Diagrama de flujo del procedimiento completo');
  const lienzo = dgEl('div', 'dg-lienzo');
  const capa = document.createElementNS(NS_DG, 'svg');
  capa.setAttribute('class', 'dg-capa');
  capa.setAttribute('aria-hidden', 'true');
  const rejilla = dgEl('div', 'dg-rejilla');
  lienzo.append(capa, rejilla);
  visor.appendChild(lienzo);

  raiz.append(barra, ayuda, visor);

  // --- Vista actual ---------------------------------------------------------
  let visibles = [];
  let cajas = {};

  const esVisible = (id) => visibles.some((p) => p.id === id);

  function colocar() {
    visibles = pasos.filter((p) => vista === 'todo' || p.etapa === vista);
    const filas = [], cols = [];
    visibles.forEach(function (p) {
      filas.push(p.pos[1]);
      for (let c = p.pos[0]; c < p.pos[0] + (p.pos[2] || 1); c++) cols.push(c);
    });
    // Se quitan las filas y columnas vacías (al ver solo una etapa, por ejemplo).
    const unicas = (a) => Array.from(new Set(a)).sort((x, y) => x - y);
    const uf = unicas(filas), uc = unicas(cols);
    rejilla.replaceChildren();
    rejilla.style.setProperty('--dg-columnas', uc.length);
    if (datos.ancho) rejilla.style.setProperty('--dg-ancho', datos.ancho + 'em');
    else rejilla.style.removeProperty('--dg-ancho');
    cajas = {};

    visibles.forEach(function (p) {
      const clases = ['dg-nodo', 'dg-' + ((p.tipo === 'decision' && p.forma === 'terminal') ? 'accion' : p.tipo)];
      if (p.forma === 'terminal') clases.push('dg-terminal');
      if (opc.visitado(p.id)) clases.push('dg-visto');
      if (opc.idActual() === p.id) clases.push('dg-actual');
      const caja = dgEl('div', clases.join(' '));
      caja.dataset.id = p.id;
      caja.style.gridColumn = (uc.indexOf(p.pos[0]) + 1) + ' / span ' + (p.pos[2] || 1);
      caja.style.gridRow = String(uf.indexOf(p.pos[1]) + 1);

      const texto = p.nodo || (p.tipo === 'decision' && p.texto.length > 46 ? p.titulo : (p.tipo === 'paralelo' ? p.titulo : p.texto));
      if (p.tipo === 'decision' && p.forma !== 'terminal') {
        const rombo = document.createElementNS(NS_DG, 'svg');
        rombo.setAttribute('class', 'dg-rombo');
        rombo.setAttribute('viewBox', '0 0 100 100');
        rombo.setAttribute('preserveAspectRatio', 'none');
        rombo.setAttribute('aria-hidden', 'true');
        rombo.innerHTML = '<polygon points="50,1 99,50 50,99 1,50" vector-effect="non-scaling-stroke"/>';
        caja.appendChild(rombo);
      } else if (p.tipo !== 'nota' && p.icono && opc.dibujar) {
        const ic = opc.dibujar(p);
        ic.setAttribute('class', 'guia-dibujo dg-icono');
        caja.appendChild(ic);
      }
      caja.appendChild(dgEl('span', 'dg-texto', texto));
      if (p.tipo !== 'nota') {
        caja.tabIndex = 0;
        caja.setAttribute('role', 'button');
        caja.setAttribute('aria-label', 'Ir a este paso: ' + p.titulo);
        caja.addEventListener('click', () => opc.alIr(p.id));
        caja.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opc.alIr(p.id); }
        });
      }

      // Enlaces a otra etapa (solo cuando se ve una etapa sola)
      if (vista !== 'todo') {
        const entra = aristas.filter((e) => e.a === p.id && !esVisible(e.de) && porId[e.de].etapa !== p.etapa);
        const sale = aristas.filter((e) => e.de === p.id && !esVisible(e.a) && porId[e.a].etapa !== p.etapa);
        const puente = function (clase, etiqueta, destino) {
          const b = dgEl('button', 'dg-puente ' + clase, etiqueta);
          b.type = 'button';
          b.addEventListener('click', function (ev) { ev.stopPropagation(); mostrar(destino); });
          b.addEventListener('keydown', (ev) => ev.stopPropagation());
          caja.appendChild(b);
        };
        entra.slice(0, 1).forEach((e) => puente('dg-puente--entra', '↑ Viene de: ' + (nombreEtapa[porId[e.de].etapa] || porId[e.de].titulo), porId[e.de].etapa));
        sale.slice(0, 1).forEach((e) => puente('dg-puente--sale', 'Continúa en: ' + (nombreEtapa[porId[e.a].etapa] || porId[e.a].titulo) + ' ↓', porId[e.a].etapa));
      }
      rejilla.appendChild(caja);
      cajas[p.id] = caja;
    });
  }

  // --- Trazado de grupos y flechas -------------------------------------------
  function ancla(caja, lado) {
    const r = caja.getBoundingClientRect();
    const l = lienzo.getBoundingClientRect();
    const x = r.left - l.left, y = r.top - l.top;
    if (lado === 'arriba') return { x: x + r.width / 2, y: y };
    if (lado === 'izq') return { x: x, y: y + r.height / 2 };
    if (lado === 'der') return { x: x + r.width, y: y + r.height / 2 };
    return { x: x + r.width / 2, y: y + r.height };
  }

  function lados(a, b) {
    const ra = cajas[a].getBoundingClientRect(), rb = cajas[b].getBoundingClientRect();
    const ca = ra.top + ra.height / 2, cb = rb.top + rb.height / 2;
    if (Math.abs(ca - cb) < 6) return rb.left + rb.width / 2 > ra.left + ra.width / 2 ? ['der', 'izq'] : ['izq', 'der'];
    if (cb > ca) return ['abajo', 'arriba'];
    return ['der', 'der']; // vuelve hacia arriba: da la vuelta por la derecha
  }

  function ruta(p1, l1, p2, l2, fusion, huecoY) {
    const vert = (l) => l === 'abajo' || l === 'arriba';
    if (vert(l1) && vert(l2) && l1 !== l2) {
      if (Math.abs(p1.x - p2.x) < 2) return [p1, p2];
      const y = fusion ? Math.max(p1.y + 6, p2.y - huecoY / 2) : p1.y + (p2.y - p1.y) / 2;
      return [p1, { x: p1.x, y: y }, { x: p2.x, y: y }, p2];
    }
    if (!vert(l1) && vert(l2)) return [p1, { x: p2.x, y: p1.y }, p2];
    if (vert(l1) && !vert(l2)) return [p1, { x: p1.x, y: p2.y }, p2];
    if (l1 === l2) {
      const x = l1 === 'izq' ? Math.min(p1.x, p2.x) - 30 : Math.max(p1.x, p2.x) + 30;
      return [p1, { x: x, y: p1.y }, { x: x, y: p2.y }, p2];
    }
    if (Math.abs(p1.y - p2.y) < 2) return [p1, p2];
    const xm = p1.x + (p2.x - p1.x) / 2;
    return [p1, { x: xm, y: p1.y }, { x: xm, y: p2.y }, p2];
  }

  function trazar() {
    const l = lienzo.getBoundingClientRect();
    if (l.width === 0) return; // la pestaña aún está oculta
    capa.setAttribute('width', lienzo.scrollWidth);
    capa.setAttribute('height', lienzo.scrollHeight);
    capa.replaceChildren();
    const defs = document.createElementNS(NS_DG, 'defs');
    defs.innerHTML = '<marker id="' + idPunta + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0 0L10 5L0 10z" class="dg-punta"/></marker>' +
      '<marker id="' + idPunta + '-ruta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0 0L10 5L0 10z" class="dg-punta dg-punta--ruta"/></marker>';
    capa.appendChild(defs);

    const em = parseFloat(getComputedStyle(lienzo).fontSize) || 16;
    const huecoY = parseFloat(getComputedStyle(rejilla).rowGap) || 3 * em;

    // Recuadros de los grupos ("fase"): Caldo RVS, Coagulasa, Muestra sólida...
    const grupos = {};
    visibles.forEach(function (p) { if (p.fase) (grupos[p.fase] = grupos[p.fase] || []).push(p.id); });
    Object.keys(grupos).forEach(function (nombre) {
      let x1 = Infinity, y1 = Infinity, x2 = 0, y2 = 0;
      const cajasG = grupos[nombre].map(function (id) {
        const r = cajas[id].getBoundingClientRect(), l0 = lienzo.getBoundingClientRect();
        return { x: r.left - l0.left, y: r.top - l0.top, w: r.width, h: r.height };
      });
      cajasG.forEach(function (c) {
        x1 = Math.min(x1, c.x); x2 = Math.max(x2, c.x + c.w);
        y1 = Math.min(y1, c.y); y2 = Math.max(y2, c.y + c.h);
      });
      const pad = 0.7 * em, arriba = 1.75 * em;
      const rect = document.createElementNS(NS_DG, 'rect');
      rect.setAttribute('class', 'dg-grupo');
      rect.setAttribute('x', x1 - pad); rect.setAttribute('y', y1 - arriba);
      rect.setAttribute('width', x2 - x1 + 2 * pad); rect.setAttribute('height', y2 - y1 + arriba + pad);
      rect.setAttribute('rx', 10);
      capa.appendChild(rect);
      const t = document.createElementNS(NS_DG, 'text');
      t.setAttribute('class', 'dg-grupo-nombre');
      const lx = x1 - pad + 0.8 * em;
      t.setAttribute('x', lx); t.setAttribute('y', y1 - arriba + 1.2 * em);
      t.textContent = nombre;
      capa.appendChild(t);
      // Si el nombre llegaría hasta la flecha que entra al primer cuadro, se achica.
      const centro = Math.min.apply(null, cajasG.filter((c) => c.y < y1 + 2).map((c) => c.x + c.w / 2));
      const libre = centro - lx - 10;
      const largo = t.getComputedTextLength ? t.getComputedTextLength() : 0;
      if (libre > 0 && largo > libre) t.style.fontSize = Math.max(0.5, 0.72 * libre / largo) + 'em';
    });

    // Flechas
    const dibujables = aristas.filter((e) => cajas[e.de] && cajas[e.a]);
    const entrantes = {};
    dibujables.forEach((e) => { entrantes[e.a] = (entrantes[e.a] || 0) + 1; });
    dibujables.forEach(function (e) {
      const forzado = (porId[e.de].lados || {})[e.a];
      const par = forzado || lados(e.de, e.a);
      const p1 = ancla(cajas[e.de], par[0]), p2 = ancla(cajas[e.a], par[1]);
      const pts = ruta(p1, par[0], p2, par[1], entrantes[e.a] > 1, huecoY);
      const enRuta = opc.visitado(e.de) && opc.visitado(e.a);
      const trazo = document.createElementNS(NS_DG, 'path');
      trazo.setAttribute('d', 'M' + pts.map((q) => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(' L'));
      trazo.setAttribute('class', 'dg-arista' + (e.punteada ? ' dg-arista--punteada' : '') + (enRuta ? ' dg-arista--ruta' : ''));
      trazo.setAttribute('marker-end', e.punteada ? 'none' : 'url(#' + idPunta + (enRuta ? '-ruta' : '') + ')');
      capa.appendChild(trazo);

      if (e.etq) {
        const t = document.createElementNS(NS_DG, 'text');
        t.setAttribute('class', 'dg-etiqueta');
        let k = -1;
        for (let n = 1; n < pts.length; n++) {
          if (Math.abs(pts[n].y - pts[n - 1].y) < 1 && Math.abs(pts[n].x - pts[n - 1].x) >= 24) { k = n; break; }
        }
        if (k > 0) {
          t.setAttribute('x', (pts[k].x + pts[k - 1].x) / 2); t.setAttribute('y', pts[k].y - 5);
          t.setAttribute('text-anchor', 'middle');
        } else {
          t.setAttribute('x', pts[0].x + 7); t.setAttribute('y', pts[0].y + 1.2 * em);
        }
        t.textContent = e.etq;
        capa.appendChild(t);
      }
    });
  }

  // --- Zoom y ajuste -----------------------------------------------------------
  function aplicarZoom(z) {
    zoom = Math.min(Math.max(z, 0.45), 1.6);
    lienzo.style.fontSize = zoom + 'rem';
    trazar();
  }

  function ajustar() {
    if (visor.clientWidth === 0) return;
    lienzo.style.fontSize = '1rem';
    const cs = getComputedStyle(lienzo);
    const natural = rejilla.offsetWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const z = Math.min(1, (visor.clientWidth - 4) / natural);
    ajusteAuto = true;
    // En celular no se reduce tanto: el texto debe seguir siendo legible (el resto se desliza).
    aplicarZoom(Math.max(window.innerWidth <= 760 ? 0.75 : 0.5, z));
  }

  bMenos.addEventListener('click', function () { ajusteAuto = false; aplicarZoom(zoom - 0.12); });
  bMas.addEventListener('click', function () { ajusteAuto = false; aplicarZoom(zoom + 0.12); });
  bAjustar.addEventListener('click', ajustar);

  function mostrar(v) {
    vista = v;
    Object.keys(botonesVista).forEach(function (id) {
      botonesVista[id].setAttribute('aria-selected', String(id === vista));
      botonesVista[id].classList.toggle('es-activa', id === vista);
    });
    colocar();
    visor.scrollTop = 0; visor.scrollLeft = 0;
    if (ajusteAuto) ajustar(); else trazar();
    // Lleva el paso actual a la vista si está en esta pestaña
    const actual = cajas[opc.idActual()];
    if (actual && visor.scrollHeight > visor.clientHeight) {
      const dy = actual.getBoundingClientRect().top - visor.getBoundingClientRect().top - visor.clientHeight / 3;
      if (dy > 0) visor.scrollTop = dy;
    }
  }

  // Redibuja cuando cambia el tamaño o cuando la pestaña pasa de oculta a visible.
  let anchoPrevio = 0;
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      const w = visor.clientWidth;
      if (w === 0) return;
      if (w !== anchoPrevio) { anchoPrevio = w; if (ajusteAuto) ajustar(); else trazar(); }
    }).observe(visor);
  }

  return { raiz: raiz, mostrar: mostrar, vistaActual: () => vista, iniciar: () => mostrar(vista) };
}
