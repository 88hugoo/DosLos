# 🎮 DosLos — Guía de desarrollo

Juego 1v1 entre amigos. Cada uno desde su dispositivo. 10 rondas. En cada ronda
aparece la **misma frase** con un **hueco**, y cada jugador rellena el hueco con
una palabra. La puntuación de la ronda depende de:

- **Longitud** de la palabra
- **Rareza** de la palabra (cuanto menos común, más puntos)
- **Velocidad** al escribirla (comparada con el rival)
- **Adecuación** de la palabra con la frase

Plataformas: **web** (PC + móvil) y **app descargable** (Android/iOS vía Capacitor).

---

## 🧱 Roadmap por bloques

Vamos por bloques pequeños para iterar contigo y no gastar tokens de golpe.
Marca ✅ cuando un bloque esté cerrado.

- [x] **Bloque 1 — Estructura + Menú principal**
      Carpetas del proyecto, menú principal minimalista, navegación entre
      pantallas (Jugar, Amigos, Configuración, Créditos).

- [x] **Bloque 2 — Pantalla de juego (modo práctica/local)**
      UI de ronda: frase con hueco, input de palabra, temporizador, contador de
      rondas. Jugable en local sin red para validar la sensación.

- [x] **Bloque 3 — Motor de puntuación**
      Cálculo de puntos: longitud + rareza + velocidad + adecuación.
      Banco de frases y listas de frecuencia en español.

- [x] **Bloque 4 — Servidor multijugador**
      Node + WebSocket. Salas con código de 4 letras. Sincronización de
      rondas y estado entre los dos jugadores. Reusa el motor del cliente.

- [x] **Bloque 5 — Cliente online**
      Conectar el cliente al servidor: crear/unirse a sala, jugar 1v1 real,
      ver la palabra y puntuación del rival ronda a ronda. *(jugable ya)*

- [~] **Bloque 6 — Amigos, Configuración y Créditos completos**
      ✅ Configuración funcional (nombre de jugador, sonido, vibración, tema
      claro/oscuro, persistido en el dispositivo). Pendiente: lista de amigos.

- [~] **Bloque 7 — Pulido visual**
      ✅ Efectos de sonido (WebAudio), vibración, aviso de tiempo (barra roja),
      récord en práctica, nombres reales en el "versus". Pendiente: más
      animaciones y transiciones.

- [ ] **Bloque 8 — Empaquetado y deploy**
      Deploy web (Netlify/Vercel/Pages) + Capacitor para Android/iOS.

- [ ] **Bloque 9 — Contenido**
      Ampliar banco de frases/palabras, balanceo de puntuación, idiomas.

- [ ] **Bloque 10 — Testing y lanzamiento**
      Pruebas con usuarios, ajustes finales, publicación en tiendas.

---

## 🗂️ Estructura de carpetas

```
DosLos/
├── index.html          # Punto de entrada (single-page con pantallas)
├── css/
│   └── styles.css      # Estilos globales (tema oscuro minimalista)
├── js/
│   ├── app.js          # Router de pantallas
│   └── game/
│       ├── content.js  # Banco de frases + frecuencias (isomorfo)
│       ├── scoring.js  # Motor de puntuación (isomorfo cliente/servidor)
│       ├── game.js     # Partida modo práctica (local)
│       └── online.js   # Cliente multijugador (WebSocket)
├── server/
│   ├── server.js       # Servidor web + WebSocket (salas, rondas)
│   └── package.json
├── assets/             # Imágenes, iconos, sonidos
├── GUIA.md             # Esta guía
├── JUGAR.md            # Cómo jugar / desplegar
└── README.md
```

## ▶️ Cómo probarlo

- **Práctica (tú solo):** abre `index.html` o sirve la carpeta (`npx serve .`).
- **Multijugador 1v1:** levanta el servidor y conéctate. Ver **[`JUGAR.md`](JUGAR.md)**.
