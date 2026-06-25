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
      pantallas (Jugar, Amigos, Configuración, Créditos). *(este bloque)*

- [ ] **Bloque 2 — Pantalla de juego (modo práctica/local)**
      UI de ronda: frase con hueco, input de palabra, temporizador, contador de
      rondas. Jugable en local sin red para validar la sensación.

- [ ] **Bloque 3 — Motor de puntuación**
      Cálculo de puntos: longitud + rareza + velocidad + adecuación.
      Banco de frases y diccionario de frecuencias en español.

- [ ] **Bloque 4 — Servidor multijugador**
      Node + WebSocket. Salas con código de 4-6 dígitos. Sincronización de
      rondas y estado entre los dos jugadores.

- [ ] **Bloque 5 — Cliente online**
      Conectar el cliente al servidor: crear/unirse a sala, jugar 1v1 real,
      ver puntuación del rival ronda a ronda.

- [ ] **Bloque 6 — Amigos, Configuración y Créditos completos**
      Lista de amigos, ajustes (sonido, vibración, tema, idioma), créditos.

- [ ] **Bloque 7 — Pulido visual**
      Animaciones, transiciones, feedback de sonido, micro-interacciones.

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
│   ├── app.js          # Arranque y router de pantallas
│   └── screens/        # Lógica por pantalla (se irá llenando)
├── assets/             # Imágenes, iconos, sonidos
├── GUIA.md             # Esta guía
└── README.md
```

## ▶️ Cómo probarlo en local

Abre `index.html` directamente en el navegador, o sirve la carpeta:

```bash
npx serve .
# o
python -m http.server 8000
```

Luego entra en http://localhost:8000
