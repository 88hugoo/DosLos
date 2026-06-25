/* ===========================================================================
   DosLos · content.js
   Banco de frases y datos de frecuencia de palabras (para la "rareza").

   Sin módulos ES: se cuelga de window.DosLos para que funcione también
   abriendo index.html con doble clic (file://), sin servidor.
   =========================================================================== */

(function () {
  "use strict";

  const DosLos = (window.DosLos = window.DosLos || {});

  /* ---------------------------------------------------------------------
     FRASES
     Cada frase tiene un hueco marcado con "___".
     `fits` mapea palabra -> peso de adecuación (0..1). Cuanto mejor encaja
     la palabra en la frase, mayor el peso. Las palabras que no estén en el
     mapa reciben una adecuación base (ver scoring.js): así una respuesta
     creativa sigue puntuando, pero las "buenas" puntúan más.
     --------------------------------------------------------------------- */
  DosLos.PHRASES = [
    {
      text: "El ___ saltó por la ventana sin avisar.",
      fits: { gato: 1.0, ladrón: 0.95, perro: 0.85, niño: 0.8, mono: 0.7, fantasma: 0.65 },
    },
    {
      text: "Nunca confíes en un ___ que sonríe demasiado.",
      fits: { político: 1.0, payaso: 0.95, vendedor: 0.9, cocodrilo: 0.85, desconocido: 0.8 },
    },
    {
      text: "Mi abuela guarda un ___ debajo de la cama.",
      fits: { tesoro: 1.0, secreto: 0.95, revólver: 0.9, cofre: 0.85, gato: 0.7 },
    },
    {
      text: "El examen fue tan ___ que todos lloraron.",
      fits: { difícil: 1.0, absurdo: 0.95, largo: 0.85, injusto: 0.9, raro: 0.75 },
    },
    {
      text: "Por la noche, el bosque se vuelve ___.",
      fits: { peligroso: 1.0, mágico: 0.95, silencioso: 0.9, oscuro: 0.85, terrorífico: 0.95 },
    },
    {
      text: "No hay nada peor que un café ___.",
      fits: { frío: 1.0, aguado: 0.9, amargo: 0.85, malo: 0.7, descafeinado: 0.8 },
    },
    {
      text: "El robot aprendió a ___ por su cuenta.",
      fits: { bailar: 1.0, mentir: 0.95, soñar: 0.9, cocinar: 0.85, amar: 0.9 },
    },
    {
      text: "Siempre llevo un ___ en el bolsillo, por si acaso.",
      fits: { caramelo: 0.9, cuchillo: 0.95, billete: 0.85, amuleto: 1.0, móvil: 0.8 },
    },
    {
      text: "La fiesta terminó cuando llegó el ___.",
      fits: { vecino: 0.9, jefe: 0.95, policía: 1.0, amanecer: 0.9, ex: 0.95 },
    },
    {
      text: "Aprendí a ___ viendo tutoriales a las 3 de la mañana.",
      fits: { programar: 1.0, cocinar: 0.9, mentir: 0.85, dibujar: 0.9, sobrevivir: 0.95 },
    },
    {
      text: "El plan era perfecto hasta que apareció el ___.",
      fits: { problema: 0.95, perro: 0.85, jefe: 0.9, imprevisto: 1.0, viento: 0.7 },
    },
    {
      text: "Solo un ___ entendería este chiste.",
      fits: { genio: 0.95, friki: 1.0, matemático: 0.9, loco: 0.85, niño: 0.7 },
    },
    {
      text: "Cada vez que estornudo, el ___ se asusta.",
      fits: { gato: 1.0, perro: 0.95, bebé: 0.9, vecino: 0.85, loro: 0.9 },
    },
    {
      text: "La receta secreta lleva un toque de ___.",
      fits: { locura: 1.0, canela: 0.9, amor: 0.95, picante: 0.85, magia: 0.9 },
    },
    {
      text: "Me desperté y todo estaba cubierto de ___.",
      fits: { nieve: 1.0, polvo: 0.9, purpurina: 0.95, hojas: 0.85, niebla: 0.9 },
    },
    {
      text: "El héroe olvidó su ___ en casa.",
      fits: { capa: 0.95, espada: 1.0, escudo: 0.9, valor: 0.95, paraguas: 0.8 },
    },
  ];

  /* ---------------------------------------------------------------------
     FRECUENCIA DE PALABRAS (para la rareza)
     Listas por niveles. Cuanto más común es una palabra, menos puntúa su
     rareza. Lo que no aparezca en ninguna lista se considera "raro".
     No pretende ser exhaustivo: basta para distinguir común vs poco común.
     --------------------------------------------------------------------- */

  // Muy comunes (rareza baja)
  const VERY_COMMON = [
    "el", "la", "los", "las", "un", "una", "de", "que", "y", "a", "en", "es",
    "por", "con", "no", "se", "su", "lo", "como", "más", "pero", "sus", "le",
    "ya", "o", "este", "sí", "porque", "esta", "son", "entre", "está", "casa",
    "perro", "gato", "agua", "sol", "día", "noche", "cosa", "vez", "bien",
    "malo", "bueno", "grande", "pequeño", "frío", "calor", "niño", "niña",
    "mujer", "hombre", "tiempo", "año", "mano", "ojo", "mundo", "vida", "amor",
    "comer", "beber", "ir", "ver", "dar", "hacer", "decir", "amigo",
  ];

  // Comunes (rareza media)
  const COMMON = [
    "ventana", "puerta", "mesa", "silla", "calle", "ciudad", "bosque",
    "fiesta", "examen", "café", "jefe", "vecino", "policía", "secreto",
    "tesoro", "problema", "viento", "nieve", "polvo", "magia", "loco",
    "genio", "héroe", "espada", "escudo", "capa", "valor", "bailar",
    "cocinar", "soñar", "mentir", "dibujar", "amar", "raro", "difícil",
    "largo", "oscuro", "peligroso", "vendedor", "político", "payaso",
    "caramelo", "cuchillo", "billete", "móvil", "bebé", "loro", "canela",
    "picante", "amanecer", "abuela", "receta", "plan", "chiste", "tutorial",
  ];

  DosLos.WORD_FREQ = {
    veryCommon: new Set(VERY_COMMON),
    common: new Set(COMMON),
  };
})();
