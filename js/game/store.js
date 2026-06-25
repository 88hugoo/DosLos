/* ===========================================================================
   DosLos · store.js
   Ajustes persistentes (localStorage), efectos de sonido (WebAudio) y
   vibración. Todo respeta las preferencias del jugador.
   =========================================================================== */

(function () {
  "use strict";

  const DosLos = (window.DosLos = window.DosLos || {});

  const KEY = "doslos.settings";
  const HS_KEY = "doslos.highscore";

  const DEFAULTS = { name: "", sound: true, vibration: true, theme: "dark" };

  /* ----------------------------- ajustes ----------------------------- */

  function read() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function write(patch) {
    const next = { ...read(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function get(k) { return read()[k]; }
  function set(k, v) { return write({ [k]: v }); }

  /** Nombre del jugador, con un valor por defecto razonable. */
  function playerName() {
    const n = (read().name || "").trim();
    return n || "Tú";
  }

  /* ----------------------------- tema ----------------------------- */

  function applyTheme() {
    const light = read().theme === "light";
    document.body.classList.toggle("light", light);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", light ? "#f4f4f8" : "#0e0e12");
  }

  /* ----------------------------- récord (práctica) ----------------------------- */

  function highScore() {
    try { return Number(localStorage.getItem(HS_KEY)) || 0; } catch { return 0; }
  }
  function saveHighScore(score) {
    const best = highScore();
    if (score > best) {
      try { localStorage.setItem(HS_KEY, String(score)); } catch {}
      return true; // nuevo récord
    }
    return false;
  }

  /* ----------------------------- sonido ----------------------------- */

  let actx = null;
  function audioCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    return actx;
  }

  function tone(freq, dur, type = "sine", gain = 0.07, delay = 0) {
    const a = audioCtx();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(a.destination);
    const t = a.currentTime + delay;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur);
  }

  function sound(kind) {
    if (!read().sound) return;
    try {
      switch (kind) {
        case "submit": tone(520, 0.12, "triangle"); break;
        case "start":  tone(440, 0.1, "sine"); tone(660, 0.14, "sine", 0.06, 0.1); break;
        case "win":    tone(660, 0.12, "triangle"); tone(880, 0.18, "triangle", 0.07, 0.12); break;
        case "lose":   tone(300, 0.16, "sawtooth", 0.05); tone(200, 0.22, "sawtooth", 0.05, 0.14); break;
        case "tick":   tone(380, 0.05, "square", 0.04); break;
      }
    } catch {}
  }

  /* ----------------------------- vibración ----------------------------- */

  function vibrate(pattern) {
    if (!read().vibration) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch {}
    }
  }

  DosLos.store = {
    read, write, get, set, playerName,
    applyTheme, highScore, saveHighScore,
    sound, vibrate,
  };
})();
