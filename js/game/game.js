/* ===========================================================================
   DosLos · game.js  (Bloque 2 — pantalla de juego, modo práctica)

   Controla una partida local de 10 rondas contra el reloj. Usa el motor de
   puntuación (scoring.js) y el banco de frases (content.js). El multijugador
   (Bloque 4-5) reutilizará gran parte de esta lógica de ronda.
   =========================================================================== */

(function () {
  "use strict";

  const DosLos = (window.DosLos = window.DosLos || {});

  const ROUNDS = 10;
  const ROUND_SECONDS = 25;
  const BLANK = "___";

  let root = null;
  let state = null;
  let timer = null;

  /* ----------------------------- utilidades ----------------------------- */

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /** Devuelve el HTML de la frase con el hueco resaltado (relleno opcional). */
  function phraseHTML(text, filled) {
    const slot = filled
      ? `<span class="blank filled">${escapeHTML(filled)}</span>`
      : `<span class="blank"></span>`;
    return escapeHTML(text).replace(BLANK, slot);
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  /* ----------------------------- ciclo de partida ----------------------------- */

  function start() {
    root = document.getElementById("game-root");
    const phrases = shuffle(DosLos.PHRASES).slice(0, ROUNDS);
    state = { phrases, round: 0, total: 0, results: [] };
    renderRound();
  }

  function renderRound() {
    clearTimer();
    const phrase = state.phrases[state.round];
    const roundNum = state.round + 1;

    root.innerHTML = "";

    // Barra superior
    const top = el("div", "game-top");
    top.appendChild(el("span", "round-label", `Ronda ${roundNum} / ${ROUNDS}`));
    top.appendChild(el("span", "score-label", `★ ${state.total}`));
    root.appendChild(top);

    // Barra de tiempo
    const timeWrap = el("div", "time-bar");
    const fill = el("div", "time-fill");
    timeWrap.appendChild(fill);
    root.appendChild(timeWrap);

    // Frase
    const card = el("div", "phrase-card");
    const phraseEl = el("p", "phrase", phraseHTML(phrase.text));
    card.appendChild(phraseEl);
    root.appendChild(card);

    // Entrada
    const form = el("form", "answer-form");
    const input = el("input", "answer-input");
    input.type = "text";
    input.placeholder = "Tu palabra…";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.maxLength = 24;
    const submit = el("button", "btn btn-primary answer-submit", "Enviar");
    submit.type = "submit";
    form.appendChild(input);
    form.appendChild(submit);
    root.appendChild(form);

    // Relleno en vivo del hueco mientras escribe
    input.addEventListener("input", () => {
      phraseEl.innerHTML = phraseHTML(phrase.text, input.value.trim());
    });

    const startTime = performance.now();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitAnswer(input.value, phrase, performance.now() - startTime);
    });

    // Temporizador
    startTimer(fill, () => {
      // Tiempo agotado: cuenta como jugada vacía.
      submitAnswer("", phrase, ROUND_SECONDS * 1000);
    });

    setTimeout(() => input.focus(), 60);
  }

  function startTimer(fillEl, onTimeout) {
    const total = ROUND_SECONDS * 1000;
    const t0 = performance.now();
    timer = requestAnimationFrame(function tick(now) {
      const elapsed = now - t0;
      const ratio = Math.max(0, 1 - elapsed / total);
      fillEl.style.width = ratio * 100 + "%";
      if (ratio <= 0) {
        clearTimer();
        onTimeout();
        return;
      }
      timer = requestAnimationFrame(tick);
    });
  }

  function clearTimer() {
    if (timer) cancelAnimationFrame(timer);
    timer = null;
  }

  function submitAnswer(word, phrase, elapsedMs) {
    clearTimer();
    const result = DosLos.scoring.scoreWord({ word, phrase, elapsedMs, rivalMs: null });
    state.total += result.total;
    state.results.push({ word: word.trim(), phrase, result });
    renderResult(word.trim(), phrase, result);
  }

  /* ----------------------------- resultados ----------------------------- */

  function renderResult(word, phrase, result) {
    root.innerHTML = "";

    const isLast = state.round + 1 >= ROUNDS;

    const card = el("div", "result-card");
    card.appendChild(el("p", "result-phrase", phraseHTML(phrase.text, word || "—")));

    if (!result.valid) {
      card.appendChild(el("p", "result-invalid", "Palabra no válida — 0 puntos"));
    } else {
      card.appendChild(el("div", "result-points", `+${result.total}`));
      card.appendChild(factorsBars(result.factors));
    }

    root.appendChild(card);

    const next = el("button", "btn btn-primary", isLast ? "Ver resultados" : "Siguiente ronda ›");
    next.addEventListener("click", () => {
      if (isLast) {
        renderFinal();
      } else {
        state.round++;
        renderRound();
      }
    });
    root.appendChild(next);
  }

  function factorsBars(factors) {
    const labels = {
      fit: "Adecuación",
      rarity: "Rareza",
      length: "Longitud",
      speed: "Velocidad",
    };
    const wrap = el("div", "factors");
    ["fit", "rarity", "length", "speed"].forEach((k) => {
      const row = el("div", "factor-row");
      row.appendChild(el("span", "factor-name", labels[k]));
      const bar = el("div", "factor-bar");
      const f = el("div", "factor-fill");
      f.style.width = Math.round(factors[k] * 100) + "%";
      bar.appendChild(f);
      row.appendChild(bar);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderFinal() {
    root.innerHTML = "";

    const head = el("div", "final-head");
    head.appendChild(el("p", "final-label", "Partida terminada"));
    head.appendChild(el("div", "final-total", `★ ${state.total}`));
    head.appendChild(el("p", "final-sub", `en ${ROUNDS} rondas`));
    root.appendChild(head);

    const list = el("div", "final-list");
    state.results.forEach((r, i) => {
      const row = el("div", "final-row");
      row.appendChild(el("span", "final-round", `${i + 1}`));
      row.appendChild(el("span", "final-word", r.word || "—"));
      row.appendChild(el("span", "final-pts", `+${r.result.total}`));
      list.appendChild(row);
    });
    root.appendChild(list);

    const actions = el("div", "final-actions");
    const again = el("button", "btn btn-primary", "Jugar otra vez");
    again.addEventListener("click", () => start());
    const menu = el("button", "btn btn-ghost", "Menú");
    menu.dataset.go = "menu"; // lo gestiona el router de app.js
    actions.appendChild(again);
    actions.appendChild(menu);
    root.appendChild(actions);
  }

  DosLos.practice = { start };
})();
