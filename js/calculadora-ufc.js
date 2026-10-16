// js/calculadora-ufc.js
// Calculadora de UFC (unidades formadoras de colonias).
//
// Fórmula del manual:  UFC/g = (colonias × factor de dilución) ÷ volumen sembrado
// (el factor de dilución de una dilución 10^-n es 10^n).
//
// Cómo se usa en pantalla:
//   1. Se indica el número de placas, el volumen sembrado y la unidad (g o mL).
//   2. Por cada placa se captura el número de colonias y su dilución.
//   3. La calculadora obtiene las UFC de cada placa y el promedio.
//   4. Debajo del promedio se elige el método y el tipo de alimento, y se
//      indica si el promedio cumple o no con el límite del manual.
//
// El archivo tiene dos partes:
//   PARTE 1: lógica pura (sin pantalla), que también se prueba con Node.
//   PARTE 2: la conexión con la página (DOM).

// =====================================================================
// PARTE 1. LÓGICA
// =====================================================================

// Intervalo de colonias contables por placa en cada método.
const METODOS = {
  'mesofilos-aerobios': { nombre: 'Bacterias aerobias mesófilas', minimo: 25, maximo: 250, limite: 'mesofilos', hoja: 'mesofilos' },
  'mohos-levaduras':    { nombre: 'Mohos y levaduras',            minimo: 10, maximo: 150, limite: 'hongos', hoja: 'hongos' },
  'coliformes-placa':   { nombre: 'Coliformes totales en placa',  minimo: 15, maximo: 150, limite: 'coliformes', hoja: 'coliformes' },
  's-aureus':           { nombre: 'Staphylococcus aureus',        minimo: 15, maximo: 150, limite: null, hoja: null },
};

// Los límites del manual y la comparación con ellos están en js/limites.js
// (en el HTML se carga antes que este archivo).
var Lim = (typeof module !== 'undefined') ? require('./limites.js') : LIMITES;
const ALIMENTOS = Lim.ALIMENTOS;
const evaluarLimite = (metodo, alimento, valor, estimado) =>
  Lim.evaluarLimite(METODOS[metodo] ? METODOS[metodo].limite : null, alimento, valor, estimado);

function factorDeDilucion(exponente) {
  return Math.pow(10, exponente);
}

// ¿La placa está dentro del intervalo contable del método?
// Devuelve 'bajo', 'en' o 'alto'.
function estadoDelIntervalo(colonias, metodo) {
  const m = METODOS[metodo];
  if (!m) return 'en';
  if (colonias < m.minimo) return 'bajo';
  if (colonias > m.maximo) return 'alto';
  return 'en';
}

// Calcula las UFC de cada placa y el promedio.
// entrada: { volumen: número, placas: [{ colonias: número|null, exponente: número }] }
// Las placas sin colonias capturadas (null) se ignoran.
function calcularPromedio(entrada) {
  const volumen = Number(entrada.volumen);
  if (!(volumen > 0)) {
    return { ok: false, error: 'Falta el volumen sembrado (mayor que 0).' };
  }

  const filas = [];
  entrada.placas.forEach(function (p, i) {
    if (p.colonias === null || p.colonias === undefined) return;
    const fd = factorDeDilucion(p.exponente);
    filas.push({
      placa: i + 1,
      colonias: p.colonias,
      exponente: p.exponente,
      fd: fd,
      ufc: (p.colonias * fd) / volumen,
    });
  });

  if (filas.length === 0) {
    return { ok: false, error: 'Capturar las colonias de al menos una placa.' };
  }

  // Si ninguna placa tiene colonias no hay un conteo: el resultado es
  // "menor que" 1 colonia en la dilución más baja (la de menor F.D).
  const todasEnCero = filas.every((f) => f.colonias === 0);
  if (todasEnCero) {
    const fdMinimo = Math.min.apply(null, filas.map((f) => f.fd));
    return {
      ok: true,
      filas: filas,
      estimado: true,
      promedio: fdMinimo / volumen,
    };
  }

  const suma = filas.reduce((total, f) => total + f.ufc, 0);
  return { ok: true, filas: filas, estimado: false, promedio: suma / filas.length };
}

// Escribe un número grande en notación científica (p. ej. 1.5 × 10^4).
// Devuelve { plano, html }.
function notacionCientifica(numero) {
  if (numero === 0) return { plano: '0', html: '0' };
  if (numero < 1000) {
    const t = String(Number(numero.toFixed(1)));
    return { plano: t, html: t };
  }
  const exp = Math.floor(Math.log10(numero));
  const mantisa = Number((numero / Math.pow(10, exp)).toFixed(2));
  return {
    plano: mantisa + ' × 10^' + exp,
    html: mantisa + ' × 10<sup>' + exp + '</sup>',
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    METODOS, factorDeDilucion, estadoDelIntervalo,
    calcularPromedio, evaluarLimite, notacionCientifica,
  };
}

// =====================================================================
// PARTE 2. PÁGINA
// =====================================================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', iniciarCalculadora);
}

function iniciarCalculadora() {
  const formulario = document.getElementById('calculadora-ufc');
  if (!formulario) return;

  const cuerpoPlacas = document.getElementById('calc-placas');
  const salida = document.getElementById('calc-resultado');
  const bloqueEvaluar = document.getElementById('calc-evaluar');
  const salidaVeredicto = document.getElementById('calc-veredicto');
  const botonGuardar = document.getElementById('calc-enviar');
  const estadoGuardado = document.getElementById('calc-estado');
  const campoNumero = formulario.elements.numero_placas;
  const selMetodo = formulario.elements.metodo;
  const selAlimento = formulario.elements.alimento;
  let ultimo = null; // { calculo, evaluacion } del último cálculo válido

  function crear(etiqueta, texto, clase) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined && texto !== null) el.textContent = texto;
    if (clase) el.className = clase;
    return el;
  }

  function unidad() {
    return formulario.elements.unidad.value; // 'g' o 'mL'
  }

  // --- Opciones de los desplegables (se arman desde los datos) ---------
  Object.keys(METODOS).forEach(function (clave) {
    const m = METODOS[clave];
    const o = crear('option', m.nombre + ' (' + m.minimo + '-' + m.maximo + ' colonias)');
    o.value = clave;
    selMetodo.appendChild(o);
  });
  Object.keys(ALIMENTOS).forEach(function (clave) {
    const o = crear('option', ALIMENTOS[clave].nombre);
    o.value = clave;
    selAlimento.appendChild(o);
  });

  // Si se llega desde una hoja de resultados, los datos vienen en la dirección
  // (calculadora-ufc.html?metodo=...&alimento=...&muestra=...).
  const parametros = new URLSearchParams(window.location.search);
  if (METODOS[parametros.get('metodo')]) selMetodo.value = parametros.get('metodo');
  if (ALIMENTOS[parametros.get('alimento')]) selAlimento.value = parametros.get('alimento');
  if (parametros.get('muestra')) formulario.elements.muestra.value = parametros.get('muestra');

  // --- Filas de placas -------------------------------------------------
  function crearFila(numero, exponente) {
    const fila = crear('tr', null, 'calc-placa-fila');
    fila.appendChild(crear('th', 'Placa ' + numero)).scope = 'row';

    const celdaColonias = crear('td');
    const colonias = crear('input', null, 'calc-colonias');
    colonias.type = 'number';
    colonias.min = '0';
    colonias.step = '1';
    colonias.setAttribute('aria-label', 'Colonias en la placa ' + numero);
    celdaColonias.appendChild(colonias);
    fila.appendChild(celdaColonias);

    const celdaDilucion = crear('td');
    const dilucion = crear('select', null, 'calc-exponente');
    dilucion.setAttribute('aria-label', 'Dilución de la placa ' + numero);
    for (let n = 1; n <= 8; n++) {
      const o = crear('option', '10⁻' + String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) +
        ' (F.D = ' + factorDeDilucion(n).toLocaleString('en-US') + ')');
      o.value = String(n);
      if (n === exponente) o.selected = true;
      dilucion.appendChild(o);
    }
    celdaDilucion.appendChild(dilucion);
    fila.appendChild(celdaDilucion);

    fila.appendChild(crear('td', '', 'calc-placa-estado'));
    return fila;
  }

  // Ajusta la cantidad de filas al número de placas, conservando lo ya capturado.
  function ajustarPlacas() {
    let n = parseInt(campoNumero.value, 10);
    if (!(n >= 1)) n = 0;
    if (n > 12) n = 12;
    while (cuerpoPlacas.children.length > n) cuerpoPlacas.lastElementChild.remove();
    while (cuerpoPlacas.children.length < n) {
      const i = cuerpoPlacas.children.length;
      // Valor inicial de la dilución: 10^-1; si hay filas, la de la fila anterior.
      const previa = i > 0 ? Number(cuerpoPlacas.children[i - 1].querySelector('.calc-exponente').value) : 1;
      cuerpoPlacas.appendChild(crearFila(i + 1, previa));
    }
  }

  function leerPlacas() {
    let invalido = false;
    const placas = Array.from(cuerpoPlacas.children).map(function (fila) {
      const campo = fila.querySelector('.calc-colonias');
      let colonias = null;
      if (campo.value.trim() !== '') {
        const n = Number(campo.value);
        if (Number.isInteger(n) && n >= 0) colonias = n;
        else invalido = true;
      }
      return { colonias: colonias, exponente: Number(fila.querySelector('.calc-exponente').value) };
    });
    return { placas: placas, invalido: invalido };
  }

  // --- Salidas ---------------------------------------------------------
  function vaciar(texto) {
    ultimo = null;
    botonGuardar.disabled = true;
    bloqueEvaluar.hidden = true;
    salida.replaceChildren(crear('p', texto, 'calc-vacio'));
  }

  const TEXTO_ESTADO = { bajo: 'Por debajo del intervalo', en: 'Dentro del intervalo', alto: 'Por arriba del intervalo' };

  function pintarResultado(calculo) {
    const u = unidad();
    const p = notacionCientifica(calculo.promedio);
    const final = crear('p', null, 'calc-final');
    final.innerHTML = (calculo.estimado ? '< ' : '') + p.html + ' UFC/' + u;
    salida.replaceChildren(final);

    salida.appendChild(crear('p',
      calculo.estimado
        ? 'Ninguna placa tiene colonias: el resultado se reporta como menor que 1 colonia en la dilución más baja (valor estimado).'
        : 'Promedio de ' + calculo.filas.length + (calculo.filas.length === 1 ? ' placa' : ' placas') +
          ' (UFC por placa = colonias × F.D ÷ volumen sembrado).',
      'calc-nota'));

    const tabla = crear('table');
    tabla.appendChild(crear('caption', 'Detalle por placa'));
    const cab = crear('tr');
    ['Placa', 'Colonias', 'Dilución', 'UFC/' + u].forEach(function (t) {
      const th = crear('th', t);
      th.scope = 'col';
      cab.appendChild(th);
    });
    tabla.appendChild(crear('thead')).appendChild(cab);
    const cuerpo = crear('tbody');
    calculo.filas.forEach(function (f) {
      const tr = crear('tr');
      tr.appendChild(crear('td', String(f.placa)));
      tr.appendChild(crear('td', String(f.colonias)));
      tr.appendChild(crear('td', '10⁻' + String(f.exponente).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])));
      tr.appendChild(crear('td', notacionCientifica(f.ufc).plano));
      cuerpo.appendChild(tr);
    });
    tabla.appendChild(cuerpo);
    salida.appendChild(tabla);
  }

  // Marca en cada fila si su conteo cae dentro del intervalo del método elegido.
  function pintarEstadoPlacas(placas) {
    Array.from(cuerpoPlacas.children).forEach(function (fila, i) {
      const celda = fila.querySelector('.calc-placa-estado');
      const p = placas[i];
      if (p.colonias === null) { celda.textContent = ''; celda.className = 'calc-placa-estado'; return; }
      const estado = estadoDelIntervalo(p.colonias, selMetodo.value);
      celda.textContent = TEXTO_ESTADO[estado];
      celda.className = 'calc-placa-estado' + (estado === 'en' ? '' : ' calc-placa-estado--aviso');
    });
  }

  function textoVeredicto(ev, calculo) {
    const alimento = ALIMENTOS[selAlimento.value].nombre;
    const metodo = METODOS[selMetodo.value].nombre;
    switch (ev.estado) {
      case 'cumple':
        return { clase: 'ok', titulo: 'CUMPLE', detalle: 'Límite del manual para ' + alimento + ' (' + metodo + '): ' + ev.limite + ' UFC/g.' };
      case 'no-cumple':
        return { clase: 'error', titulo: 'NO CUMPLE', detalle: 'Límite del manual para ' + alimento + ' (' + metodo + '): ' + ev.limite + ' UFC/g.' };
      case 'no-concluyente':
        return { clase: 'aviso', titulo: 'NO CONCLUYENTE', detalle: 'El valor estimado supera el límite (' + ev.limite + ' UFC/g); con otra dilución o mayor volumen sembrado podría verificarse.' };
      case 'no-aplica':
        return { clase: 'aviso', titulo: 'NO APLICA', detalle: 'El manual indica que este análisis no aplica para ' + alimento + '.' };
      default:
        return { clase: 'aviso', titulo: 'SIN LÍMITE EN EL MANUAL', detalle: 'El manual no establece un límite de ' + metodo.toLowerCase() + ' para ' + alimento + '.' };
    }
  }

  function recalcular() {
    estadoGuardado.textContent = '';
    estadoGuardado.className = 'hoja-estado';
    ajustarPlacas();

    if (cuerpoPlacas.children.length === 0) {
      vaciar('Indicar el número de placas (de 1 a 12).');
      return;
    }
    const lectura = leerPlacas();
    pintarEstadoPlacas(lectura.placas);
    if (lectura.invalido) {
      vaciar('Las colonias deben ser números enteros, 0 o mayores.');
      return;
    }
    const calculo = calcularPromedio({ volumen: formulario.elements.volumen.value, placas: lectura.placas });
    if (!calculo.ok) {
      vaciar(calculo.error);
      return;
    }

    pintarResultado(calculo);

    const ev = evaluarLimite(selMetodo.value, selAlimento.value, calculo.promedio, calculo.estimado);
    const t = textoVeredicto(ev, calculo);
    salidaVeredicto.className = 'calc-veredicto calc-veredicto--' + t.clase;
    salidaVeredicto.replaceChildren(crear('strong', t.titulo), crear('span', ' ' + t.detalle));
    // Los límites del manual están en UFC/g; con mL no se compara.
    if (unidad() === 'mL' && ev.limite) {
      salidaVeredicto.className = 'calc-veredicto calc-veredicto--aviso';
      salidaVeredicto.replaceChildren(crear('strong', 'SIN COMPARACIÓN'),
        crear('span', ' Los límites del manual están en UFC/g; la unidad elegida es mL.'));
    }
    bloqueEvaluar.hidden = false;
    ultimo = { calculo: calculo, evaluacion: ev, placas: lectura.placas, titulo: t.titulo };
    botonGuardar.disabled = false;
  }

  // La calculadora no guarda nada: manda el promedio a la hoja de resultados.
  function enviar() {
    if (!ultimo) return;
    function error(texto) {
      estadoGuardado.className = 'hoja-estado hoja-estado--error';
      estadoGuardado.textContent = texto;
    }
    const lote = formulario.elements.muestra.value.trim();
    const clave = METODOS[selMetodo.value].hoja;
    if (unidad() !== 'g') return error('La hoja de resultados usa UFC/g. Elegir «UFC/g» como unidad para enviar el resultado.');
    if (!clave) return error('Esta prueba no tiene fila en la hoja de resultados (el manual no da límite para ella).');
    if (!lote) return error('Falta el código o lote de la muestra: la hoja de resultados se organiza por lote.');

    const ok = enviarAHoja({
      alimento: selAlimento.value,
      lote: lote,
      prueba: clave,
      valor: ultimo.calculo.promedio,
      signo: ultimo.calculo.estimado ? '<' : '',
    });
    if (!ok) return error('No se pudo enviar: este navegador no permite el almacenamiento temporal.');
    window.location.href = 'hojas-resultados.html?alimento=' + encodeURIComponent(selAlimento.value) +
      '&muestra=' + encodeURIComponent(lote);
  }

  formulario.addEventListener('input', recalcular);
  formulario.addEventListener('change', recalcular);
  formulario.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
  formulario.addEventListener('reset', function () {
    // Espera a que el navegador vacíe los campos, quita las filas y recalcula.
    setTimeout(function () { cuerpoPlacas.replaceChildren(); recalcular(); }, 0);
  });

  recalcular();
}
