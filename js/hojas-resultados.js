// js/hojas-resultados.js
// Hoja de resultados por matriz alimentaria: reúne en una sola hoja los
// resultados de las pruebas que aplican a cada alimento, los compara con
// los límites del manual (js/limites.js) y puede traer los valores
// guardados por las calculadoras UFC y NMP (en este mismo navegador).
//
// PARTE 1: lógica (se prueba con Node). PARTE 2: la página.

var Lim = (typeof module !== 'undefined') ? require('./limites.js') : LIMITES;

// =====================================================================
// PARTE 1. LÓGICA
// =====================================================================

// Pruebas que puede tener una hoja.
//   limite:   clave del límite en js/limites.js
//   calc:     calculadora que la resuelve, y 'metodo' que se le pasa para abrirla
const PRUEBAS_HOJA = [
  { clave: 'mesofilos',    nombre: 'Bacterias aerobias mesófilas',   unidad: 'UFC/g',  limite: 'mesofilos',  calc: 'calculadora-ufc.html', metodo: 'mesofilos-aerobios', tipo: 'ufc' },
  { clave: 'hongos',       nombre: 'Mohos y levaduras',              unidad: 'UFC/g',  limite: 'hongos',     calc: 'calculadora-ufc.html', metodo: 'mohos-levaduras',    tipo: 'ufc' },
  { clave: 'coliformes',   nombre: 'Coliformes totales (placa)',     unidad: 'UFC/g',  limite: 'coliformes', calc: 'calculadora-ufc.html', metodo: 'coliformes-placa',   tipo: 'ufc' },
  { clave: 'coliformesnmp', nombre: 'Coliformes totales (NMP)',      unidad: 'NMP/g',  limite: 'coliformes', calc: 'calculadora-nmp.html', metodo: 'nmp-coliformes',     tipo: 'nmp' },
  { clave: 'salmonella',   nombre: 'Salmonella spp.',                unidad: 'en 25 g', limite: 'salmonella', calc: null, metodo: null, tipo: null },
];

// Pruebas que aplican a un alimento: las que tienen límite en el manual.
// También devuelve las que no (para avisarlo en la hoja).
function pruebasDeAlimento(alimento) {
  const a = Lim.ALIMENTOS[alimento];
  const aplican = [];
  const noAplican = [];
  if (!a) return { aplican: aplican, noAplican: noAplican };
  PRUEBAS_HOJA.forEach(function (p) {
    const l = a[p.limite];
    if (l === undefined || l === 'NA') {
      noAplican.push({ prueba: p, motivo: l === 'NA' ? 'no aplica' : 'sin límite en el manual' });
    } else {
      aplican.push(p);
    }
  });
  return { aplican: aplican, noAplican: noAplican };
}

// Evalúa una fila de la hoja.
//   valor:  número (o 'ausente' / 'presente' para Salmonella)
//   signo:  '' (valor exacto), '<' o '>'
function evaluarFila(prueba, alimento, valor, signo) {
  if (valor === null || valor === undefined || valor === '') return { estado: 'pendiente', limite: null };
  if (prueba.clave === 'salmonella') {
    return { estado: valor === 'ausente' ? 'cumple' : 'no-cumple', limite: 'Ausente en 25 g' };
  }
  const ev = Lim.evaluarLimite(prueba.limite, alimento, Number(valor), signo === '<');
  if (signo === '>' && ev.estado === 'cumple') ev.estado = 'no-concluyente';
  return ev;
}

// Resume el conjunto de filas evaluadas.
function dictamen(estados) {
  const cuenta = { cumple: 0, 'no-cumple': 0, 'no-concluyente': 0, pendiente: 0 };
  estados.forEach(function (e) { cuenta[e] = (cuenta[e] || 0) + 1; });
  let texto;
  if (cuenta['no-cumple'] > 0) texto = 'NO CUMPLE';
  else if (cuenta['no-concluyente'] > 0) texto = 'NO CONCLUYENTE';
  else if (cuenta.cumple === 0) texto = 'SIN RESULTADOS';
  else if (cuenta.pendiente > 0) texto = 'CUMPLE (pruebas pendientes)';
  else texto = 'CUMPLE';
  return { texto: texto, cuenta: cuenta };
}

// Toma los envíos de las calculadoras (ver js/almacen.js) que corresponden
// a este alimento y lote. Devuelve { clavePrueba: { valor, signo } }; si hay
// varios envíos de la misma prueba, queda el último.
function aplicarEnvios(envios, alimento, lote) {
  const clave = String(lote || '').trim().toLowerCase();
  const resultado = {};
  if (!clave) return resultado;
  envios.forEach(function (e) {
    if (e.alimento === alimento && String(e.lote || '').trim().toLowerCase() === clave) {
      resultado[e.prueba] = { valor: e.valor, signo: e.signo || '' };
    }
  });
  return resultado;
}

if (typeof module !== 'undefined') {
  module.exports = { PRUEBAS_HOJA, pruebasDeAlimento, evaluarFila, dictamen, aplicarEnvios };
}

// =====================================================================
// PARTE 2. PÁGINA
// =====================================================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', iniciarHojaResultados);
}

function iniciarHojaResultados() {
  const formulario = document.getElementById('hoja-resultados');
  if (!formulario) return;

  const selAlimento = formulario.elements.alimento;
  const cuerpo = document.getElementById('res-filas');
  const notaNoAplican = document.getElementById('res-no-aplican');
  const salidaDictamen = document.getElementById('res-dictamen');
  const estadoGuardado = document.getElementById('res-estado');

  function crear(etiqueta, texto, clase) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined && texto !== null) el.textContent = texto;
    if (clase) el.className = clase;
    return el;
  }

  Object.keys(Lim.ALIMENTOS).forEach(function (k) {
    const o = crear('option', Lim.ALIMENTOS[k].nombre);
    o.value = k;
    selAlimento.appendChild(o);
  });
  const parametros = new URLSearchParams(window.location.search);
  if (Lim.ALIMENTOS[parametros.get('alimento')]) selAlimento.value = parametros.get('alimento');
  if (parametros.get('muestra')) formulario.elements.lote.value = parametros.get('muestra');

  const TEXTO = {
    cumple: ['CUMPLE', 'ok'], 'no-cumple': ['NO CUMPLE', 'error'],
    'no-concluyente': ['NO CONCLUYENTE', 'aviso'], pendiente: ['—', ''],
    'no-aplica': ['NO APLICA', 'aviso'], 'sin-limite': ['SIN LÍMITE', 'aviso'],
  };

  function direccionCalculadora(p) {
    const q = new URLSearchParams({ metodo: p.metodo, alimento: selAlimento.value });
    const lote = formulario.elements.lote.value.trim();
    if (lote) q.set('muestra', lote);
    return p.calc + '?' + q.toString();
  }

  function limiteTexto(p) {
    if (p.clave === 'salmonella') return 'Ausente en 25 g';
    return Lim.evaluarLimite(p.limite, selAlimento.value, 0, false).limite ||
      (p.clave === 'salmonella' ? 'Ausente en 25 g' : '');
  }

  function crearFila(p) {
    const fila = crear('tr', null, 'res-fila');
    fila.dataset.clave = p.clave;
    fila.appendChild(crear('th', p.nombre)).scope = 'row';

    const celdaValor = crear('td');
    if (p.clave === 'salmonella') {
      const sel = crear('select', null, 'res-valor');
      sel.setAttribute('aria-label', 'Resultado de Salmonella');
      [['', 'Sin resultado'], ['ausente', 'Ausente en 25 g'], ['presente', 'Presente en 25 g']].forEach(function (par) {
        const o = crear('option', par[1]);
        o.value = par[0];
        sel.appendChild(o);
      });
      celdaValor.appendChild(sel);
    } else {
      const signo = crear('select', null, 'res-signo');
      signo.setAttribute('aria-label', 'Tipo de valor de ' + p.nombre);
      [['', '='], ['<', '<'], ['>', '>']].forEach(function (par) {
        const o = crear('option', par[1]);
        o.value = par[0];
        signo.appendChild(o);
      });
      const num = crear('input', null, 'res-valor');
      num.type = 'number';
      num.min = '0';
      num.step = 'any';
      num.setAttribute('aria-label', 'Resultado de ' + p.nombre + ' en ' + p.unidad);
      celdaValor.appendChild(signo);
      celdaValor.appendChild(num);
      celdaValor.appendChild(crear('span', ' ' + p.unidad, 'res-unidad'));
    }
    celdaValor.appendChild(crear('span', '', 'res-origen'));
    fila.appendChild(celdaValor);

    fila.appendChild(crear('td', limiteTexto(p) + (p.clave === 'salmonella' ? '' : ' ' + p.unidad)));

    const celdaVer = crear('td', '—', 'res-veredicto');
    fila.appendChild(celdaVer);

    const celdaAcc = crear('td', null, p.calc ? 'res-acciones' : '');
    if (p.calc) {
      const enlace = crear('a', 'Calcular', 'btn btn--secundario btn--chico');
      enlace.href = direccionCalculadora(p);
      celdaAcc.appendChild(enlace);
    }
    fila.appendChild(celdaAcc);
    return fila;
  }

  function leerFila(fila, p) {
    const campo = fila.querySelector('.res-valor');
    const signo = fila.querySelector('.res-signo');
    return { valor: campo.value.trim(), signo: signo ? signo.value : '' };
  }

  function mostrarEstado(texto, error) {
    estadoGuardado.textContent = texto;
    estadoGuardado.className = 'hoja-estado ' + (error ? 'hoja-estado--error' : 'hoja-estado--ok');
  }

  // Reconstruye las filas cuando cambia el alimento (conservando lo capturado).
  function armarFilas() {
    const previo = {};
    Array.from(cuerpo.children).forEach(function (f) {
      previo[f.dataset.clave] = { valor: f.querySelector('.res-valor').value,
        signo: f.querySelector('.res-signo') ? f.querySelector('.res-signo').value : '' };
    });
    const r = pruebasDeAlimento(selAlimento.value);
    cuerpo.replaceChildren();
    r.aplican.forEach(function (p) {
      const f = crearFila(p);
      if (previo[p.clave]) {
        f.querySelector('.res-valor').value = previo[p.clave].valor;
        if (f.querySelector('.res-signo')) f.querySelector('.res-signo').value = previo[p.clave].signo;
      }
      cuerpo.appendChild(f);
    });
    notaNoAplican.textContent = r.noAplican.length === 0 ? '' :
      'Sin fila en esta hoja: ' + r.noAplican.map((x) => x.prueba.nombre + ' (' + x.motivo + ')').join('; ') + '.';
  }

  // Pasa a la hoja los resultados enviados desde las calculadoras para este
  // alimento y lote. Solo llena filas vacías o que ya venían de una calculadora
  // (no pisa lo que se escribió a mano).
  function recibirEnvios() {
    const envios = aplicarEnvios(leerEnvios(), selAlimento.value, formulario.elements.lote.value);
    let recibidos = 0;
    Array.from(cuerpo.children).forEach(function (fila) {
      const e = envios[fila.dataset.clave];
      const campo = fila.querySelector('.res-valor');
      if (!e) return;
      if (campo.value.trim() !== '' && fila.dataset.auto !== '1') return;
      campo.value = String(Number(Number(e.valor).toPrecision(6)));
      fila.querySelector('.res-signo').value = e.signo;
      fila.dataset.auto = '1';
      fila.querySelector('.res-origen').textContent = ' · de la calculadora';
      recibidos++;
    });
    return recibidos;
  }

  let ultimo = null;

  function recalcular() {
    const estados = [];
    const filas = [];
    Array.from(cuerpo.children).forEach(function (fila) {
      const p = PRUEBAS_HOJA.find((x) => x.clave === fila.dataset.clave);
      const v = leerFila(fila, p);
      const ev = evaluarFila(p, selAlimento.value, v.valor, v.signo);
      const t = TEXTO[ev.estado];
      const celda = fila.querySelector('.res-veredicto');
      celda.textContent = t[0];
      celda.className = 'res-veredicto' + (t[1] ? ' res-veredicto--' + t[1] : '');
      estados.push(ev.estado);
      filas.push({
        clave: p.clave, nombre: p.nombre, unidad: p.unidad,
        signo: v.signo, valor: v.valor === '' ? null : (p.clave === 'salmonella' ? v.valor : Number(v.valor)),
        limite: ev.limite, veredicto: t[0],
      });
    });
    const d = dictamen(estados);
    salidaDictamen.textContent = d.texto;
    ultimo = { filas: filas, dictamen: d.texto };
  }

  function guardar() {
    const lote = formulario.elements.lote.value.trim();
    if (!lote) {
      mostrarEstado('Falta el código o lote de la muestra.', true);
      formulario.elements.lote.focus();
      return;
    }
    recalcular();
    try {
      const g = guardarRegistro({
        tipo: 'resultados',
        metodo: null,
        codigo: 'Resultados',
        muestra: lote,
        datos: {
          alimento: Lim.ALIMENTOS[selAlimento.value].nombre,
          alimento_clave: selAlimento.value,
          fecha: formulario.elements.fecha.value,
          observaciones: formulario.elements.observaciones.value,
          pruebas: ultimo.filas,
          dictamen: ultimo.dictamen,
        },
        resultado: ultimo.dictamen,
      });
      mostrarEstado('Hoja de resultados guardada en este dispositivo (registro n.º ' + g.id + ').', false);
    } catch (e) {
      mostrarEstado('No se pudo guardar en este navegador. Se puede imprimir la hoja para conservarla.', true);
    }
  }

  document.getElementById('res-imprimir').addEventListener('click', function () { window.print(); });
  selAlimento.addEventListener('change', function () { armarFilas(); recibirEnvios(); recalcular(); });
  formulario.addEventListener('input', function (e) {
    if (e.target === selAlimento) return; // lo atiende el evento 'change'
    if (e.target === formulario.elements.lote) recibirEnvios();
    if (e.target.classList.contains('res-valor') || e.target.classList.contains('res-signo')) {
      const fila = e.target.closest('tr');
      fila.dataset.auto = '';
      fila.querySelector('.res-origen').textContent = '';
    }
    estadoGuardado.textContent = ''; estadoGuardado.className = 'hoja-estado'; recalcular(); });
  formulario.addEventListener('submit', function (e) { e.preventDefault(); guardar(); });
  formulario.addEventListener('reset', function () {
    setTimeout(function () { borrarEnvios(); armarFilas(); recalcular(); estadoGuardado.textContent = ''; estadoGuardado.className = 'hoja-estado'; }, 0);
  });

  armarFilas();
  const recibidos = recibirEnvios();
  recalcular();
  if (recibidos > 0) {
    mostrarEstado('Se recibieron ' + recibidos + (recibidos === 1 ? ' resultado' : ' resultados') +
      ' de las calculadoras. Revisar y apretar «Guardar hoja de resultados» para conservarlos.', false);
  }
}
