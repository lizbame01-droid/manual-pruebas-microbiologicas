// js/hojas.js
// Guarda las hojas de verificación llenadas en pantalla.
// Usa js/almacen.js, que las guarda solo en este navegador (nada se
// envía a ningún servidor). Hay que cargar almacen.js antes que este
// archivo.
//
// Cómo funciona, en pocas palabras:
//   1. Cuando se aprieta "Guardar hoja", el navegador normalmente
//      recargaría la página; aquí se evita con preventDefault().
//   2. Se leen todos los campos de esa hoja y se arma un objeto.
//   3. Se guarda con guardarRegistro() (de almacen.js).
//   4. Se muestra debajo de los botones si salió bien o mal.

function mostrarEstado(elemento, texto, esError) {
  elemento.textContent = texto;
  elemento.classList.toggle('hoja-estado--error', esError);
  elemento.classList.toggle('hoja-estado--ok', !esError);
}

function guardarHoja(formulario) {
  const estado = formulario.querySelector('.hoja-estado');

  // Sin código o lote la hoja no se puede identificar después.
  const campoLote = formulario.querySelector('[name="codigo_lote_muestra"]');
  if (!campoLote.value.trim()) {
    mostrarEstado(estado, 'Falta el código o lote de la muestra.', true);
    campoLote.focus();
    return;
  }

  // FormData junta todos los campos con "name" del formulario.
  // Object.fromEntries lo convierte en un objeto normal de JavaScript.
  const datos = Object.fromEntries(new FormData(formulario).entries());

  try {
    const guardada = guardarRegistro({
      tipo: 'hoja',
      metodo: formulario.dataset.metodo,
      codigo: formulario.dataset.codigo,
      muestra: datos.codigo_lote_muestra,
      datos: datos,
      resultado: datos.resultado_final || null,
    });
    mostrarEstado(
      estado,
      'Hoja guardada en este dispositivo (registro n.º ' + guardada.id + ').',
      false
    );
  } catch (error) {
    // Pasa, por ejemplo, en navegación privada o con el almacenamiento lleno.
    mostrarEstado(
      estado,
      'No se pudo guardar en este navegador. Se puede imprimir la hoja para conservarla.',
      true
    );
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.hoja-form').forEach(function (formulario) {
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      guardarHoja(formulario);
    });

    // Al limpiar la hoja también se borra el mensaje anterior.
    formulario.addEventListener('reset', function () {
      const estado = formulario.querySelector('.hoja-estado');
      estado.textContent = '';
      estado.classList.remove('hoja-estado--ok', 'hoja-estado--error');
    });
  });
});
