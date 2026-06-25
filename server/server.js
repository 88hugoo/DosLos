/* ===========================================================================
   DosLos · server.js  (Bloque 4 — servidor multijugador)

   Un solo proceso que:
     1) sirve los archivos estáticos del cliente (index.html, css, js…), y
     2) gestiona el WebSocket: salas con código y partidas 1v1 de 10 rondas.

   Reusa EXACTAMENTE el mismo motor de puntuación y banco de frases que el
   cliente (js/game/*), cargándolos como módulos isomorfos.

   Arranque:  node server/server.js     (PORT por defecto 3000)
   =========================================================================== */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

// --- Cargar el motor compartido (define globalThis.DosLos) -----------------
const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "js", "game", "content.js"));
require(path.join(ROOT, "js", "game", "scoring.js"));
const DosLos = globalThis.DosLos;
const { scoreWord } = DosLos.scoring;

// --- Config -----------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const ROUNDS = 10;
const ROUND_MS = 25000; // tiempo por ronda
const ROUND_GRACE_MS = 1500; // margen de red antes de cerrar la ronda
const RESULT_MAX_WAIT_MS = 12000; // espera máx. a que ambos pulsen "siguiente"

/* ========================= Servidor de estáticos ========================= */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const httpServer = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let rel = urlPath === "/" ? "/index.html" : urlPath;
    // Evitar salir del directorio raíz (path traversal).
    const filePath = path.normalize(path.join(ROOT, rel));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 — no encontrado");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500).end("Error");
  }
});

/* ============================ Lógica de salas ============================ */

/** @type {Map<string, Room>} code -> room */
const rooms = new Map();

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1
  let code;
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function send(ws, type, payload) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

/**
 * Estructura de sala:
 *   { code, players:[{ws,name,role}], phase, phrases, round, scores:{},
 *     answers:{}, readys:Set, timers }
 */
function createRoom(hostWs, name) {
  const code = makeCode();
  const room = {
    code,
    players: [{ ws: hostWs, name: name || "Jugador 1", role: "host" }],
    phase: "lobby",
    phrases: [],
    round: -1,
    scores: {}, // playerId -> total
    answers: {}, // playerId -> {word, elapsedMs}
    readys: new Set(),
    roundTimer: null,
    resultTimer: null,
  };
  rooms.set(code, room);
  hostWs._room = room;
  hostWs._pid = 0;
  return room;
}

function broadcastLobby(room) {
  const players = room.players.map((p) => p.name);
  room.players.forEach((p, i) => {
    send(p.ws, "lobby", {
      code: room.code,
      players,
      you: i,
      canStart: room.players.length === 2 && p.role === "host",
      isHost: p.role === "host",
    });
  });
}

function startGame(room) {
  room.phase = "playing";
  room.phrases = shuffle(DosLos.PHRASES).slice(0, ROUNDS);
  room.round = -1;
  room.scores = { 0: 0, 1: 0 };
  nextRound(room);
}

function nextRound(room) {
  room.round++;
  room.answers = {};
  room.readys = new Set();
  clearTimeout(room.resultTimer);

  if (room.round >= ROUNDS) {
    return finishGame(room);
  }

  const phrase = room.phrases[room.round];
  room.roundStart = Date.now();
  room.players.forEach((p, i) => {
    send(p.ws, "round", {
      index: room.round,
      total: ROUNDS,
      phrase: phrase.text,
      seconds: ROUND_MS / 1000,
      scores: { you: room.scores[i], rival: room.scores[1 - i] },
    });
  });

  // Cierre por tiempo si alguien no responde.
  clearTimeout(room.roundTimer);
  room.roundTimer = setTimeout(() => closeRound(room), ROUND_MS + ROUND_GRACE_MS);
}

function receiveAnswer(room, pid, word, elapsedMs) {
  if (room.phase !== "playing" || room.answers[pid]) return;
  // Acota elapsedMs a [0, ROUND_MS] por seguridad.
  const e = Math.max(0, Math.min(ROUND_MS, Number(elapsedMs) || ROUND_MS));
  room.answers[pid] = { word: String(word || "").slice(0, 24), elapsedMs: e };
  if (room.answers[0] && room.answers[1]) {
    closeRound(room);
  }
}

function closeRound(room) {
  if (room.phase !== "playing") return;
  clearTimeout(room.roundTimer);
  const phrase = room.phrases[room.round];

  // Rellena ausentes como jugada vacía con tiempo máximo.
  for (const pid of [0, 1]) {
    if (!room.answers[pid]) room.answers[pid] = { word: "", elapsedMs: ROUND_MS };
  }

  // Puntúa cada jugador usando el tiempo del rival para la "velocidad".
  const results = {};
  for (const pid of [0, 1]) {
    const me = room.answers[pid];
    const rival = room.answers[1 - pid];
    results[pid] = scoreWord({
      word: me.word,
      phrase,
      elapsedMs: me.elapsedMs,
      rivalMs: rival.elapsedMs,
    });
    room.scores[pid] += results[pid].total;
  }

  room.phase = "result";
  room.players.forEach((p, i) => {
    const meR = results[i];
    const rvR = results[1 - i];
    send(p.ws, "roundResult", {
      index: room.round,
      isLast: room.round + 1 >= ROUNDS,
      you: { word: room.answers[i].word, total: meR.total, factors: meR.factors, valid: meR.valid },
      rival: { word: room.answers[1 - i].word, total: rvR.total, factors: rvR.factors, valid: rvR.valid },
      scores: { you: room.scores[i], rival: room.scores[1 - i] },
    });
  });

  // Avanza cuando ambos pulsen "siguiente", o tras un tiempo máximo.
  clearTimeout(room.resultTimer);
  room.resultTimer = setTimeout(() => advance(room), RESULT_MAX_WAIT_MS);
}

function playerReady(room, pid) {
  if (room.phase !== "result") return;
  room.readys.add(pid);
  if (room.readys.size >= room.players.length) advance(room);
}

function advance(room) {
  if (room.phase !== "result") return;
  room.phase = "playing";
  nextRound(room);
}

function finishGame(room) {
  room.phase = "finished";
  clearTimeout(room.roundTimer);
  clearTimeout(room.resultTimer);
  room.players.forEach((p, i) => {
    const my = room.scores[i];
    const rv = room.scores[1 - i];
    send(p.ws, "final", {
      scores: { you: my, rival: rv },
      result: my > rv ? "win" : my < rv ? "lose" : "tie",
    });
  });
}

function handleLeave(ws) {
  const room = ws._room;
  if (!room) return;
  const idx = room.players.findIndex((p) => p.ws === ws);
  if (idx === -1) return;
  // Avisa al otro y cierra la sala.
  room.players.forEach((p) => {
    if (p.ws !== ws) send(p.ws, "rivalLeft", {});
  });
  clearTimeout(room.roundTimer);
  clearTimeout(room.resultTimer);
  rooms.delete(room.code);
}

/* ============================ WebSocket ============================ */

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    const room = ws._room;
    const pid = ws._pid;

    switch (msg.type) {
      case "create": {
        const r = createRoom(ws, msg.name);
        send(ws, "room", { code: r.code, role: "host" });
        broadcastLobby(r);
        break;
      }
      case "join": {
        const code = String(msg.code || "").toUpperCase().trim();
        const target = rooms.get(code);
        if (!target) return send(ws, "error", { message: "No existe esa sala." });
        if (target.players.length >= 2) return send(ws, "error", { message: "La sala está llena." });
        if (target.phase !== "lobby") return send(ws, "error", { message: "La partida ya empezó." });
        target.players.push({ ws, name: msg.name || "Jugador 2", role: "guest" });
        ws._room = target;
        ws._pid = 1;
        send(ws, "room", { code: target.code, role: "guest" });
        broadcastLobby(target);
        break;
      }
      case "start": {
        if (room && room.players[pid] && room.players[pid].role === "host" && room.players.length === 2) {
          startGame(room);
        }
        break;
      }
      case "answer": {
        if (room) receiveAnswer(room, pid, msg.word, msg.elapsedMs);
        break;
      }
      case "ready": {
        if (room) playerReady(room, pid);
        break;
      }
      case "leave": {
        handleLeave(ws);
        break;
      }
    }
  });

  ws.on("close", () => handleLeave(ws));
  ws.on("error", () => {});
});

// Keep-alive: descarta conexiones muertas.
const ping = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
wss.on("close", () => clearInterval(ping));

httpServer.listen(PORT, () => {
  console.log(`\n  🎮 DosLos en marcha`);
  console.log(`  → Local:   http://localhost:${PORT}`);
  console.log(`  (Ctrl+C para parar)\n`);
});
