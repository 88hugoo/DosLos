/* ===========================================================================
   DosLos · app.js
   Router de pantallas muy simple (single-page).
   En bloques siguientes esto crecerá: estado de juego, red, etc.
   =========================================================================== */

(function () {
  "use strict";

  const screens = document.querySelectorAll(".screen");

  /** Muestra la pantalla cuyo data-screen coincide con `name`. */
  function show(name) {
    const target = document.querySelector(`.screen[data-screen="${name}"]`);
    if (!target) {
      console.warn(`[DosLos] Pantalla desconocida: "${name}"`);
      return;
    }
    screens.forEach((s) => s.classList.remove("is-active"));
    target.classList.add("is-active");

    // Recordamos en el historial para que el botón "atrás" del móvil funcione.
    if (location.hash !== `#${name}`) {
      history.pushState({ screen: name }, "", `#${name}`);
    }
  }

  // Delegación de eventos: cualquier elemento con data-go navega.
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-go]");
    if (!el) return;
    const dest = el.dataset.go;

    // Modo práctica: arranca la partida y muestra la pantalla de juego.
    if (dest === "practice") {
      show("game");
      window.DosLos.practice.start();
      return;
    }

    // Online: crear sala.
    if (dest === "create-room") {
      show("online");
      window.DosLos.online.create();
      return;
    }

    // Online: unirse con código.
    if (dest === "join-room") {
      show("online");
      window.DosLos.online.join();
      return;
    }

    show(dest);
  });

  // Pequeño feedback visual al pulsar una maqueta.
  function flash(el) {
    el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
      { duration: 180, easing: "ease" }
    );
  }

  // Botón atrás físico / del navegador.
  window.addEventListener("popstate", (e) => {
    const name = (e.state && e.state.screen) || "menu";
    const target = document.querySelector(`.screen[data-screen="${name}"]`);
    if (target) {
      screens.forEach((s) => s.classList.remove("is-active"));
      target.classList.add("is-active");
    }
  });

  /* ----------------------------- Ajustes ----------------------------- */

  function initSettings() {
    const store = window.DosLos && window.DosLos.store;
    if (!store) return;

    store.applyTheme();

    const s = store.read();
    const name = document.getElementById("set-name");
    const sound = document.getElementById("set-sound");
    const vibration = document.getElementById("set-vibration");
    const theme = document.getElementById("set-theme"); // marcado = oscuro

    if (name) {
      name.value = s.name || "";
      name.addEventListener("input", () => store.set("name", name.value.trim()));
    }
    if (sound) {
      sound.checked = s.sound;
      sound.addEventListener("change", () => {
        store.set("sound", sound.checked);
        if (sound.checked) store.sound("submit"); // confirmación audible
      });
    }
    if (vibration) {
      vibration.checked = s.vibration;
      vibration.addEventListener("change", () => {
        store.set("vibration", vibration.checked);
        if (vibration.checked) store.vibrate(30);
      });
    }
    if (theme) {
      theme.checked = s.theme !== "light";
      theme.addEventListener("change", () => {
        store.set("theme", theme.checked ? "dark" : "light");
        store.applyTheme();
      });
    }
  }

  initSettings();

  // Pantalla inicial según el hash (permite recargar en una sub-pantalla).
  const initial = location.hash.replace("#", "") || "menu";
  show(initial);
})();
