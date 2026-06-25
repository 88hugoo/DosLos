/* ===========================================================================
   DosLos · online.js  (Bloque 5 — cliente multijugador)

   Conecta por WebSocket al servidor (server/server.js), gestiona la sala con
   código y juega rondas 1v1 sincronizadas. La puntuación la calcula el
   servidor (autoritativo) con el mismo motor que el cliente.

   Requiere abrir la web servida por el servidor (http://localhost:3000),
   no por file://. El modo "Práctica" sí funciona sin servidor.
   =========================================================================== */

(function () {
  "use strict";

  const DosLos = (window.DosLos = window.DosLos || {});
  const BLANK = "___";

  let ws = null;
  let root = null;
  let myRole = null;
  let myCode = null;
  let roundStartTime = 0;
  let answered = false;
  let myName = "Tú";
  let rivalName = "Rival";

  function playerName() {
    const n = DosLos.store ? (DosLos.store.read().name || "").trim() : "";
    return n || "Jugador";
  }
  function fx(kind, vib) {
    if (!DosLos.store) return;
    DosLos.store.sound(kind);
    if (vib != null) DosLos.store.vibrate(vib);
  }

  /* ----------------------------- helpers de UI ----------------------------- */

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }
  function phraseHTML(text, filled) {
    const slot = filled
      ? `<span class="blank filled">${escapeHTML(filled)}</span>`
      : `<span class="blank"></span>`;
    return escapeHTML(text).replace(BLANK, slot);
  }
  function factorsBars(factors) {
    const labels = { fit: "Adecuación", rarity: "Rareza", length: "Longitud", speed: "Velocidad" };
    const wrap = el("div", "factors");
    ["fit", "rarity", "length", "speed"].forEach((k) => {
      const row = el("div", "factor-row");
      row.appendChild(el("span", "factor-name", labels[k]));
      const bar = el("div", "factor-bar");
      const f = el("div", "factor-fill");
      f.style.width = Math.round((factors[k] || 0) * 100) + "%";
      bar.appendChild(f);
      row.appendChild(bar);
      wrap.appendChild(row);
    });
    return wrap;
  }
  function setRoot(...nodes) {
    root.innerHTML = "";
    nodes.forEach((n) => n && root.appendChild(n));
  }
  function info(title, sub) {
    const box = el("div", "net-info");
    box.appendChild(el("p", "net-title", title));
    if (sub) box.appendChild(el("p", "net-sub", sub));
    return box;
  }

  /* ----------------------------- conexión ----------------------------- */

  function wsURL() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}`;
  }

  function connect(onOpen) {
    if (!location.host) {
      setRoot(info("Modo online no disponible aquí", "Abre el juego desde el servidor (http://localhost:3000), no como archivo."));
      return false;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      onOpen();
      return true;
    }
    setRoot(info("Conectando…"));
    ws = new WebSocket(wsURL());
    ws.addEventListener("open", () => onOpen());
    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", () => setRoot(info("Error de conexión", "¿Está el servidor encendido?")));
    ws.addEventListener("close", () => {
      ws = null;
    });
    return true;
  }

  function send(type, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, ...payload }));
  }

  /* ----------------------------- entradas públicas ----------------------------- */

  function create() {
    root = document.getElementById("online-root");
    connect(() => send("create", { name: playerName() }));
  }

  function join() {
    root = document.getElementById("online-root");
    renderJoinForm();
  }

  function renderJoinForm(errorMsg) {
    root = document.getElementById("online-root");
    const box = el("div", "net-info");
    box.appendChild(el("p", "net-title", "Unirse a una sala"));
    const form = el("form", "join-form");
    const input = el("input", "answer-input code-input");
    input.placeholder = "CÓDIGO";
    input.maxLength = 4;
    input.autocapitalize = "characters";
    input.autocomplete = "off";
    const btn = el("button", "btn btn-primary", "Entrar");
    btn.type = "submit";
    form.appendChild(input);
    form.appendChild(btn);
    box.appendChild(form);
    if (errorMsg) box.appendChild(el("p", "net-error", errorMsg));
    setRoot(box);
    setTimeout(() => input.focus(), 60);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = input.value.trim().toUpperCase();
      if (code.length < 3) return;
      connect(() => send("join", { code, name: playerName() }));
    });
  }

  function leave() {
    send("leave", {});
    if (ws) {
      try { ws.close(); } catch {}
    }
    ws = null;
  }

  /* ----------------------------- mensajes del servidor ----------------------------- */

  function onMessage(ev) {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }

    switch (msg.type) {
      case "room":
        myRole = msg.role;
        myCode = msg.code;
        break;
      case "lobby":
        renderLobby(msg);
        break;
      case "error":
        renderJoinForm(msg.message);
        break;
      case "round":
        renderRound(msg);
        break;
      case "roundResult":
        renderResult(msg);
        break;
      case "final":
        renderFinal(msg);
        break;
      case "rivalLeft":
        setRoot(info("Tu rival salió de la sala", "Vuelve al menú e inténtalo de nuevo."), backToMenuBtn());
        break;
    }
  }

  function backToMenuBtn() {
    const b = el("button", "btn btn-ghost", "Menú");
    b.dataset.go = "menu";
    return b;
  }

  /* ----------------------------- sala (lobby) ----------------------------- */

  function renderLobby(msg) {
    myName = msg.players[msg.you] || "Tú";
    rivalName = msg.players[1 - msg.you] || "Rival";

    const box = el("div", "lobby");
    box.appendChild(el("p", "lobby-label", "Código de sala"));
    box.appendChild(el("div", "lobby-code", escapeHTML(msg.code)));
    box.appendChild(el("p", "lobby-hint", "Compártelo con tu amigo para que se una."));

    const list = el("div", "lobby-players");
    for (let i = 0; i < 2; i++) {
      const slot = el("div", "lobby-slot" + (msg.players[i] ? " ready" : ""));
      slot.appendChild(el("span", "slot-dot", ""));
      slot.appendChild(el("span", "slot-name", msg.players[i] ? escapeHTML(msg.players[i]) : "Esperando…"));
      if (i === msg.you) slot.appendChild(el("span", "slot-you", "Tú"));
      list.appendChild(slot);
    }
    box.appendChild(list);

    if (msg.isHost) {
      const start = el("button", "btn btn-primary", "Empezar partida");
      start.disabled = !msg.canStart;
      if (!msg.canStart) start.classList.add("is-disabled");
      start.addEventListener("click", () => send("start", {}));
      box.appendChild(start);
    } else {
      box.appendChild(el("p", "lobby-hint", "Esperando a que el anfitrión empiece…"));
    }

    setRoot(box);
  }

  /* ----------------------------- ronda online ----------------------------- */

  function renderRound(msg) {
    answered = false;
    roundStartTime = performance.now();
    if (msg.index === 0) fx("start");

    const top = el("div", "game-top");
    top.appendChild(el("span", "round-label", `Ronda ${msg.index + 1} / ${msg.total}`));
    top.appendChild(el("span", "score-label", `★ ${msg.scores.you} · ${msg.scores.rival}`));

    const timeWrap = el("div", "time-bar");
    const fill = el("div", "time-fill");
    timeWrap.appendChild(fill);

    const card = el("div", "phrase-card");
    const phraseEl = el("p", "phrase", phraseHTML(msg.phrase));
    card.appendChild(phraseEl);

    const form = el("form", "answer-form");
    const input = el("input", "answer-input");
    input.placeholder = "Tu palabra…";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.maxLength = 24;
    const submit = el("button", "btn btn-primary answer-submit", "Enviar");
    submit.type = "submit";
    form.appendChild(input);
    form.appendChild(submit);

    input.addEventListener("input", () => {
      phraseEl.innerHTML = phraseHTML(msg.phrase, input.value.trim());
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (answered) return;
      submitAnswer(input.value);
      input.disabled = true;
      submit.disabled = true;
      const waiting = el("p", "net-sub", "Enviado. Esperando a tu rival…");
      form.after(waiting);
    });

    setRoot(top, timeWrap, card, form);
    setTimeout(() => input.focus(), 60);

    // Temporizador local (el servidor también controla el cierre).
    runTimer(fill, msg.seconds * 1000, () => {
      if (!answered) {
        submitAnswer(input.value);
        input.disabled = true;
        submit.disabled = true;
      }
    });
  }

  let rafId = null;
  function runTimer(fillEl, total, onEnd) {
    cancelAnimationFrame(rafId);
    const t0 = performance.now();
    const bar = fillEl.parentElement;
    rafId = requestAnimationFrame(function tick(now) {
      const ratio = Math.max(0, 1 - (now - t0) / total);
      fillEl.style.width = ratio * 100 + "%";
      if (bar) bar.classList.toggle("low", ratio <= 0.2);
      if (ratio <= 0) { onEnd(); return; }
      rafId = requestAnimationFrame(tick);
    });
  }

  function submitAnswer(word) {
    if (answered) return;
    answered = true;
    cancelAnimationFrame(rafId);
    fx("submit", 20);
    const elapsedMs = performance.now() - roundStartTime;
    send("answer", { word: word.trim(), elapsedMs });
  }

  /* ----------------------------- resultado de ronda ----------------------------- */

  function renderResult(msg) {
    cancelAnimationFrame(rafId);
    const win = msg.you.total > msg.rival.total;
    const lose = msg.you.total < msg.rival.total;
    fx(win ? "win" : lose ? "lose" : "submit", win ? [40, 60, 40] : 30);

    const card = el("div", "result-card");

    const verdict = win ? "Ganas la ronda 🎉" : lose ? "Pierdes la ronda" : "Empate";
    card.appendChild(el("p", "result-verdict", verdict));

    const vs = el("div", "vs");
    vs.appendChild(vsCol(myName, msg.you, true));
    vs.appendChild(el("div", "vs-sep", "vs"));
    vs.appendChild(vsCol(rivalName, msg.rival, false));
    card.appendChild(vs);

    card.appendChild(el("p", "vs-scoreline", `Marcador: ${msg.scores.you} · ${msg.scores.rival}`));

    const next = el("button", "btn btn-primary", msg.isLast ? "Ver resultado final" : "Siguiente ronda ›");
    let clicked = false;
    next.addEventListener("click", () => {
      if (clicked) return;
      clicked = true;
      next.textContent = "Esperando al rival…";
      next.classList.add("is-disabled");
      send("ready", {});
    });

    setRoot(card, next);
  }

  function vsCol(name, data, mine) {
    const col = el("div", "vs-col" + (mine ? " mine" : ""));
    col.appendChild(el("p", "vs-name", name));
    col.appendChild(el("p", "vs-word", data.word ? escapeHTML(data.word) : "—"));
    col.appendChild(el("p", "vs-pts", `+${data.total}`));
    return col;
  }

  /* ----------------------------- final ----------------------------- */

  function renderFinal(msg) {
    fx(msg.result === "win" ? "win" : msg.result === "lose" ? "lose" : "submit",
       msg.result === "win" ? [60, 80, 60] : 40);

    const head = el("div", "final-head");
    const title =
      msg.result === "win" ? "¡Has ganado! 🏆" :
      msg.result === "lose" ? "Has perdido" : "¡Empate!";
    head.appendChild(el("p", "final-label", title));
    head.appendChild(el("div", "final-total", `${msg.scores.you} · ${msg.scores.rival}`));
    head.appendChild(el("p", "final-sub", `${escapeHTML(myName)} · ${escapeHTML(rivalName)}`));

    const actions = el("div", "final-actions");
    const menu = el("button", "btn btn-primary", "Volver al menú");
    menu.dataset.go = "menu";
    menu.addEventListener("click", () => leave());
    actions.appendChild(menu);

    setRoot(head, actions);
  }

  DosLos.online = { create, join, leave };
})();
