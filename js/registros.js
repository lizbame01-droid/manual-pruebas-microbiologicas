// js/registros.js
// Página "Mis registros": muestra lo que se guardó en este navegador
// (ver js/almacen.js, que hay que cargar antes que este archivo),
// permite descargarlo en CSV y borrarlo.
//
// Nota: lo que se escribe en las hojas lo captura una persona, así que
// nunca se inserta como HTML; siempre se usa textContent, para que un
// texto como "<b>" se muestre tal cual y no se interprete como código.

function crear(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined && texto !== null) el.textContent = texto;
  if (clase) el.className = clase;
  return el;
}

// Arma una tabla. "columnas" es una lista de [encabezado, función que
// recibe un registro y devuelve el texto de la celda].
function armarTabla(registros, columnas, alBorrar) {
  const tabla = crear('table');
  const encabezado = crear('tr');
  columnas.forEach((c) => {
    const th = crear('th', c[0]);
    th.scope = 'col';
    encabezado.appendChild(th);
  });
  const thAccion = crear('th', 'Acción');
  thAccion.scope = 'col';
  encabezado.appendChild(thAccion);
  tabla.appendChild(crear('thead')).appendChild(encabezado);

  const cuerpo = crear('tbody');
  // Los más recientes primero.
  registros.slice().reverse().forEach((r) => {
    const fila = crear('tr');
    columnas.forEach((c) => fila.appendChild(crear('td', c[1](r))));
    const celda = crear('td');
    const boton = crear('button', 'Borrar', 'btn btn--secundario btn--chico');
    boton.type = 'button';
    boton.addEventListener('click', () => alBorrar(r.id));
    celda.appendChild(boton);
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
  });
  tabla.appendChild(cuerpo);
  return tabla;
}

function pintarSeccion(contenedor, tipo, columnas, nombreArchivo, textoVacio) {
  contenedor.replaceChildren();
  const registros = leerRegistros().filter((r) => r.tipo === tipo);

  if (registros.length === 0) {
    contenedor.appendChild(crear('p', textoVacio, 'calc-vacio'));
    return;
  }

  const barra = crear('div', null, 'hoja-botones');
  const descargar = crear('button', 'Descargar CSV (' + registros.length + ')', 'btn');
  descargar.type = 'button';
  descargar.addEventListener('click', () => {
    descargarArchivo(nombreArchivo, registrosACSV(tipo, registros));
  });
  barra.appendChild(descargar);
  contenedor.appendChild(barra);

  contenedor.appendChild(
    armarTabla(registros, columnas, (id) => {
      borrarRegistro(id);
      pintarTodo();
    })
  );
}

function pintarTodo() {
  pintarSeccion(
    document.getElementById('registros-hoja'),
    'hoja',
    [
      ['Fecha', (r) => fechaLegible(r.creado_en)],
      ['Hoja', (r) => r.codigo],
      ['Método', (r) => nombreMetodo(r.metodo)],
      ['Muestra', (r) => r.muestra],
      ['Resultado final (UFC/g)', (r) => r.datos.resultado_final || '—'],
      ['Interpretación', (r) => etiquetaValor(r.datos.interpretacion) || '—'],
    ],
    'hojas-de-verificacion.csv',
    'No hay hojas de verificación guardadas.'
  );

  pintarSeccion(
    document.getElementById('registros-resultados'),
    'resultados',
    [
      ['Fecha', (r) => fechaLegible(r.creado_en)],
      ['Código o lote', (r) => r.muestra],
      ['Matriz alimentaria', (r) => r.datos.alimento],
      ['Pruebas con resultado', (r) => String((r.datos.pruebas || []).filter((p) => p.valor !== null).length)],
      ['Dictamen', (r) => r.datos.dictamen],
    ],
    'hojas-de-resultados.csv',
    'No hay hojas de resultados guardadas.'
  );
}

document.addEventListener('DOMContentLoaded', function () {
  pintarTodo();

  document.getElementById('borrar-todo').addEventListener('click', function () {
    if (leerRegistros().length === 0) return;
    if (window.confirm('¿Borrar todos los registros guardados en este navegador? Esta acción no se puede deshacer.')) {
      borrarTodosLosRegistros();
      pintarTodo();
    }
  });
});
