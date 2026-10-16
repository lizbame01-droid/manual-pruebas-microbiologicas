// js/calculadora-nmp.js
// Calculadora del Número Más Probable (NMP) para alimentos, en NMP/g.
// Se basa en la NOM-210-SSA1-2014, Apéndice H (H.8): se cuentan los tubos
// positivos en tres diluciones consecutivas y el patrón (por ejemplo 3-2-1)
// se busca en las tablas de NMP (js/tablas-nmp.js).
//
// Pasos que sigue la calculadora:
//   1. Si hay más de tres diluciones, elige las tres consecutivas según
//      H.8.5.3 de la norma.
//   2. Busca el patrón en la tabla (3 tubos: Tabla 5 con intervalo de
//      confianza y, si falta, Tabla 1; 5 tubos: Tabla 2).
//   3. Ajusta el valor si la mayor cantidad de muestra no es 0.1 g
//      (H.8.1 y H.8.2: valor de la tabla × 0.1 ÷ cantidad mayor).
//   4. Compara el resultado con el límite del manual.
//
// PARTE 1: lógica (se prueba con Node). PARTE 2: la página.

var Lim = (typeof module !== 'undefined') ? require('./limites.js') : LIMITES;
var TablasNMP = (typeof module !== 'undefined') ? require('./tablas-nmp.js')
  : { TABLA_3_TUBOS_IC: TABLA_3_TUBOS_IC, TABLA_3_TUBOS: TABLA_3_TUBOS, TABLA_5_TUBOS: TABLA_5_TUBOS };

// =====================================================================
// PARTE 1. LÓGICA
// =====================================================================

// Cantidades de muestra por tubo que se ofrecen en pantalla (g).
const CANTIDADES_NMP = [1, 0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001];

// Pruebas que se pueden calcular y la clave de límite que les corresponde.
// (E. coli no tiene límite en las tablas del manual.)
const PRUEBAS_NMP = {
  'nmp-coliformes': { nombre: 'Coliformes totales por NMP', limite: 'coliformes', hoja: 'coliformesnmp' },
  'nmp-ecoli':      { nombre: 'E. coli por NMP',            limite: null, hoja: null },
};

// Elige las tres diluciones consecutivas (norma H.8.5.3).
// filas: [{ cantidad, positivos }] de la mayor a la menor cantidad de muestra.
// Devuelve { indices: [i, i+1, i+2], positivos: [a, b, c], sumado }.
function seleccionarDiluciones(filas, tubos) {
  const n = filas.length;
  const pos = filas.map((f) => f.positivos);

  let inicio;
  const todosPositivos = [];
  pos.forEach((p, i) => { if (p === tubos) todosPositivos.push(i); });

  if (todosPositivos.length > 0) {
    // La dilución mayor con todos los tubos positivos y las dos siguientes;
    // si no alcanzan, las tres últimas (caso de todos los tubos positivos).
    inicio = Math.min(todosPositivos[todosPositivos.length - 1], n - 3);
  } else {
    // Primeras tres consecutivas con positivos en la dilución del medio.
    inicio = -1;
    for (let s = 0; s + 2 < n; s++) {
      if (pos[s + 1] > 0) { inicio = s; break; }
    }
    if (inicio === -1) {
      const primero = pos.findIndex((p) => p > 0);
      inicio = primero === -1 ? 0 : Math.min(Math.max(primero - 1, 0), n - 3);
    }
  }

  const indices = [inicio, inicio + 1, inicio + 2];
  const positivos = indices.map((i) => pos[i]);

  // Un positivo en la dilución más alta no seleccionada se suma a la
  // última seleccionada.
  let sumado = false;
  const ultimoSel = indices[2];
  if (ultimoSel < n - 1 && pos[n - 1] > 0) {
    positivos[2] = Math.min(tubos, positivos[2] + pos[n - 1]);
    sumado = true;
  }
  return { indices: indices, positivos: positivos, sumado: sumado };
}

// Calcula el NMP/g.
// entrada: { tubos: 3 | 5, filas: [{ cantidad, positivos }] }
function calcularNMP(entrada) {
  const tubos = Number(entrada.tubos);
  if (tubos !== 3 && tubos !== 5) return { ok: false, error: 'El número de tubos debe ser 3 o 5.' };
  const filas = entrada.filas;
  if (filas.length < 3) return { ok: false, error: 'Se necesitan al menos tres diluciones.' };

  for (let i = 0; i < filas.length; i++) {
    const p = filas[i].positivos;
    if (p === null || p === undefined) {
      return { ok: false, error: 'Capturar los tubos positivos de cada dilución (0 si no hubo).' };
    }
    if (!Number.isInteger(p) || p < 0 || p > tubos) {
      return { ok: false, error: 'Los tubos positivos deben ser un entero entre 0 y ' + tubos + '.' };
    }
    if (i > 0) {
      const razon = filas[i - 1].cantidad / filas[i].cantidad;
      if (Math.abs(razon - 10) > 1e-6) {
        return { ok: false, error: 'Las cantidades de muestra deben bajar de 10 en 10 (cada dilución es la décima parte de la anterior).' };
      }
    }
  }

  const sel = seleccionarDiluciones(filas, tubos);
  const patron = sel.positivos.join('-');
  const cantidadMayor = filas[sel.indices[0]].cantidad;

  let fila;
  let fuente;
  if (tubos === 3) {
    fila = TablasNMP.TABLA_3_TUBOS_IC[patron];
    fuente = 'Tabla 5 de la NOM-210 (3 tubos, con intervalo de confianza del 95 %)';
    if (!fila) {
      fila = TablasNMP.TABLA_3_TUBOS[patron];
      fuente = 'Tabla 1 de la NOM-210 (3 tubos; esta tabla no trae intervalo de confianza)';
    }
  } else {
    fila = TablasNMP.TABLA_5_TUBOS[patron];
    fuente = 'Tabla 2 de la NOM-210 (5 tubos; esta tabla no trae intervalo de confianza)';
  }
  if (!fila) return { ok: false, error: 'El patrón ' + patron + ' no está en las tablas de la norma. Repetir la prueba.' };

  const escala = Number((0.1 / cantidadMayor).toPrecision(12));
  const escalar = (v) => (v === null ? null : Number((v * escala).toPrecision(12)));

  return {
    ok: true,
    tubos: tubos,
    seleccion: sel,
    patron: patron,
    cantidadMayor: cantidadMayor,
    escala: escala,
    nmp: escalar(fila[0]),
    inferior: escalar(fila[1]),
    superior: escalar(fila[2]),
    signo: fila[3], // '<', '>' o ''
    fuente: fuente,
  };
}

// Escribe el NMP con separador de miles y 3 cifras significativas.
function formatoNMP(valor) {
  return valor.toLocaleString('en-US', { maximumSignificantDigits: 3 });
}

function textoNMP(resultado) {
  return (resultado.signo ? resultado.signo + ' ' : '') + formatoNMP(resultado.nmp) + ' NMP/g';
}

// Compara el resultado con el límite del manual. Con ">" no se puede
// afirmar que cumple (el valor real es mayor que el de la tabla).
function evaluarNMP(clavePrueba, alimento, resultado) {
  const p = PRUEBAS_NMP[clavePrueba];
  const ev = Lim.evaluarLimite(p ? p.limite : null, alimento, resultado.nmp, resultado.signo === '<');
  if (resultado.signo === '>' && ev.estado === 'cumple') ev.estado = 'no-concluyente';
  return ev;
}

if (typeof module !== 'undefined') {
  module.exports = { CANTIDADES_NMP, PRUEBAS_NMP, seleccionarDiluciones, calcularNMP, formatoNMP, textoNMP, evaluarNMP };
}

// =====================================================================
// PARTE 2. PÁGINA
// =====================================================================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', iniciarCalculadoraNMP);
}

function iniciarCalculadoraNMP() {
  const formulario = document.getElementById('calculadora-nmp');
  if (!formulario) return;

  const cuerpo = document.getElementById('nmp-filas');
  const salida = document.getElementById('nmp-resultado');
  const bloqueEvaluar = document.getElementById('nmp-evaluar');
  const veredicto = document.getElementById('nmp-veredicto');
  const botonGuardar = document.getElementById('nmp-enviar');
  const estadoGuardado = document.getElementById('nmp-estado');
  const selPrueba = formulario.elements.prueba;
  const selAlimento = formulario.elements.alimento;
  let ultimo = null;

  function crear(etiqueta, texto, clase) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined && texto !== null) el.textContent = texto;
    if (clase) el.className = clase;
    return el;
  }

  Object.keys(PRUEBAS_NMP).forEach(function (k) {
    const o = crear('option', PRUEBAS_NMP[k].nombre);
    o.value = k;
    selPrueba.appendChild(o);
  });
  Object.keys(Lim.ALIMENTOS).forEach(function (k) {
    const o = crear('option', Lim.ALIMENTOS[k].nombre);
    o.value = k;
    selAlimento.appendChild(o);
  });

  // Datos que llegan desde una hoja de resultados.
  const parametros = new URLSearchParams(window.location.search);
  if (PRUEBAS_NMP[parametros.get('metodo')]) selPrueba.value = parametros.get('metodo');
  if (Lim.ALIMENTOS[parametros.get('alimento')]) selAlimento.value = parametros.get('alimento');
  if (parametros.get('muestra')) formulario.elements.muestra.value = parametros.get('muestra');

  function etiquetaCantidad(c) {
    return c.toLocaleString('en-US', { maximumFractionDigits: 6 }) + ' g';
  }

  function crearFila(cantidadInicial, n) {
    const fila = crear('tr', null, 'nmp-fila');
    const th = crear('th', 'Dilución ' + n);
    th.scope = 'row';
    fila.appendChild(th);

    const celdaCantidad = crear('td');
    const sel = crear('select', null, 'nmp-cantidad');
    sel.setAttribute('aria-label', 'Cantidad de muestra por tubo, dilución ' + n);
    CANTIDADES_NMP.forEach(function (c) {
      const o = crear('option', etiquetaCantidad(c));
      o.value = String(c);
      if (c === cantidadInicial) o.selected = true;
      sel.appendChild(o);
    });
    celdaCantidad.appendChild(sel);
    fila.appendChild(celdaCantidad);

    const celdaPos = crear('td');
    const inp = crear('input', null, 'nmp-positivos');
    inp.type = 'number';
    inp.min = '0';
    inp.step = '1';
    inp.setAttribute('aria-label', 'Tubos positivos, dilución ' + n);
    celdaPos.appendChild(inp);
    fila.appendChild(celdaPos);

    fila.appendChild(crear('td', '', 'nmp-fila-nota'));
    return fila;
  }

  function reiniciarFilas() {
    cuerpo.replaceChildren(crearFila(0.1, 1), crearFila(0.01, 2), crearFila(0.001, 3));
  }

  function leerFilas() {
    return Array.from(cuerpo.children).map(function (tr) {
      const campo = tr.querySelector('.nmp-positivos');
      return {
        cantidad: Number(tr.querySelector('.nmp-cantidad').value),
        positivos: campo.value.trim() === '' ? null : Number(campo.value),
      };
    });
  }

  function vaciar(texto) {
    ultimo = null;
    botonGuardar.disabled = true;
    bloqueEvaluar.hidden = true;
    salida.replaceChildren(crear('p', texto, 'calc-vacio'));
    cuerpo.querySelectorAll('.nmp-fila-nota').forEach((c) => { c.textContent = ''; });
  }

  function marcarSeleccion(r) {
    cuerpo.querySelectorAll('.nmp-fila-nota').forEach(function (celda, i) {
      const k = r.seleccion.indices.indexOf(i);
      celda.textContent = k >= 0
        ? 'Usada (' + r.seleccion.positivos[k] + (k === 2 && r.seleccion.sumado ? ', con la dilución siguiente sumada' : '') + ')'
        : (i === cuerpo.children.length - 1 && r.seleccion.sumado ? 'Sumada a la última usada' : 'No usada');
    });
  }

  function textoVeredicto(ev, prueba, alimento) {
    const nombre = Lim.ALIMENTOS[alimento].nombre;
    const detalle = 'Límite del manual para ' + nombre + ': ' + ev.limite + ' UFC/g (se compara el NMP/g con el mismo valor).';
    switch (ev.estado) {
      case 'cumple': return { clase: 'ok', titulo: 'CUMPLE', detalle: detalle };
      case 'no-cumple': return { clase: 'error', titulo: 'NO CUMPLE', detalle: detalle };
      case 'no-concluyente': return { clase: 'aviso', titulo: 'NO CONCLUYENTE', detalle: 'El resultado es un tope (< o >) y no permite afirmar el cumplimiento frente al límite (' + ev.limite + ').' };
      case 'no-aplica': return { clase: 'aviso', titulo: 'NO APLICA', detalle: 'El manual indica que este análisis no aplica para ' + nombre + '.' };
      default: return { clase: 'aviso', titulo: 'SIN LÍMITE EN EL MANUAL', detalle: 'El manual no establece un límite de ' + PRUEBAS_NMP[prueba].nombre.toLowerCase() + ' para ' + nombre + '.' };
    }
  }

  function recalcular() {
    estadoGuardado.textContent = '';
    estadoGuardado.className = 'hoja-estado';
    const r = calcularNMP({ tubos: formulario.elements.tubos.value, filas: leerFilas() });
    if (!r.ok) { vaciar(r.error); return; }

    marcarSeleccion(r);
    const final = crear('p', textoNMP(r), 'calc-final');
    salida.replaceChildren(final);
    salida.appendChild(crear('p', 'Patrón de tubos positivos: ' + r.patron +
      ' (porciones de ' + etiquetaCantidad(r.cantidadMayor) + ' y sus diluciones).', 'calc-nota'));
    if (r.inferior !== null || r.superior !== null) {
      salida.appendChild(crear('p', 'Intervalo de confianza del 95 %: ' +
        (r.inferior === null ? '—' : formatoNMP(r.inferior)) + ' a ' +
        (r.superior === null ? '—' : formatoNMP(r.superior)) + ' NMP/g.', 'calc-nota'));
    }
    if (r.escala !== 1) {
      salida.appendChild(crear('p', 'El valor de la tabla se multiplicó por ' + formatoNMP(r.escala) +
        ' porque la mayor cantidad de muestra usada es ' + etiquetaCantidad(r.cantidadMayor) + ' (tablas para 0.1 g).', 'calc-nota'));
    }
    salida.appendChild(crear('p', 'Fuente: ' + r.fuente + '.', 'calc-nota'));

    const ev = evaluarNMP(selPrueba.value, selAlimento.value, r);
    const t = textoVeredicto(ev, selPrueba.value, selAlimento.value);
    veredicto.className = 'calc-veredicto calc-veredicto--' + t.clase;
    veredicto.replaceChildren(crear('strong', t.titulo), crear('span', ' ' + t.detalle));
    bloqueEvaluar.hidden = false;
    ultimo = { r: r, ev: ev, titulo: t.titulo };
    botonGuardar.disabled = false;
  }

  // La calculadora no guarda nada: manda el resultado a la hoja de resultados.
  function enviar() {
    if (!ultimo) return;
    function error(texto) {
      estadoGuardado.className = 'hoja-estado hoja-estado--error';
      estadoGuardado.textContent = texto;
    }
    const lote = formulario.elements.muestra.value.trim();
    const clave = PRUEBAS_NMP[selPrueba.value].hoja;
    if (!clave) return error('Esta prueba no tiene fila en la hoja de resultados (el manual no da límite para ella).');
    if (!lote) return error('Falta el código o lote de la muestra: la hoja de resultados se organiza por lote.');

    const ok = enviarAHoja({
      alimento: selAlimento.value,
      lote: lote,
      prueba: clave,
      valor: ultimo.r.nmp,
      signo: ultimo.r.signo,
    });
    if (!ok) return error('No se pudo enviar: este navegador no permite el almacenamiento temporal.');
    window.location.href = 'hojas-resultados.html?alimento=' + encodeURIComponent(selAlimento.value) +
      '&muestra=' + encodeURIComponent(lote);
  }

  document.getElementById('nmp-agregar').addEventListener('click', function () {
    const n = cuerpo.children.length;
    if (n >= 6) return;
    const previa = Number(cuerpo.children[n - 1].querySelector('.nmp-cantidad').value);
    cuerpo.appendChild(crearFila(previa / 10, n + 1));
    recalcular();
  });
  document.getElementById('nmp-quitar').addEventListener('click', function () {
    if (cuerpo.children.length <= 3) return;
    cuerpo.lastElementChild.remove();
    recalcular();
  });

  // Al cambiar la cantidad de una dilución, las siguientes se reajustan
  // para seguir bajando de 10 en 10.
  cuerpo.addEventListener('change', function (e) {
    if (!e.target.classList.contains('nmp-cantidad')) return;
    const filas = Array.from(cuerpo.children);
    const i = filas.indexOf(e.target.closest('tr'));
    let c = Number(e.target.value);
    for (let j = i + 1; j < filas.length; j++) {
      c = Number((c / 10).toPrecision(6));
      const sel = filas[j].querySelector('.nmp-cantidad');
      if (CANTIDADES_NMP.indexOf(c) === -1) { c = CANTIDADES_NMP[CANTIDADES_NMP.length - 1]; }
      sel.value = String(c);
    }
  });

  formulario.addEventListener('input', recalcular);
  formulario.addEventListener('change', recalcular);
  formulario.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
  formulario.addEventListener('reset', function () {
    setTimeout(function () { reiniciarFilas(); recalcular(); }, 0);
  });

  reiniciarFilas();
  recalcular();
}
