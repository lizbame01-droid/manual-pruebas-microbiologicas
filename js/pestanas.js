/* =============================================================
   PESTAÑAS (TABS)
   =============================================================
   Este es el primer script del sitio. Antes de esto, todo el
   comportamiento interactivo (mostrar/ocultar el menú lateral) lo
   hacía el propio navegador gracias a <details>/<summary>. Las
   pestañas no tienen una etiqueta HTML lista para usar, así que
   necesitamos JavaScript para escuchar los clics y decidir qué
   panel mostrar. El CSS correspondiente está en la sección 12 de
   styles.css.

   Conceptos nuevos de JavaScript usados aquí:

   - document.querySelectorAll('selector') busca en toda la página
     y devuelve TODOS los elementos que coinciden con un selector
     CSS (el mismo tipo de selector que usas en styles.css: .clase,
     #id, etc). Devuelve una lista, así que para repetir una acción
     con cada elemento de la lista usamos .forEach(function...).

   - elemento.addEventListener('click', función) le dice al
     navegador: "cuando hagan clic en este elemento, ejecuta esta
     función". A esa función se le llama "manejador de evento"
     (event handler), y se ejecuta cada vez que ocurre el clic, no
     solo una vez.

   - elemento.dataset.pestana lee el valor del atributo
     data-pestana="..." que le pusimos a cada botón en el HTML.
     Los atributos que empiezan con data- sirven para guardar
     información personalizada en una etiqueta, sin inventar
     atributos que HTML no reconoce.

   - elemento.classList.add('clase') y .remove('clase') agregan o
     quitan una clase CSS de un elemento, igual que si editaras a
     mano el atributo class="..." en el HTML. Aquí se usan para
     prender y apagar la clase que hace visible a cada botón y cada
     panel (pestana-boton--activo y pestana-panel--activo).

   - elemento.classList.contains('clase') pregunta si un elemento
     YA tiene esa clase puesta, y devuelve true o false. Aquí se usa
     para saber si el botón en el que se acaba de hacer clic ya
     estaba activo ANTES del clic, y así decidir si hay que abrir su
     panel o, si ya estaba abierto, volver a cerrarlo (replegarlo).

   - grupo.querySelector('.clase') es como querySelectorAll, pero
     devuelve solo el PRIMER elemento que coincide (o null si no hay
     ninguno). Aquí se usa para buscar el panel "por defecto" de un
     grupo (por ejemplo, "Definición" en las páginas de método): si
     ese panel no existe (como en las páginas de alimento),
     panelPredeterminado queda en null y el código simplemente no
     hace nada con él, sin dar error.
   ============================================================= */

function iniciarPestanas() {
  // Un grupo de pestañas es un <div class="pestanas"> que contiene
  // su propia barra de botones (.pestanas-nav) y sus propios
  // paneles (.pestana-panel). Puede haber más de un grupo en la
  // misma página, por eso recorremos todos los grupos encontrados.
  const gruposDePestanas = document.querySelectorAll('.pestanas');

  gruposDePestanas.forEach(function (grupo) {
    const botones = grupo.querySelectorAll('.pestana-boton');
    const paneles = grupo.querySelectorAll('.pestana-panel');

    // Panel que se muestra cuando NINGÚN botón está activo (por
    // ejemplo, "Definición" en las páginas de método). En las
    // páginas de alimento no existe ningún panel con esta clase, así
    // que panelPredeterminado simplemente queda en null.
    const panelPredeterminado = grupo.querySelector('.pestana-panel--predeterminado');

    botones.forEach(function (boton) {
      boton.addEventListener('click', function () {
        // Antes de cambiar nada, guardamos si ESTE botón ya estaba
        // activo (es decir, si su información ya estaba desplegada
        // antes de este clic).
        const yaEstabaActivo = boton.classList.contains('pestana-boton--activo');

        // El nombre de la pestaña que corresponde a este botón viene
        // del atributo data-pestana, por ejemplo data-pestana="microflora".
        const nombrePestana = boton.dataset.pestana;
        const panelDeEsteBoton = grupo.querySelector('#pestana-' + nombrePestana);

        // 1) Sin importar qué botón se haya tocado, primero apagamos
        //    TODOS los botones y ocultamos TODOS los paneles de este
        //    grupo (incluido el predeterminado, si existe). Así
        //    partimos siempre del mismo estado: todo replegado.
        botones.forEach(function (b) {
          b.classList.remove('pestana-boton--activo');
        });
        paneles.forEach(function (panel) {
          panel.classList.remove('pestana-panel--activo');
        });

        // 2) Si el botón NO estaba activo, lo prendemos junto con su
        //    panel (se despliega la información). Si YA estaba
        //    activo, lo apagamos: en las páginas de alimento no
        //    vuelve a mostrarse nada, y en las páginas de método
        //    reaparece "Definición" (el panel predeterminado), si
        //    es que este grupo tiene uno.
        if (!yaEstabaActivo) {
          boton.classList.add('pestana-boton--activo');
          panelDeEsteBoton.classList.add('pestana-panel--activo');
        } else if (panelPredeterminado) {
          panelPredeterminado.classList.add('pestana-panel--activo');
        }
      });
    });
  });
}

// Esperamos a que el HTML esté completamente cargado antes de
// buscar los botones y paneles. Si el script se ejecutara antes de
// tiempo, document.querySelectorAll no encontraría nada todavía.
document.addEventListener('DOMContentLoaded', iniciarPestanas);
