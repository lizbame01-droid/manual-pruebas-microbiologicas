// js/diagramas-datos.js
// Datos de los diagramas de flujo de la pestaña "Proceso" de cada método.
// El dibujo y la animación los hace js/diagrama-flujo.js; aquí solo se
// describe cada diagrama.
//
// Formato de un diagrama:
//   titulo    texto que se muestra arriba del diagrama
//   columnas  cuántas columnas tiene la cuadrícula (1 si es una sola línea)
//   nodos     lista de cuadros. Cada uno tiene:
//               id     nombre corto único
//               tipo   'terminal' (inicio/fin, ovalado), 'proceso' (rectángulo)
//                      o 'decision' (rombo, pregunta de sí/no)
//               texto  lo que dice el cuadro (\n = salto de línea)
//               col, fila   su lugar en la cuadrícula (empiezan en 1)
//               alinear     'izq' si el texto va alineado a la izquierda
//   aristas   flechas: [desde, hasta] o [desde, hasta, 'etiqueta'].
//             La flecha aparece junto con el cuadro al que llega.
//   pasos     orden en que aparecen los cuadros: una lista por paso, con
//             los id de los cuadros que aparecen en ese paso. Si se omite,
//             cada cuadro es un paso, en el orden de la lista de nodos.
//
//   ancho     (opcional) ancho de cada columna/cuadro en em (16 por omisión)
//   span      (en un nodo) cuántas columnas ocupa, para centrarlo entre varias
//   Cada flecha puede llevar al final {desde:'der', hasta:'arriba'} para
//   indicar por qué lado sale y entra ('arriba','abajo','izq','der').
//   Si no se escribe "pasos", cada fila de la cuadrícula es un paso (los
//   cuadros de una misma fila aparecen juntos); "pasoPorNodo: true" hace un
//   paso por cuadro.
//
// Los textos se transcribieron de los diagramas de la tesis (Figs. 3-7 y los
// diagramas de S. aureus y NMP). Las etiquetas "A: 40" / "P: 40" de los
// originales no se incluyen.

// Atajos para escribir los diagramas más corto.
const T = (id, texto, col, fila, x) => Object.assign({ id, tipo: 'terminal', texto, col, fila }, x);
const P = (id, texto, col, fila, x) => Object.assign({ id, tipo: 'proceso', texto, col, fila }, x);
const D = (id, texto, col, fila, x) => Object.assign({ id, tipo: 'decision', texto, col, fila }, x);
// Flecha: E('a','b') | E('a','b','sí') | con lados: E('a','b','sí','der','arriba')
const E = (de, a, etiqueta, desde, hasta) =>
  (desde || hasta) ? [de, a, etiqueta || '', { desde, hasta }] : (etiqueta ? [de, a, etiqueta] : [de, a]);
const MEZCLA = 'Mezclar el inóculo:\n6 movimientos:\n-derecha a izquierda\n-sentido manecillas del reloj\n-contrario de las manecillas\n-atrás y adelante';



const DIAGRAMAS = {

  // Figura 4 de la tesis: "Diagrama de flujo para realizar cuenta de
  // mesofílicos aerobios"
  'mesofilos-aerobios': {
    titulo: 'Diagrama de flujo para realizar cuenta de mesofílicos aerobios',
    columnas: 1,
    nodos: [
      { id: 'inicio',   tipo: 'terminal', texto: 'Cuenta bacterias aeróbicas', col: 1, fila: 1 },
      { id: 'dilucion', tipo: 'proceso',  texto: 'Tomar dilución', col: 1, fila: 2 },
      { id: 'inocular', tipo: 'proceso',  texto: 'Inocular 1 mL de las diluciones realizadas en cajas Petri', col: 1, fila: 3 },
      { id: 'medio',    tipo: 'proceso',  texto: 'Agregar 12-15 mL de medio de cultivo Agar Triptona-Extracto de Levadura', col: 1, fila: 4 },
      { id: 'mezclar',  tipo: 'proceso',  texto: 'Mezclar el inóculo:\n6 movimientos:\n-derecha a izquierda\n-sentido manecillas del reloj\n-contrario de las manecillas\n-atrás y adelante', col: 1, fila: 5, alinear: 'izq' },
      { id: 'incubar',  tipo: 'proceso',  texto: 'Dejar solidificar e incubar cajas en posición invertida a 35 ± 2°C durante 48 ± 2 h', col: 1, fila: 6 },
      { id: 'seleccionar', tipo: 'proceso', texto: 'Seleccionar aquellas en donde se encuentren 25-150 UFC', col: 1, fila: 7 },
      { id: 'contar',   tipo: 'proceso',  texto: 'Contar las colonias desarrolladas (exceptuando mohos y levaduras)', col: 1, fila: 8 },
      { id: 'observar', tipo: 'proceso',  texto: 'Observar en microscopio para distinguir entre colonias y alimento', col: 1, fila: 9 },
      { id: 'fin',      tipo: 'terminal', texto: 'Realizar cálculos e interpretar resultados', col: 1, fila: 10 },
    ],
    aristas: [
      ['inicio', 'dilucion'], ['dilucion', 'inocular'], ['inocular', 'medio'], ['medio', 'mezclar'],
      ['mezclar', 'incubar'], ['incubar', 'seleccionar'], ['seleccionar', 'contar'],
      ['contar', 'observar'], ['observar', 'fin'],
    ],
  },

  // Figura 3 de la tesis
  'diluciones': {
    titulo: 'Diagrama de flujo para realizar diluciones primarias',
    columnas: 4,
    ancho: 13,
    nodos: [
      T('inicio', 'Preparación dilución primaria', 2, 1, { span: 2 }),
      D('tipo', '¿La muestra es sólida o líquida?', 2, 2, { span: 2 }),
      D('congS', '¿La muestra está congelada?', 2, 3),
      D('congL', '¿La muestra está congelada?', 3, 3),
      P('descongelar', 'Descongelar en refrigeración de 4 a 8ºC entre 18 y 24 h', 1, 4),
      P('pesar', 'Pesar 10 u 11 gramos en un recipiente estéril', 2, 4),
      P('agitar', 'Agitar manualmente con 25 movimientos de arriba a abajo en un arco de 30 cm por 7 segundos', 3, 4),
      P('fundir', 'Fundir en un baño de agua de 40 a 45ºC por máximo 15 minutos', 4, 4),
      P('diluyente', 'Adicionar 90 a 99 mL de diluyente', 2, 5),
      P('tomar', 'Tomar 1 mL de muestra y diluir con 9 mL del diluyente (es posible tomar alícuotas mayores respetando la proporción)', 3, 5),
      P('homog', 'Homogeneizar en licuadora por 1-2 min hasta tener una suspensión homogenea', 2, 6),
      P('sedimentar', 'Dejar sedimentar las partículas de mayor tamaño', 2, 7),
      P('transferir', 'Transferir la cantidad deseada tomando de las capas superiores de la suspensión', 2, 8),
      D('viscosa', '¿Dilución primaria viscosa?', 3, 8),
      T('decimales', 'Realizar diluciones decimales', 3, 9),
      P('masdil', 'Adicionar más diluyente y considerar en cálculos', 4, 9),
    ],
    aristas: [
      E('inicio', 'tipo'),
      E('tipo', 'congS', 'sólida', 'izq', 'arriba'), E('tipo', 'congL', 'líquida', 'der', 'arriba'),
      E('congS', 'descongelar', 'sí', 'izq', 'arriba'), E('congS', 'pesar', 'no'),
      E('congL', 'fundir', 'sí', 'der', 'arriba'), E('congL', 'agitar', 'no'),
      E('descongelar', 'pesar', '', 'der', 'izq'), E('fundir', 'agitar', '', 'izq', 'der'),
      E('pesar', 'diluyente'), E('agitar', 'tomar'),
      E('diluyente', 'homog'), E('homog', 'sedimentar'), E('sedimentar', 'transferir'),
      E('transferir', 'viscosa', '', 'der', 'izq'), E('tomar', 'viscosa'),
      E('viscosa', 'masdil', 'sí', 'der', 'arriba'), E('viscosa', 'decimales', 'no'),
      E('masdil', 'decimales', '', 'izq', 'der'),
    ],
    pasos: [['inicio'], ['tipo'], ['congS', 'congL'], ['descongelar', 'fundir'], ['pesar', 'agitar'],
      ['diluyente', 'tomar'], ['homog'], ['sedimentar'], ['transferir'], ['viscosa'], ['masdil'], ['decimales']],
  },

  // Figura 5 de la tesis
  'mohos-levaduras': {
    titulo: 'Diagrama de flujo para realizar cuenta de mohos y levaduras',
    columnas: 3,
    nodos: [
      T('inicio', 'Cuenta mohos y levaduras', 1, 1),
      T('dilucion', 'Tomar dilución o muestra', 1, 2),
      P('colocar', 'Colocar por duplicado 1 mL de muestra o dilución en caja Petri', 1, 3),
      P('medio', 'Vertir 15 a 20 mL de medio Agar papa dextrosa', 1, 4),
      P('mezclar', MEZCLA, 1, 5, { alinear: 'izq' }),
      P('solidificar', 'Dejar que solidifique', 1, 6),
      P('incubar', 'Invertir las placas e incubar a 25ºC', 1, 7),
      P('contar', 'Contar colonias a los 3, 4 y 5 días', 1, 8),
      P('cinco', '5 días después seleccionar placas que contengan entre 10-150 colonias', 1, 9),
      D('extendidas', '¿Hay colonias extendidas o difíciles de contabilizar?', 2, 9),
      P('dias34', 'Seleccionar placas de días 3 y 4', 2, 8),
      T('calculos', 'Realizar cálculos e interpretar resultados', 3, 9),
    ],
    aristas: [
      E('inicio', 'dilucion'), E('dilucion', 'colocar'), E('colocar', 'medio'), E('medio', 'mezclar'),
      E('mezclar', 'solidificar'), E('solidificar', 'incubar'), E('incubar', 'contar'), E('contar', 'cinco'),
      E('cinco', 'extendidas', '', 'der', 'izq'),
      E('extendidas', 'dias34', 'sí', 'arriba', 'abajo'),
      E('dias34', 'calculos', '', 'der', 'arriba'),
      E('extendidas', 'calculos', 'no', 'abajo', 'abajo'),
    ],
    pasos: [['inicio'], ['dilucion'], ['colocar'], ['medio'], ['mezclar'], ['solidificar'], ['incubar'],
      ['contar'], ['cinco'], ['extendidas'], ['dias34'], ['calculos']],
  },

  // Figura 6 de la tesis
  'coliformes-placa': {
    titulo: 'Diagrama de flujo para realizar cuenta de coliformes totales en placa',
    columnas: 1,
    nodos: [
      T('inicio', 'Cuenta coliformes totales', 1, 1),
      T('dilucion', 'Tomar dilución o muestra', 1, 2),
      P('colocar', 'Colocar por duplicado 1 mL de muestra o dilución en caja Petri', 1, 3),
      P('medio', 'Vertir 15 a 20 mL de medio Agar rojo-violeta-bilis-lactosa fundido', 1, 4),
      P('mezclar', MEZCLA, 1, 5, { alinear: 'izq' }),
      P('solidificar', 'Dejar que solidifique', 1, 6),
      P('capa', 'Verter 4 mL de medio RBVA a 45ºC ± 1ºC y dejar que solidifique', 1, 7),
      P('incubar', 'Invertir las placas e incubar a 35ºC durante 24 ± 2 h', 1, 8),
      P('seleccionar', 'Seleccionar placas que contengan 15-150 colonias', 1, 9),
      P('tipicas', 'Colonias típicas: color rojo oscuro, rodeadas por un halo de precipitación', 1, 10),
      T('fin', 'Realizar cálculos e interpretar resultados', 1, 11),
    ],
    aristas: [
      E('inicio', 'dilucion'), E('dilucion', 'colocar'), E('colocar', 'medio'), E('medio', 'mezclar'),
      E('mezclar', 'solidificar'), E('solidificar', 'capa'), E('capa', 'incubar'), E('incubar', 'seleccionar'),
      E('seleccionar', 'tipicas'), E('tipicas', 'fin'),
    ],
  },

  // Figura 7 de la tesis
  'salmonella': {
    titulo: 'Diagrama de flujo para realizar la detección de Salmonella sp.',
    columnas: 2,
    ancho: 17,
    nodos: [
      T('inicio', 'Pre enriquecimiento', 1, 1, { span: 2 }),
      P('agregar', 'En 225 mL de medio de pre-enriquecimiento (agua peptonada) agregar 25 gramos de muestra (Dil 1:10)', 1, 2, { span: 2 }),
      P('licuar', 'Licuar si es necesario por 1 min', 1, 3, { span: 2 }),
      P('transferir', 'Transferir a un recipiente estéril de boca ancha', 1, 4, { span: 2 }),
      P('reposar', 'Dejar reposar por 60 min', 1, 5, { span: 2 }),
      P('ph', 'Mezclar y determinar pH', 1, 6, { span: 2 }),
      P('ajustar', 'Ajustar pH 6.8 ± 0.2 con NaOH 1 N o HCl 1 N', 1, 7, { span: 2 }),
      P('incubar', 'Incubar 24 ± 2 h a 35ºC', 1, 8, { span: 2 }),
      T('selectivo', 'Enriquecimiento selectivo', 1, 9, { span: 2 }),
      P('rvs', 'Transferir 0.1 ml de cultivo de pre-enriquecimiento a un tubo de 10 mL de caldo RVS', 1, 10),
      P('mkttn', 'Transferir 0.1 ml de cultivo de pre-enriquecimiento a un tubo de 10 mL de caldo MKTTn', 2, 10),
      P('incrvs', 'Incubar a 41.5ºC ± 1º por 24 ± 3 h', 1, 11),
      P('incmk', 'Incubar a 36ºC ± 1ºC por 24 h ± 3 h', 2, 11),
      T('fin', 'Aislamiento e identificación', 1, 12, { span: 2 }),
    ],
    aristas: [
      E('inicio', 'agregar'), E('agregar', 'licuar'), E('licuar', 'transferir'), E('transferir', 'reposar'),
      E('reposar', 'ph'), E('ph', 'ajustar'), E('ajustar', 'incubar'), E('incubar', 'selectivo'),
      E('selectivo', 'rvs'), E('selectivo', 'mkttn'), E('rvs', 'incrvs'), E('mkttn', 'incmk'),
      E('incrvs', 'fin'), E('incmk', 'fin'),
    ],
  },

  // S. aureus, página 36 de la tesis (prueba presuntiva)
  's-aureus-presuntiva': {
    titulo: 'S. aureus. Prueba presuntiva',
    columnas: 3,
    nodos: [
      T('inicio', 'Prueba presuntiva', 1, 1),
      P('agregar', 'Agregar 25 g de muestra en frascos con 225 mL de solución reguladora de fosfatos o agua peptonada', 1, 2),
      P('homog', 'Homogeneizar por 1-2 minutos en licuadora', 1, 3),
      P('inocular', 'Inocular 0.1 mL de muestra por duplicado en agar Baird Parker', 1, 4),
      P('distribuir', 'Distribuir el inóculo sobre la superficie del agar con varilla de vidrio', 1, 5),
      P('mantener', 'Mantener las placas con tapas hacia arriba hasta que el inóculo sea absorbido totalmente', 1, 6),
      P('incubar', 'Invertir placas e incubar por 44-48 h a 36 ± 1ºC', 1, 7),
      P('observar', 'Observar morfología y seleccionar placas que contengan entre 15-150 colonias típicas', 2, 7),
      P('cinco', 'Seleccionar por muestra 5 colonias típicas para confirmación o 5 colonias atípicas', 2, 8),
      P('gram', 'Realizar tinción de Gram', 2, 9),
      D('forma', '¿Qué forma se observa?', 2, 10),
      T('bacilos', 'Negativa a S. aureus (bacilos positivos)', 1, 11),
      T('cocos', 'Realizar pruebas confirmativas', 3, 11),
    ],
    aristas: [
      E('inicio', 'agregar'), E('agregar', 'homog'), E('homog', 'inocular'), E('inocular', 'distribuir'),
      E('distribuir', 'mantener'), E('mantener', 'incubar'),
      E('incubar', 'observar', '', 'der', 'izq'),
      E('observar', 'cinco'), E('cinco', 'gram'), E('gram', 'forma'),
      E('forma', 'bacilos', 'bacilos', 'izq', 'arriba'), E('forma', 'cocos', 'cocos', 'der', 'arriba'),
    ],
  },

  // S. aureus, página 37 de la tesis (prueba confirmativa)
  's-aureus-confirmativa': {
    titulo: 'S. aureus. Prueba confirmativa',
    columnas: 5,
    ancho: 15,
    nodos: [
      T('inicio', 'Prueba confirmativa', 3, 1),
      T('coag', 'Prueba coagulasa', 2, 2),
      T('termo', 'Prueba termonucleasa', 5, 2),
      P('c1', 'Seleccionar y sembrar cada colonia típica en tubos con 0.5 mL de BHI y tubos con AST', 2, 3),
      P('c2', 'Incubar a 35 ± 1ºC en baño de agua durante 20-24 h', 2, 4),
      P('c3', 'Agregar 0.1 mL de cultivo a 0.3 mL de plasma de conejo con EDTA', 2, 5),
      P('c4', 'Incubar a 37± 1ºC en baño de agua y observar cada hora las primeras 4-6 horas', 2, 6),
      D('coagulo', '¿Hay formación de coágulo?', 2, 7),
      P('hasta24', 'Observar hasta las 24 horas', 1, 8),
      D('firme', '¿El coágulo se forma completamente y es fime al invertir el tubo?', 3, 8),
      T('aux', 'Realizar pruebas auxiliares', 2, 9),
      T('positiva1', 'Positiva para S. aureus', 4, 9),
      P('t1', 'Preparar portaobjetos con 3 mL de agar azul de toluidina-DNA', 5, 3),
      P('t2', 'Hacer orificios pequeños equidistantes al agar con una pipeta Pasteur', 5, 4),
      P('t3', 'En un baño de agua calentar durante 15 min 0.3 mL de cultivo BHI', 5, 5),
      P('t4', 'Transferir una gota del cultivo a un orificio del medio', 5, 6),
      P('t5', 'Incubar a 35 ± 1ºC en cámara húmeda de 4 a 24 horas', 5, 7),
      P('t6', 'Observar el medio', 5, 8),
      D('halo', '¿Se observa un halo rosa?', 5, 9),
      T('positiva2', 'Positiva para S. aureus', 5, 10),
    ],
    aristas: [
      E('inicio', 'coag', '', 'izq', 'arriba'), E('inicio', 'termo', '', 'der', 'arriba'),
      E('coag', 'c1'), E('c1', 'c2'), E('c2', 'c3'), E('c3', 'c4'), E('c4', 'coagulo'),
      E('coagulo', 'hasta24', 'no', 'izq', 'arriba'),
      E('coagulo', 'firme', 'sí', 'der', 'arriba'),
      E('firme', 'aux', 'no', 'izq', 'arriba'), E('firme', 'positiva1', 'sí', 'der', 'arriba'),
      E('termo', 't1'), E('t1', 't2'), E('t2', 't3'), E('t3', 't4'), E('t4', 't5'), E('t5', 't6'), E('t6', 'halo'),
      E('halo', 'positiva2', 'sí'),
    ],
  },

  // S. aureus, página 38 de la tesis (pruebas auxiliares)
  's-aureus-auxiliares': {
    titulo: 'S. aureus. Pruebas auxiliares',
    columnas: 4,
    ancho: 15,
    nodos: [
      T('inicio', 'Pruebas auxiliares', 3, 1),
      T('bioq', 'Pruebas bioquímicas', 2, 2),
      P('alterna', 'Como alternativa se puede utilizar un sistema de bioquímicas miniaturizado', 1, 2),
      T('glu', 'Utilización anaeróbica de la glucosa', 1, 3),
      T('man', 'Utilización anaeróbica del manitol', 2, 3),
      T('cat', 'Prueba de catalasa a partir del cultivo AST', 3, 3),
      T('gram', 'Tinción de Gram', 4, 3),
      P('glu1', 'Inocular un tubo con caldo para la fermentación adicionado de glucosa 0.5% con inóculo abundante', 1, 4),
      P('man1', 'Inocular un tubo con caldo para la fermentación adicionado de manitol (0.5%) con inóculo abundante', 2, 4),
      P('cat1', 'En portaobjetos emulsificar una porción del cultivo con una gota de peróxido de hidrógeno al 3%', 3, 4),
      P('gram1', 'Observar al microscopio la presencia de cocos Gram positivos agrupados en racimos', 4, 4),
      P('glu2', 'Cubrir con una capa de aceite de parafina o aceite mineral', 1, 5),
      P('man2', 'Cubrir el caldo con una capa de aceite de parafina o aceite mineral', 2, 5),
      P('cat2', 'Observar si hay producción de burbujas', 3, 5),
      T('gram2', 'Interpretar observaciones', 4, 5),
      P('glu3', 'Incubar 5 días a 36 ±1ºC', 1, 6),
      P('man3', 'Incubar 5 días a 36 ± 1ºC', 2, 6),
      T('cat3', 'Interpretar observaciones', 3, 6),
      D('glu4', '¿Hay un cambio de color en el indicador?', 1, 7),
      D('man4', '¿Hay un cambio de color en el indicador?', 2, 7),
      T('glu5', 'Positiva S. aureus', 1, 8),
      T('man5', 'Positiva S. aureus', 2, 8),
    ],
    aristas: [
      E('inicio', 'bioq', '', 'izq', 'arriba'), E('inicio', 'gram', '', 'der', 'arriba'),
      E('bioq', 'alterna', '', 'izq', 'der'),
      E('bioq', 'glu'), E('bioq', 'man'), E('bioq', 'cat'),
      E('glu', 'glu1'), E('glu1', 'glu2'), E('glu2', 'glu3'), E('glu3', 'glu4'), E('glu4', 'glu5', 'sí'),
      E('man', 'man1'), E('man1', 'man2'), E('man2', 'man3'), E('man3', 'man4'), E('man4', 'man5', 'sí'),
      E('cat', 'cat1'), E('cat1', 'cat2'), E('cat2', 'cat3'),
      E('gram', 'gram1'), E('gram1', 'gram2'),
    ],
  },

  // NMP, página 42 de la tesis (prueba presuntiva)
  'nmp-presuntiva': {
    titulo: 'NMP. Prueba presuntiva',
    columnas: 2,
    nodos: [
      T('inicio', 'Prueba presuntiva', 1, 1),
      P('agregar', 'En 225 mL de medio de regulador de fosfatos o diluyente peptona agregar 25 gramos de muestra (Dil 1:10)', 1, 2),
      P('moler', 'Moler por 2 min en vaso de licuadora', 1, 3),
      P('preparar', 'Preparar diluciones decimales con regulador de fosfatos', 1, 4),
      P('agitar', 'Agitar las diluciones 25 veces en un arco de 30 cm por 7s', 1, 5),
      P('transferir', 'Transferir volúmenes de 1 mL a tres tubos con 10 mL de caldo lauril triptosa', 1, 6),
      P('cada', 'Por cada dilución por lo menos tres diluciones consecutivas', 1, 7),
      P('incubar', 'Incubar a 35ºC ± 0.5ºC por 24 h', 1, 8),
      D('gas', '¿Hay formación de gas?', 1, 9),
      T('confirmativa', 'Prueba confirmativa', 2, 9),
      P('mas24', 'Incubar 24 horas', 1, 10),
    ],
    aristas: [
      E('inicio', 'agregar'), E('agregar', 'moler'), E('moler', 'preparar'), E('preparar', 'agitar'),
      E('agitar', 'transferir'), E('transferir', 'cada'), E('cada', 'incubar'), E('incubar', 'gas'),
      E('gas', 'confirmativa', 'sí', 'der', 'izq'), E('gas', 'mas24', 'no'),
      E('mas24', 'gas', '', 'izq', 'izq'),
    ],
  },

  // NMP, página 43 de la tesis (prueba confirmativa)
  'nmp-confirmativa': {
    titulo: 'NMP. Prueba confirmativa',
    columnas: 3,
    nodos: [
      T('inicio', 'Prueba confirmativa', 2, 1),
      P('asada', 'De cada tubo con formación de gas tomar una asada', 2, 2),
      P('sembrar', 'Sembrar en un número igual de tubos de caldo EC', 2, 3),
      D('clase', '¿Qué clase de coliformes se evaluarán?', 2, 4),
      P('fecales', 'Incubar a 45.5 ± 2ºC en baño de agua con recircualción continua por 24 horas', 1, 5),
      P('totales', 'Incubar a 35ºC ± 0.5ºC por 48 ± 2h', 3, 5),
      D('gas', '¿Hay formación de gas?', 2, 6),
      P('registrar', 'Registrar lectura', 3, 6),
      P('mas24', 'Incubar 24 horas más', 2, 7),
      P('calcular', 'Calcular el NMP de coliformes fecales y coliformes totales respectivamente con las tablas de NMP', 3, 8),
      T('anotar', 'Anotar observaciones', 3, 9),
    ],
    aristas: [
      E('inicio', 'asada'), E('asada', 'sembrar'), E('sembrar', 'clase'),
      E('clase', 'fecales', 'coliformes fecales', 'izq', 'arriba'), E('clase', 'totales', 'coliformes totales', 'der', 'arriba'),
      E('fecales', 'gas'), E('totales', 'gas'),
      E('gas', 'registrar', 'sí', 'der', 'izq'), E('gas', 'mas24', 'no'),
      E('registrar', 'calcular'), E('mas24', 'calcular', '', 'der', 'izq'),
      E('calcular', 'anotar'),
    ],
  },

  // NMP, página 44 de la tesis (E. coli: prueba presuntiva)
  'nmp-ecoli-presuntiva': {
    titulo: 'NMP. E. coli: aislamiento',
    columnas: 2,
    nodos: [
      T('inicio', 'Prueba presuntiva', 1, 1),
      P('asada', 'Tomar una asada de los tubos positivos de caldo EC', 1, 2),
      P('estria', 'Sembrar por estría cruzada en agar EMB-L para su aislamiento', 1, 3),
      P('incubar', 'Incubar las placas invertidas a 35ºC ± 1ºC durante 18-24 horas', 1, 4),
      D('tipica', '¿Hay colonias con morfología colonial típica?', 1, 5),
      P('sel2', 'Seleccionar 2', 2, 5),
      P('probar', 'Probar 1 o más colonias lo más parecido a E. coli de cada placa', 1, 6),
      P('frotis', 'Realizar frotis y teñir por Gram', 1, 7),
      P('bacilos', 'Observar la presencia de bacilos cortos Gram negativos', 1, 8),
      P('cuenta', 'Sembrar en agar cuenta estándar (placa o agar inclicado)', 2, 8),
      P('inc2', 'Incubar las placas o tubos a 35ºC ± 1ºC por 18-24 horas', 2, 9),
      T('bioq', 'Realizar pruebas bioquímicas', 2, 10),
    ],
    aristas: [
      E('inicio', 'asada'), E('asada', 'estria'), E('estria', 'incubar'), E('incubar', 'tipica'),
      E('tipica', 'sel2', 'sí', 'der', 'izq'), E('tipica', 'probar', 'no'),
      E('probar', 'frotis'), E('frotis', 'bacilos'),
      E('bacilos', 'cuenta', '', 'der', 'izq'), E('sel2', 'cuenta'),
      E('cuenta', 'inc2'), E('inc2', 'bioq'),
    ],
  },

  // NMP, página 45 de la tesis (E. coli: pruebas bioquímicas, IMViC)
  'nmp-ecoli-bioquimicas': {
    titulo: 'NMP. E. coli: pruebas bioquímicas (IMViC)',
    columnas: 4,
    ancho: 15,
    nodos: [
      T('inicio', 'Pruebas bioquímicas', 2, 1, { span: 2 }),
      P('imvic', 'Realizar el Test IMViC', 2, 2, { span: 2 }),
      T('indol', 'Producción de Indol', 1, 3),
      T('vp', 'Vogues-Proskauer', 2, 3),
      T('mr', 'Rojo de metilo', 3, 3),
      T('citrato', 'Citrato', 4, 3),
      P('i1', 'Inocular un tubo con caldo triptona', 1, 4),
      P('v1', 'Inocular un tubo con caldo MR-VP', 2, 4),
      P('i2', 'Incubar a 35ºC ± 0.5ºC por 24 h ± 2h', 1, 5),
      P('v2', 'Incubar a 35ºC ± 0.5ºC por 48 h ± 2h', 2, 5),
      P('m1', 'Adicionar cinco gotas de solución rojo de metilo', 3, 5),
      P('i3', 'Adicionar 0.2 mL a 0.3 mL de reactivo Kovac (dejar caer gotas del reactivo por paredes)', 1, 6),
      P('v3', 'Transferir 1 mL a un tubo de 13 mm x 100 mm', 2, 6),
      T('m2', 'Interpretar observaciones', 3, 6),
      P('i4', 'No agitar hasta obervación del anillo rojo en la superficie', 1, 7),
      P('v4', 'Adicionar 0.6 mL de solución de naftol y 0.2 mL de KOH al 40% y agitar', 2, 7),
      D('caldo', '¿Qué caldo se utilizará?', 4, 7),
      T('i5', 'Interpretar observaciones', 1, 8),
      P('v5', 'Esperar de 15-30 min', 2, 8),
      P('koser', 'Sembrar un inóculo ligero en un tubo con caldo evitando turbiedad', 3, 8),
      P('simmon', 'Inocular por estría', 4, 8),
      T('v6', 'Interpretar observaciones', 2, 9),
      P('koser2', 'Incubar a 35ºC ± 0.5ºC por 96 horas', 3, 9),
      P('simmon2', 'Incubar a 35ºC ± 0.5ºC por 48 horas', 4, 9),
      T('koser3', 'Interpretar observaciones', 3, 10),
      T('simmon3', 'Interpretar observaciones', 4, 10),
    ],
    aristas: [
      E('inicio', 'imvic'),
      E('imvic', 'indol'), E('imvic', 'vp'), E('imvic', 'mr'), E('imvic', 'citrato'),
      E('indol', 'i1'), E('i1', 'i2'), E('i2', 'i3'), E('i3', 'i4'), E('i4', 'i5'),
      E('vp', 'v1'), E('v1', 'v2'), E('v2', 'v3'), E('v3', 'v4'), E('v4', 'v5'), E('v5', 'v6'),
      E('v2', 'm1', '', 'der', 'izq'),
      E('mr', 'm1'), E('m1', 'm2'),
      E('citrato', 'caldo'),
      E('caldo', 'koser', 'citrato de Koser', 'izq', 'arriba'), E('caldo', 'simmon', 'citrato de Simmon'),
      E('koser', 'koser2'), E('koser2', 'koser3'), E('simmon', 'simmon2'), E('simmon2', 'simmon3'),
    ],
  },
};

if (typeof module !== 'undefined') module.exports = DIAGRAMAS;
