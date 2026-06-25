/* ===========================================================================
   DosLos · scoring.js  (Bloque 3 — motor de puntuación)

   Calcula los puntos de una ronda a partir de 4 factores:
     - Longitud   de la palabra
     - Rareza     (cuanto menos común, más puntos)
     - Velocidad  (vs rival; en práctica, vs un tiempo objetivo)
     - Adecuación con la frase

   Todo el cálculo es determinista y offline. La "adecuación" se basa, de
   momento, en el mapa `fits` curado de cada frase (ver content.js). Más
   adelante se puede mejorar con un diccionario/IA.
   =========================================================================== */

(function () {
  "use strict";

  // Isomorfo: navegador (window) y Node (globalThis). El servidor usa el mismo
  // motor de puntuación que el cliente.
  const DosLos = (globalThis.DosLos = globalThis.DosLos || {});

  // Pesos de cada factor. Suman 1. Tunéalos para balancear el juego.
  const WEIGHTS = {
    fit: 0.35,
    rarity: 0.25,
    length: 0.20,
    speed: 0.20,
  };

  const MAX_ROUND_POINTS = 1000;

  // Velocidad (modo práctica): tiempos en ms.
  const SPEED_FAST_MS = 4000; //  <= esto => velocidad máxima
  const SPEED_SLOW_MS = 18000; // >= esto => velocidad nula

  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  /** Normaliza: minúsculas, sin espacios sobrantes. (Conserva acentos/ñ.) */
  function normalize(word) {
    return (word || "").trim().toLowerCase();
  }

  /** Quita acentos para comparar de forma tolerante. */
  function deaccent(word) {
    return word.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /** ¿Es una sola palabra de letras válida? */
  function isValidWord(word) {
    const w = normalize(word);
    return /^[a-zñáéíóúü]{2,}$/.test(w) && !/\s/.test(w);
  }

  /* ---------------------------- Factores ---------------------------- */

  // 0..1 — palabras de 11+ letras dan el máximo.
  function lengthScore(word) {
    const len = normalize(word).length;
    return clamp01((len - 2) / (11 - 2));
  }

  // 0..1 — según frecuencia. Desconocida = rara.
  function rarityScore(word) {
    const w = normalize(word);
    const { veryCommon, common } = DosLos.WORD_FREQ;
    let base;
    if (veryCommon.has(w)) base = 0.12;
    else if (common.has(w)) base = 0.45;
    else base = 0.8; // no está en las listas => poco común
    // Un pequeño empujón por longitud: las palabras largas raras lucen más.
    const lengthBoost = clamp01((normalize(word).length - 6) / 8) * 0.15;
    return clamp01(base + lengthBoost);
  }

  // 0..1 — en práctica, vs tiempo objetivo.
  function speedScorePractice(elapsedMs) {
    if (elapsedMs == null) return 0;
    const t = clamp01((SPEED_SLOW_MS - elapsedMs) / (SPEED_SLOW_MS - SPEED_FAST_MS));
    return t;
  }

  // 0..1 — online, comparado con el rival. El más rápido se lleva ~1.
  function speedScoreVersus(elapsedMs, rivalMs) {
    if (elapsedMs == null) return 0;
    if (rivalMs == null) return speedScorePractice(elapsedMs);
    if (elapsedMs <= rivalMs) {
      // Ganas en velocidad; margen mayor => premio mayor (hasta 1).
      const lead = clamp01((rivalMs - elapsedMs) / rivalMs);
      return clamp01(0.7 + lead * 0.3);
    }
    // Más lento: castigo proporcional, pero nunca por debajo de 0.
    const behind = clamp01((elapsedMs - rivalMs) / elapsedMs);
    return clamp01(0.7 - behind * 0.7);
  }

  // 0..1 — adecuación según el mapa curado de la frase.
  function fitScore(word, phrase) {
    if (!phrase || !phrase.fits) return 0.4;
    const w = normalize(word);
    // Coincidencia exacta.
    if (phrase.fits[w] != null) return phrase.fits[w];
    // Coincidencia ignorando acentos (tolerante a tildes).
    const wd = deaccent(w);
    for (const key in phrase.fits) {
      if (deaccent(key) === wd) return phrase.fits[key];
    }
    // Palabra válida pero no prevista: adecuación base (creatividad).
    return 0.4;
  }

  /* ---------------------------- API ---------------------------- */

  /**
   * Puntúa una jugada.
   * @param {Object} p
   * @param {string} p.word       Palabra escrita por el jugador.
   * @param {Object} p.phrase     Frase de content.js (con `fits`).
   * @param {number} p.elapsedMs  Tiempo que tardó (ms).
   * @param {number|null} [p.rivalMs] Tiempo del rival (online) o null (práctica).
   * @returns {{ total:number, valid:boolean, factors:Object }}
   */
  function scoreWord({ word, phrase, elapsedMs, rivalMs = null }) {
    const valid = isValidWord(word);
    if (!valid) {
      return {
        total: 0,
        valid: false,
        factors: { length: 0, rarity: 0, speed: 0, fit: 0 },
      };
    }

    const factors = {
      length: lengthScore(word),
      rarity: rarityScore(word),
      speed: rivalMs == null ? speedScorePractice(elapsedMs) : speedScoreVersus(elapsedMs, rivalMs),
      fit: fitScore(word, phrase),
    };

    const weighted =
      factors.fit * WEIGHTS.fit +
      factors.rarity * WEIGHTS.rarity +
      factors.length * WEIGHTS.length +
      factors.speed * WEIGHTS.speed;

    return {
      total: Math.round(weighted * MAX_ROUND_POINTS),
      valid: true,
      factors,
    };
  }

  DosLos.scoring = {
    scoreWord,
    isValidWord,
    normalize,
    WEIGHTS,
    MAX_ROUND_POINTS,
  };
})();
