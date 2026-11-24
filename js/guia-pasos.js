// js/guia-pasos.js
// Guía interactiva "paso a paso" para la pestaña "Proceso" de cada método.
// Los pasos están en js/guias-datos.js.
//
// Uso en el HTML:
//   <div class="guia-pasos" data-guia="mesofilos-aerobios"></div>
//
// Qué hace:
//   - Muestra un paso a la vez, con un dibujo animado, el texto del paso y
//     las cifras importantes (temperaturas, tiempos, volúmenes) como etiquetas.
//   - En las preguntas de sí/no, quien lee elige y la guía sigue por esa ruta.
//   - Cuando hay rutas que se hacen las dos (por ejemplo, dos caldos), se
//     elige cuál ver primero y la guía lleva la cuenta de cuál falta.
//   - A la izquierda se va armando "Mi ruta".
//   - "Ver procedimiento completo" muestra el diagrama de flujo del método
//     (js/guia-diagrama.js), con una pestaña por etapa cuando el método tiene
//     varias (Salmonella, S. aureus, NMP) y otra "Todo". Desde el diagrama se
//     puede saltar a cualquier paso.
//   Todo el texto se escribe con textContent; los dibujos son SVG propios.

const NS = 'http://www.w3.org/2000/svg';

function el(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined && texto !== null) e.textContent = texto;
  return e;
}

// ---------------------------------------------------------------------
// Dibujos (SVG, viewBox 120 x 120). Clases: t = contorno, f = relleno suave;
// anim-* son animaciones definidas en css/styles.css (sección 29).
// ---------------------------------------------------------------------
const ICONOS = {
  tubo:
    '<path class="t" d="M46 16h28M48 16v62a12 12 0 0 0 24 0V16"/>' +
    '<path class="f" d="M48 52h24v26a12 12 0 0 1-24 0z"/>' +
    '<circle class="f anim-burbuja" cx="58" cy="76" r="3"/><circle class="f anim-burbuja b2" cx="64" cy="70" r="2.2"/>',
  tubos:
    '<g transform="translate(-30 6) scale(.8)"><path class="t" d="M46 16h28M48 16v62a12 12 0 0 0 24 0V16"/><path class="f" d="M48 52h24v26a12 12 0 0 1-24 0z"/></g>' +
    '<g transform="translate(18 6) scale(.8)"><path class="t" d="M46 16h28M48 16v62a12 12 0 0 0 24 0V16"/><path class="f" d="M48 40h24v38a12 12 0 0 1-24 0z"/></g>' +
    '<g transform="translate(66 6) scale(.8)"><path class="t" d="M46 16h28M48 16v62a12 12 0 0 0 24 0V16"/><path class="f" d="M48 64h24v14a12 12 0 0 1-24 0z"/></g>',
  pipeta:
    '<circle class="f" cx="60" cy="22" r="10"/><path class="t" d="M53 31h14l-3 40-4 15-4-15z"/>' +
    '<path class="f anim-gota" d="M60 92c-5 7-7 10-7 14a7 7 0 0 0 14 0c0-4-2-7-7-14z"/>',
  microscopio:
    '<path class="t" d="M44 18l16-6 14 34-16 6z"/><path class="t" d="M70 44c20 8 20 36-4 44"/>' +
    '<path class="t" d="M38 76h26M30 98h60M46 98V88h24v10"/><circle class="f anim-pulso" cx="53" cy="82" r="3"/>',
  calculo:
    '<rect class="t" x="34" y="14" width="52" height="92" rx="7"/><rect class="f" x="42" y="24" width="36" height="18" rx="2"/>' +
    '<g class="f"><circle cx="48" cy="58" r="4"/><circle cx="60" cy="58" r="4"/><circle cx="72" cy="58" r="4"/>' +
    '<circle cx="48" cy="72" r="4"/><circle cx="60" cy="72" r="4"/><circle cx="72" cy="72" r="4"/>' +
    '<circle cx="48" cy="86" r="4"/><circle cx="60" cy="86" r="4"/><circle cx="72" cy="86" r="4"/></g>',
  copo:
    '<path class="t anim-giro lento" d="M60 18v50M38 30l44 26M38 56l44-26"/>' +
    '<path class="f anim-gota" d="M60 86c-5 7-7 10-7 14a7 7 0 0 0 14 0c0-4-2-7-7-14z"/>',
  balanza:
    '<path class="t" d="M34 104h52M60 104V30"/><g class="anim-vaiven"><path class="t" d="M30 34h60"/>' +
    '<path class="f" d="M30 34l-12 28h24zM90 34l-12 28h24z"/></g>',
  frasco:
    '<path class="t" d="M50 14h20M52 14v30L28 94a6 6 0 0 0 5 9h54a6 6 0 0 0 5-9L68 44V14"/>' +
    '<path class="f" d="M40 74h40l9 20a6 6 0 0 1-5 9H36a6 6 0 0 1-5-9z"/><circle class="f anim-burbuja" cx="56" cy="88" r="3"/>',
  licuadora:
    '<path class="t" d="M32 16h56l-8 62H40zM28 16h64"/><path class="f" d="M38 48h44l-4 30H42z"/>' +
    '<rect class="t" x="38" y="78" width="44" height="20" rx="5"/><g class="anim-giro"><path class="t" d="M50 66h20"/></g>',
  sedimento:
    '<path class="t" d="M46 16h28M48 16v62a12 12 0 0 0 24 0V16"/><path class="f" d="M48 30h24v48a12 12 0 0 1-24 0z"/>' +
    '<circle class="f anim-caida" cx="56" cy="36" r="2.6"/><circle class="f anim-caida c2" cx="64" cy="40" r="2.2"/>' +
    '<circle class="f anim-caida c3" cx="60" cy="34" r="2.4"/><path class="t" d="M52 86h16"/>',
  bano:
    '<rect class="t" x="22" y="52" width="76" height="46" rx="7"/><path class="f" d="M26 66q8-6 17 0t17 0 17 0 17 0v28a3 3 0 0 1-3 3H29a3 3 0 0 1-3-3z"/>' +
    '<path class="t anim-vapor" d="M42 38q-6-8 0-16M60 38q-6-8 0-16"/><path class="t anim-vapor v2" d="M78 38q-6-8 0-16"/>',
  agitar:
    '<g class="anim-vaiven2"><path class="t" d="M50 18h20M52 18v28L30 94a6 6 0 0 0 5 9h50a6 6 0 0 0 5-9L68 46V18"/>' +
    '<path class="f" d="M40 76h40l9 18a6 6 0 0 1-5 9H36a6 6 0 0 1-5-9z"/></g>' +
    '<path class="t" d="M16 48q-8 16 0 32M104 48q8 16 0 32"/>',
  reloj:
    '<circle class="t" cx="60" cy="60" r="40"/><circle class="f" cx="60" cy="60" r="4"/>' +
    '<path class="t anim-giro" d="M60 60V30"/><path class="t anim-giro lento" d="M60 60l16 10"/>',
  ph:
    '<rect class="t" x="44" y="12" width="32" height="96" rx="5"/>' +
    '<rect class="f" x="48" y="20" width="24" height="14" opacity=".35"/><rect class="f" x="48" y="38" width="24" height="14" opacity=".55"/>' +
    '<rect class="f anim-pulso" x="48" y="56" width="24" height="14" opacity=".8"/><rect class="f" x="48" y="74" width="24" height="14" opacity=".55"/>',
  incubadora:
    '<rect class="t" x="22" y="16" width="76" height="90" rx="7"/><rect class="t" x="30" y="24" width="60" height="70" rx="3"/>' +
    '<path class="t" d="M30 48h60M30 70h60"/><circle class="f anim-pulso" cx="60" cy="98" r="3"/>' +
    '<path class="t anim-vapor" d="M46 14q-4-6 0-12M60 14q-4-6 0-12M74 14q-4-6 0-12"/>',
  interrogacion:
    '<circle class="t" cx="60" cy="60" r="40"/><path class="t anim-pulso" d="M46 50a14 14 0 1 1 20 13c-4 2-6 5-6 10"/><circle class="f" cx="60" cy="88" r="3.4"/>',
};

// Posiciones fijas de unas cuantas colonias dentro de la caja (espiral áurea)
const COLONIAS = (function () {
  const r = [];
  for (let i = 1; i <= 26; i++) {
    const d = 4 + 30 * Math.sqrt(i / 26);
    const a = i * 2.39996;
    r.push([60 + d * Math.cos(a), 60 + d * Math.sin(a), 1.8 + (i % 3) * 0.7]);
  }
  return r;
})();

function dibujoPlaca(estado) {
  const agar = estado !== 'vacia' && estado !== 'gota';
  let s = '<circle class="t" cx="60" cy="60" r="46"/><circle class="t" cx="60" cy="60" r="40" opacity=".5"/>';
  if (agar) s += '<circle class="f agar" cx="60" cy="60" r="39"/>';
  if (estado === 'gota') {
    s += '<path class="f anim-gota" d="M60 38c-5 7-7 10-7 14a7 7 0 0 0 14 0c0-4-2-7-7-14z"/>';
  }
  if (estado === 'mezcla') {
    s += '<g class="anim-giro"><path class="t" d="M60 28a32 32 0 0 1 30 22"/><path class="t" d="M90 50l-2-9m2 9l-9 1"/>' +
      '<path class="t" d="M60 92a32 32 0 0 1-30-22"/><path class="t" d="M30 70l2 9m-2-9l9-1"/></g>';
  }
  if (estado === 'incubar' || estado === 'colonias') {
    s += COLONIAS.map(function (c, i) {
      return '<circle class="col" style="animation-delay:' + (estado === 'incubar' ? (0.4 + i * 0.12).toFixed(2) : 0) +
        's" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + c[2].toFixed(1) + '"/>';
    }).join('');
  }
  return s;
}

function crearDibujo(paso) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('class', 'guia-dibujo');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paso.icono === 'placa' ? dibujoPlaca(paso.placa || 'vacia') : (ICONOS[paso.icono] || ICONOS.interrogacion);
  return svg;
}

// Etiquetas con icono pequeño según el tipo de cifra
const ICONO_DATO = {
  temp: '<path d="M10 3a2 2 0 0 0-2 2v6.2a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2z"/>',
  tiempo: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/>',
  volumen: '<path d="M10 3c-3.5 4.5-5 6.8-5 9a5 5 0 0 0 10 0c0-2.2-1.5-4.5-5-9z"/>',
  medida: '<path d="M3 7h14v6H3zM6 7v3M9 7v2M12 7v3M15 7v2"/>',
  ph: '<path d="M6 3h8v14H6zM6 8h8M6 12h8"/>',
};

function crearEtiqueta(d) {
  const span = el('span', 'guia-dato guia-dato--' + d.k);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONO_DATO[d.k] || ICONO_DATO.medida;
  span.appendChild(svg);
  span.appendChild(el('span', null, d.t));
  return span;
}

// ---------------------------------------------------------------------
function crearGuia(contenedor, datos) {
  const pasos = datos.pasos;
  const porId = {};
  pasos.forEach(function (p, i) { p.i = i; porId[p.id] = p; });

  let historial = [pasos[0].id];   // ids de los pasos recorridos; el último es el actual
  let verTodo = false;
  let pantallaCompleta = false;
  let vistaDiagrama = null;   // pestaña del diagrama que se estaba viendo
  let diagrama = null;

  const etapas = {};
  (datos.etapas || []).forEach((e) => { etapas[e.id] = e.nombre; });
  const actual = () => porId[historial[historial.length - 1]];
  const siguienteDe = (p) => p.sig ? porId[p.sig] : pasos[p.i + 1];

  // Pasos de rama ya terminados, calculados desde el historial
  function ramasHechas(idParalelo) {
    const hechas = {};
    historial.slice(0, -1).forEach(function (id) {
      const p = porId[id];
      if (p.ramaDe === idParalelo && p.sig === idParalelo) hechas[p.ramaNombre] = true;
    });
    // Si el paso actual es el último de su rama no cuenta hasta que se avance
    return hechas;
  }

  // Pasos a los que se puede llegar desde uno dado
  function vecinos(p) {
    if (p.tipo === 'nota' || p.tipo === 'fin') return [];
    if (p.opciones) return p.opciones.map((o) => o.ir);
    const s = siguienteDe(p);
    const seguir = s ? [s.id] : [];
    return p.ramas ? p.ramas.map((r) => r.ir).concat(seguir) : seguir;
  }

  // Cuántos pasos faltan, como mínimo, para llegar a un paso final
  function faltan(desdeId) {
    const visto = {}; visto[desdeId] = 0; const cola = [desdeId];
    while (cola.length) {
      const id = cola.shift(); const p = porId[id];
      if (p.tipo === 'fin') return visto[id];
      vecinos(p).forEach(function (s) { if (!(s in visto)) { visto[s] = visto[id] + 1; cola.push(s); } });
    }
    return 0;
  }

  // Camino más corto desde el primer paso hasta uno dado (para saltar desde el diagrama)
  function rutaHasta(destino) {
    const antes = {}; antes[pasos[0].id] = null; const cola = [pasos[0].id];
    while (cola.length) {
      const id = cola.shift();
      if (id === destino) break;
      vecinos(porId[id]).forEach(function (s) { if (!(s in antes)) { antes[s] = id; cola.push(s); } });
    }
    if (!(destino in antes)) return null;
    const camino = [];
    for (let id = destino; id !== null; id = antes[id]) camino.unshift(id);
    return camino;
  }

  // --- Estructura fija ---------------------------------------------------
  contenedor.replaceChildren();
  const marco = el('div', 'guia');
  contenedor.appendChild(marco);

  const cabecera = el('div', 'guia-cabecera');
  const titulo = el('p', 'guia-titulo', datos.titulo);
  const herramientas = el('div', 'guia-herramientas');
  function boton(texto, etiqueta, clic, clase) {
    const b = el('button', 'btn btn--chico ' + (clase || 'btn--secundario'), texto);
    b.type = 'button'; if (etiqueta) b.setAttribute('aria-label', etiqueta);
    b.addEventListener('click', clic); return b;
  }
  const bReiniciar = boton('↺ Reiniciar', 'Volver al primer paso', reiniciar);
  const bTodo = boton('Ver procedimiento completo', null, function () { verTodo = !verTodo; pintar(false); });
  const bPantalla = boton('⛶ Pantalla completa', 'Ver la guía a pantalla completa', alternarPantalla);
  herramientas.append(bReiniciar, bTodo, bPantalla);
  cabecera.append(titulo, herramientas);

  const progreso = el('div', 'guia-progreso');
  progreso.setAttribute('role', 'progressbar');
  progreso.setAttribute('aria-valuemin', '0'); progreso.setAttribute('aria-valuemax', '100');
  const barra = el('div', 'guia-progreso-barra');
  progreso.appendChild(barra);

  const cuerpo = el('div', 'guia-cuerpo');
  const ruta = el('ol', 'guia-ruta');
  ruta.setAttribute('aria-label', 'Mi ruta');
  const escenario = el('div', 'guia-escenario');
  escenario.tabIndex = -1;
  cuerpo.append(ruta, escenario);

  const aviso = el('p', 'solo-lector');
  aviso.setAttribute('aria-live', 'polite');

  marco.append(cabecera, progreso, cuerpo, aviso);

  // --- Navegación --------------------------------------------------------
  function ir(id) { historial.push(id); pintar(true); }
  function avanzar() { const s = siguienteDe(actual()); if (s) ir(s.id); }
  function retroceder() { if (historial.length > 1) { historial.pop(); pintar(true); } }
  function reiniciar() { historial = [pasos[0].id]; verTodo = false; pintar(true); }
  function saltarA(indice) { historial = historial.slice(0, indice + 1); verTodo = false; pintar(true); }
  function saltarAPaso(id) {
    const camino = rutaHasta(id);
    if (!camino) return;
    historial = camino; verTodo = false; pintar(true);
  }

  // --- Dibujo de la pantalla ----------------------------------------------
  function pintarRuta() {
    ruta.replaceChildren();
    historial.forEach(function (id, n) {
      const p = porId[id];
      const esActual = n === historial.length - 1;
      const li = el('li', 'guia-ruta-item' + (esActual ? ' es-actual' : ' es-hecho'));
      const b = el('button', 'guia-ruta-boton');
      b.type = 'button';
      b.appendChild(el('span', 'guia-ruta-punto', esActual ? '' : '✓'));
      b.appendChild(el('span', 'guia-ruta-texto', p.titulo));
      if (esActual) b.setAttribute('aria-current', 'step');
      else b.addEventListener('click', function () { saltarA(n); });
      li.appendChild(b);
      ruta.appendChild(li);
    });
  }

  function pintarPaso(p) {
    const tarjeta = el('div', 'guia-tarjeta guia-tipo-' + p.tipo);

    const dibujo = el('div', 'guia-figura');
    dibujo.appendChild(crearDibujo(p));
    if (p.tipo === 'fin') {
      const ok = el('span', 'guia-ok', '✓'); dibujo.appendChild(ok);
    }
    const texto = el('div', 'guia-texto');
    if (p.fase) texto.appendChild(el('p', 'guia-fase', p.fase));
    let etiquetaTipo = p.tipo === 'decision' ? 'Decisión' : p.tipo === 'paralelo' ? 'Varias rutas' : p.tipo === 'fin' ? 'Final' : 'Paso ' + historial.length;
    if (p.etapa && etapas[p.etapa]) etiquetaTipo = etapas[p.etapa] + ' · ' + etiquetaTipo;
    texto.appendChild(el('p', 'guia-numero', etiquetaTipo));
    texto.appendChild(el('h3', 'guia-paso-titulo', p.titulo));
    texto.appendChild(el('p', 'guia-instruccion', p.texto));
    if (p.nota) texto.appendChild(el('p', 'guia-nota', p.nota));

    if (p.datos && p.datos.length) {
      const fila = el('div', 'guia-datos');
      p.datos.forEach((d) => fila.appendChild(crearEtiqueta(d)));
      texto.appendChild(fila);
    }
    if (p.lista) {
      const caja = el('div', 'guia-lista');
      if (p.listaTitulo) caja.appendChild(el('p', 'guia-lista-titulo', p.listaTitulo));
      const ol = el('ol');
      p.lista.forEach((t, n) => { const li = el('li', null, t); li.style.animationDelay = (0.25 + n * 0.18) + 's'; ol.appendChild(li); });
      caja.appendChild(ol);
      texto.appendChild(caja);
    }

    // Acciones
    const acciones = el('div', 'guia-acciones');
    let principal = null;
    if (p.tipo === 'decision') {
      p.opciones.forEach(function (o, n) {
        const b = el('button', 'btn guia-opcion' + (n ? ' btn--secundario' : ''), o.t);
        b.type = 'button'; b.addEventListener('click', () => ir(o.ir));
        acciones.appendChild(b); if (!principal) principal = b;
      });
    } else if (p.tipo === 'paralelo') {
      const hechas = ramasHechas(p.id);
      const lista = el('div', 'guia-ramas');
      let faltanRamas = 0;
      p.ramas.forEach(function (r) {
        const hecha = !!hechas[r.nombre]; if (!hecha) faltanRamas++;
        const b = el('button', 'guia-rama' + (hecha ? ' es-hecha' : ''));
        b.type = 'button';
        b.appendChild(el('span', 'guia-rama-nombre', (hecha ? '✓ ' : '') + r.nombre));
        b.appendChild(el('span', 'guia-rama-resumen', hecha ? 'Hecha. Ver de nuevo' : r.resumen));
        b.addEventListener('click', () => ir(r.ir));
        lista.appendChild(b); if (!principal && !hecha) principal = b;
      });
      texto.appendChild(lista);
      texto.appendChild(el('p', 'guia-faltan', faltanRamas
        ? 'Falta ' + (faltanRamas === 1 ? '1 ruta' : faltanRamas + ' rutas') + ' por ver.'
        : (p.ramas.length === 2 ? 'Las dos rutas están completas.' : 'Las ' + p.ramas.length + ' rutas están completas.')));
      if (!faltanRamas) {
        const b = el('button', 'btn', 'Continuar →'); b.type = 'button';
        b.addEventListener('click', avanzar); acciones.appendChild(b); principal = b;
      }
    } else if (p.tipo === 'fin') {
      if (p.accion) {
        const b = el('button', 'btn', p.accion.texto); b.type = 'button';
        b.addEventListener('click', function () {
          const t = document.querySelector('.pestana-boton[data-pestana="' + p.accion.pestana + '"]');
          if (t) t.click();
        });
        acciones.appendChild(b); principal = b;
      }
    } else {
      const b = el('button', 'btn', 'Siguiente paso →'); b.type = 'button';
      b.addEventListener('click', avanzar); acciones.appendChild(b); principal = b;
    }
    if (historial.length > 1) {
      const a = el('button', 'btn btn--secundario', '← Anterior'); a.type = 'button';
      a.addEventListener('click', retroceder);
      // En las preguntas, las respuestas van primero y "Anterior" al final
      if (p.tipo === 'decision') acciones.appendChild(a); else acciones.insertBefore(a, acciones.firstChild);
    }
    texto.appendChild(acciones);

    tarjeta.append(dibujo, texto);
    return { tarjeta, principal };
  }

  function pintarTodo() {
    const caja = el('div', 'guia-todo');
    caja.appendChild(el('h3', null, 'Procedimiento completo'));
    diagrama = crearDiagramaGuia({
      datos: datos,
      porId: porId,
      etapaInicial: vistaDiagrama || actual().etapa,
      visitado: (id) => historial.indexOf(id) !== -1,
      idActual: () => actual().id,
      dibujar: crearDibujo,
      alIr: saltarAPaso,
    });
    caja.appendChild(diagrama.raiz);

    return caja;
  }

  function pintar(moverFoco) {
    const p = actual();
    pintarRuta();
    escenario.replaceChildren();
    let principal = null;
    if (diagrama) { vistaDiagrama = diagrama.vistaActual(); diagrama = null; }
    marco.classList.toggle('guia--todo', verTodo);
    if (verTodo) {
      escenario.appendChild(pintarTodo());
      diagrama.iniciar();
      bTodo.textContent = '← Volver a la guía';
    } else {
      const r = pintarPaso(p);
      escenario.appendChild(r.tarjeta);
      principal = r.principal;
      bTodo.textContent = 'Ver procedimiento completo';
    }
    // Progreso
    const hechos = historial.length;
    const pct = p.tipo === 'fin' ? 100 : Math.round(100 * hechos / (hechos + faltan(p.id)));
    barra.style.width = pct + '%';
    progreso.setAttribute('aria-valuenow', String(pct));
    marco.classList.toggle('es-final', p.tipo === 'fin');
    aviso.textContent = p.titulo + '. ' + p.texto;
    bReiniciar.disabled = historial.length === 1 && !verTodo;
    if (moverFoco && principal) principal.focus({ preventScroll: true });
  }

  // Teclado: flechas para avanzar / retroceder cuando no hay una pregunta
  escenario.addEventListener('keydown', function (e) {
    const p = actual();
    if (e.key === 'ArrowLeft') { e.preventDefault(); retroceder(); }
    else if (e.key === 'ArrowRight' && !p.opciones && p.tipo === 'accion') { e.preventDefault(); avanzar(); }
  });
  marco.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pantallaCompleta && !document.fullscreenElement) salirPantalla();
  });

  function alternarPantalla() {
    if (pantallaCompleta) { if (document.fullscreenElement) document.exitFullscreen(); salirPantalla(); return; }
    pantallaCompleta = true; marco.classList.add('guia--pantalla'); bPantalla.textContent = '✕ Salir de pantalla completa';
    if (marco.requestFullscreen) marco.requestFullscreen().catch(function () { /* queda la capa */ });
  }
  function salirPantalla() {
    pantallaCompleta = false; marco.classList.remove('guia--pantalla'); bPantalla.textContent = '⛶ Pantalla completa';
  }
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && pantallaCompleta) salirPantalla();
  });

  pintar(false);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.guia-pasos[data-guia]').forEach(function (c) {
      const d = (typeof GUIAS !== 'undefined') && GUIAS[c.dataset.guia];
      if (!d) { c.textContent = 'Guía no disponible.'; return; }
      crearGuia(c, d);
    });
  });
}
