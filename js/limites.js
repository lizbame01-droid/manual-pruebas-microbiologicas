// js/limites.js
// Límites microbiológicos del manual (UFC/g o NMP/g), tablas 6, 7 y 8,
// y la función que compara un resultado con ellos. Lo usan la
// calculadora UFC, la calculadora NMP y las hojas de resultados.
//
// Valores de cada alimento:
//   número            → máximo permitido (cumple si es menor o igual)
//   { menorQue: n }   → límite escrito como "< n" (cumple solo si es menor)
//   'NA'              → no aplica para ese alimento
//   (campo ausente)   → el manual no establece límite
//
// Claves de prueba: mesofilos, hongos (mohos y levaduras), coliformes,
// salmonella ('ausencia' = ausente en 25 g).

const LIMITES = {
  ALIMENTOS: {
    'harina-trigo':          { nombre: 'Harina de trigo y sémolas',     mesofilos: 50000,  coliformes: 'NA',  hongos: 300 },
    'harina-maiz':           { nombre: 'Harina de maíz',                mesofilos: 100000, coliformes: 100,   hongos: 1000 },
    'harina-maiz-nixt':      { nombre: 'Harina de maíz nixtamalizada',  mesofilos: 50000,  coliformes: 100,   hongos: 1000 },
    'harina-centeno':        { nombre: 'Harina de centeno',             mesofilos: 100000, coliformes: 100,   hongos: 200 },
    'harina-cebada':         { nombre: 'Harina de cebada',              mesofilos: 100000, coliformes: 100,   hongos: 200 },
    'harina-avena':          { nombre: 'Harina de avena',               mesofilos: 50000,  coliformes: 50,    hongos: 100 },
    'harina-arroz':          { nombre: 'Harina de arroz',               mesofilos: 100000, coliformes: 100,   hongos: 200 },
    'harina-integral':       { nombre: 'Harinas integrales',            mesofilos: 500000, coliformes: 500,   hongos: 500 },
    'harina-integral-trigo': { nombre: 'Harinas integrales de trigo',   mesofilos: 500000, coliformes: 'NA',  hongos: 'NA' },
    'granos':                { nombre: 'Granos',                        mesofilos: 10000,  coliformes: { menorQue: 30 }, hongos: 300, salmonella: 'ausencia' },
    'semillas-comestibles':  { nombre: 'Semillas comestibles',          mesofilos: 10000,  coliformes: { menorQue: 30 }, hongos: 300, salmonella: 'ausencia' },
    'frutos-deshidratados':  { nombre: 'Frutos deshidratados',          mesofilos: 10000,  coliformes: { menorQue: 30 }, hongos: 300, salmonella: 'ausencia' },
    'miel-abeja':            { nombre: 'Miel de abeja y aglutinantes naturales', mesofilos: 1000, hongos: { menorQue: 100 } },
  },

  // Compara un valor con el límite de una prueba para un alimento.
  // Devuelve { estado, limite } con estado:
  //   'cumple', 'no-cumple', 'no-concluyente', 'no-aplica' o 'sin-limite'.
  // "estimado" indica que el valor es un tope ("menor que"), no un conteo.
  evaluarLimite: function (clavePrueba, alimento, valor, estimado) {
    const a = LIMITES.ALIMENTOS[alimento];
    if (!a || !clavePrueba) return { estado: 'sin-limite', limite: null };

    const limite = a[clavePrueba];
    if (limite === 'NA') return { estado: 'no-aplica', limite: null };
    if (limite === undefined) return { estado: 'sin-limite', limite: null };

    const estricto = typeof limite === 'object';
    const tope = estricto ? limite.menorQue : limite;
    const texto = (estricto ? '< ' : '≤ ') + tope.toLocaleString('en-US');

    // Con "menor que X" el valor real es menor que el reportado: solo se
    // puede afirmar que cumple si ese tope ya queda dentro del límite.
    if (estimado) {
      return { estado: valor <= tope ? 'cumple' : 'no-concluyente', limite: texto };
    }
    const cumple = estricto ? valor < tope : valor <= tope;
    return { estado: cumple ? 'cumple' : 'no-cumple', limite: texto };
  },
};

if (typeof module !== 'undefined') module.exports = LIMITES;
