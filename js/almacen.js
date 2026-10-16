// js/almacen.js
// Guarda las hojas de verificación y los resultados de la calculadora
// ÚNICAMENTE en el navegador de quien usa el sitio (localStorage).
//
// Nada se envía a un servidor: los datos no salen del equipo y nadie
// más puede verlos. Si se quieren conservar o pasar a otro equipo, se
// descargan como archivo CSV desde la página "Mis registros".
//
// Cada registro guardado es un objeto con esta forma:
//   {
//     id:        número único,
//     tipo:      'hoja' (hoja de verificación) o 'ufc' (calculadora),
//     metodo:    'mesofilos-aerobios', 'mohos-levaduras', etc.,
//     codigo:    código de la hoja (PM001...), solo en las hojas,
//     muestra:   código o lote de la muestra,
//     datos:     objeto con todo lo capturado,
//     resultado: texto del resultado final,
//     creado_en: fecha y hora en formato ISO
//   }

const CLAVE_ALMACEN = 'manual-pruebas-registros';

const NOMBRES_METODO = {
  'mesofilos-aerobios': 'Bacterias aerobias mesófilas',
  'mohos-levaduras': 'Mohos y levaduras',
  'coliformes-placa': 'Coliformes totales en placa',
  's-aureus': 'Staphylococcus aureus',
};

// Textos legibles para los valores internos de las casillas de opción.
const ETIQUETAS_VALOR = {
  solida: 'Sólida',
  liquida: 'Líquida',
  congelada: 'Congelada',
  descongelada: 'Descongelada',
  cumple: 'CUMPLE',
  no_cumple: 'NO CUMPLE',
  ausente: 'Ausente en 25 g',
  presente: 'Presente en 25 g',
};

function etiquetaValor(valor) {
  return ETIQUETAS_VALOR[valor] || valor;
}

function nombreMetodo(slug) {
  return NOMBRES_METODO[slug] || slug;
}

// Lee todos los registros. Si no hay nada guardado, o el navegador
// no permite usar localStorage, devuelve una lista vacía.
function leerRegistros() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_ALMACEN));
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    return [];
  }
}

// Guarda un registro nuevo y lo devuelve (con su id y su fecha).
// Lanza un error si el navegador no deja guardar (por ejemplo en
// navegación privada, o con el almacenamiento lleno).
function guardarRegistro(registro) {
  const lista = leerRegistros();
  const ultimoId = lista.reduce((mayor, r) => Math.max(mayor, r.id), 0);
  const nuevo = Object.assign({}, registro, {
    id: ultimoId + 1,
    creado_en: new Date().toISOString(),
  });
  lista.push(nuevo);
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lista));
  return nuevo;
}

function borrarRegistro(id) {
  const lista = leerRegistros().filter((r) => r.id !== id);
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lista));
}

function borrarTodosLosRegistros() {
  localStorage.removeItem(CLAVE_ALMACEN);
  borrarEnvios();
}

// ---------------------------------------------------------------------
// Envío de un resultado de las calculadoras a la hoja de resultados
// ---------------------------------------------------------------------
// Las calculadoras NO guardan nada. Cuando se aprieta "Enviar a la hoja de
// resultados", el valor pasa a la hoja por medio de sessionStorage: una
// memoria temporal de esta pestaña que se borra al cerrarla. Lo que
// queda guardado de forma permanente es la hoja de resultados, y solo
// cuando se aprieta "Guardar hoja de resultados".
//
// Cada envío es: { alimento, lote, prueba, valor, signo }
//   prueba: 'mesofilos', 'hongos', 'coliformes' o 'coliformesnmp'
//   signo:  '' (valor contado), '<' o '>'

const CLAVE_ENVIOS = 'manual-pruebas-envios';

function normalizarLote(lote) {
  return String(lote || '').trim().toLowerCase();
}

function leerEnvios() {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CLAVE_ENVIOS));
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    return [];
  }
}

// Agrega un envío (si ya había uno de la misma prueba, mismo alimento y mismo
// lote, lo reemplaza). Devuelve true si se pudo.
function enviarAHoja(envio) {
  try {
    const lista = leerEnvios().filter(function (e) {
      return !(e.alimento === envio.alimento && normalizarLote(e.lote) === normalizarLote(envio.lote) && e.prueba === envio.prueba);
    });
    lista.push(envio);
    sessionStorage.setItem(CLAVE_ENVIOS, JSON.stringify(lista));
    return true;
  } catch (error) {
    return false;
  }
}

function borrarEnvios() {
  try { sessionStorage.removeItem(CLAVE_ENVIOS); } catch (error) { /* sin sessionStorage */ }
}

// ---------------------------------------------------------------------
// Descarga en CSV (se abre directo en Excel)
// ---------------------------------------------------------------------

// Un campo de CSV va entre comillas si trae comas, comillas o saltos
// de línea; las comillas internas se duplican.
function campoCSV(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n\r]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
}

function fechaLegible(iso) {
  const f = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  return f.getFullYear() + '-' + dos(f.getMonth() + 1) + '-' + dos(f.getDate()) +
    ' ' + dos(f.getHours()) + ':' + dos(f.getMinutes());
}

// Columnas del CSV de hojas de verificación: [encabezado, campo].
const COLUMNAS_HOJA = [
  ['Tipo de matriz alimentaria', 'tipo_matriz'],
  ['Código o lote de muestra', 'codigo_lote_muestra'],
  ['Condición (sólida/líquida)', 'condicion_fisica'],
  ['Condición (congelada/descongelada)', 'condicion_congelacion'],
  ['Temperatura de recepción (ºC)', 'temperatura_recepcion'],
  ['Fecha de recepción', 'fecha_recepcion'],
  ['Hora de recepción', 'hora_recepcion'],
  ['Observaciones de la muestra', 'observaciones_muestra'],
  ['Medio de cultivo', 'medio_cultivo'],
  ['Incubación (ºC)', 'temperatura_incubacion'],
  ['Incubación (h)', 'horas_incubacion'],
  ['Dilución (g/mL)', 'dilucion'],
  ['Volumen sembrado (mL)', 'volumen_sembrado'],
  ['Recuento de colonias', 'recuento_colonias'],
  ['Resultado final (UFC/g)', 'resultado_final'],
  ['Límite máximo', 'limite_maximo'],
  ['Interpretación', 'interpretacion'],
  ['Observaciones de la interpretación', 'observaciones_interpretacion'],
];

// Convierte una lista de registros en el texto de un archivo CSV.
function registrosACSV(tipo, registros) {
  let encabezados;
  let filas;

  if (tipo === 'hoja') {
    encabezados = ['Fecha de guardado', 'Hoja', 'Método'].concat(COLUMNAS_HOJA.map((c) => c[0]));
    filas = registros.map((r) =>
      [fechaLegible(r.creado_en), r.codigo, nombreMetodo(r.metodo)]
        .concat(COLUMNAS_HOJA.map((c) => etiquetaValor(r.datos[c[1]])))
    );
  } else if (tipo === 'resultados') {
    encabezados = ['Fecha de guardado', 'Código o lote', 'Matriz alimentaria', 'Fecha del análisis',
      'Prueba', 'Resultado', 'Unidad', 'Límite del manual', 'Veredicto', 'Dictamen de la matriz', 'Observaciones'];
    filas = [];
    registros.forEach((r) => {
      const d = r.datos || {};
      (d.pruebas || []).forEach((p) => {
        const valor = p.valor === null ? '' : (p.clave === 'salmonella' ? etiquetaValor(p.valor) : (p.signo ? p.signo + ' ' : '') + p.valor);
        filas.push([fechaLegible(r.creado_en), r.muestra, d.alimento, d.fecha, p.nombre, valor,
          p.unidad, p.limite, p.veredicto, d.dictamen, d.observaciones]);
      });
    });
  }

  return [encabezados].concat(filas)
    .map((fila) => fila.map(campoCSV).join(','))
    .join('\r\n');
}

// Descarga un archivo de texto. El "﻿" del inicio hace que Excel
// reconozca los acentos y la ñ correctamente.
function descargarArchivo(nombre, texto) {
  const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(enlace.href);
}
