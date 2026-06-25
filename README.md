# 🎮 DosLos

Duelo de palabras **1 contra 1** entre amigos, cada uno desde su dispositivo.
10 rondas: aparece una frase con un hueco y rellenas la palabra que mejor encaje.
Puntúas por **longitud**, **rareza**, **velocidad** y **adecuación**.

Web (PC + móvil) y app descargable (Android/iOS).

## Estado

🚧 En construcción por bloques. Ver [`GUIA.md`](GUIA.md) para el roadmap.

- ✅ Bloque 1 — Estructura + menú principal
- ✅ Bloque 2 — Pantalla de juego (modo práctica)
- ✅ Bloque 3 — Motor de puntuación
- ✅ Bloque 4 — Servidor multijugador (Node + WebSocket)
- ✅ Bloque 5 — Cliente online (jugable 1v1)

## Jugar

- **Práctica (tú solo):** abre `index.html` o `npx serve .`
- **1v1 online:**
  ```bash
  cd server && npm install && npm start
  ```
  Entra a http://localhost:3000 → **Jugar → Crear sala**. Detalles y cómo
  jugar con un amigo por internet: **[`JUGAR.md`](JUGAR.md)**.

## Estructura

Ver [`GUIA.md`](GUIA.md).
