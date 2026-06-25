# ▶️ Cómo jugar a DosLos

## 1. Modo práctica (sin servidor, tú solo)

Abre `index.html` con doble clic, **o** sirve la carpeta y entra en el navegador.
Pulsa **Jugar → Práctica**. Juegas 10 rondas tú solo y ves tu puntuación.

## 2. Multijugador 1v1 (con un amigo)

Necesitas levantar el servidor una vez.

### a) Instalar y arrancar el servidor

```bash
cd server
npm install      # solo la primera vez
npm start        # arranca en http://localhost:3000
```

Abre **http://localhost:3000** en el navegador (ojo: por `http://`, no abriendo
el archivo). Pulsa **Jugar → Crear sala**: te da un **código de 4 letras**.

### b) Que tu amigo se una

- **Misma casa / misma red WiFi:** dile que entre a `http://TU_IP_LOCAL:3000`
  (tu IP local, p. ej. `192.168.1.42:3000`) y use **Unirse con código**.
  Para ver tu IP en Windows: `ipconfig` (busca "Dirección IPv4").

- **Desde otra casa (por internet), rápido para probar mañana:**
  abre un túnel público con un comando (no necesita cuenta):

  ```bash
  # en otra terminal, con el servidor ya corriendo:
  npx localtunnel --port 3000
  ```

  Te dará una URL tipo `https://xxxx.loca.lt`. Compártela con tu amigo:
  ambos entráis a esa URL, uno crea sala y el otro se une con el código.
  *(La primera vez localtunnel puede pedir una "contraseña" que es tu IP
  pública; aparece en la propia página.)*

### c) Jugar

El anfitrión pulsa **Empezar partida** cuando los dos estáis en la sala.
Cada ronda: rellena el hueco lo más rápido/raro/largo/adecuado posible.
Tras cada ronda veis quién ganó y el marcador. Gana quien más puntúe en 10 rondas.

## 3. Desplegar online de forma permanente (opcional)

Para tener una URL fija sin tener tu PC encendido, sube la carpeta a un host
con Node (todos tienen plan gratis):

- **Render / Railway / Fly.io**: crea un servicio web, comando de arranque
  `node server/server.js`, y listo. El servidor sirve el cliente y el WebSocket
  en el mismo puerto (usa la variable `PORT` automáticamente).

Esto se pulirá en el **Bloque 8** junto al empaquetado para Android/iOS.
