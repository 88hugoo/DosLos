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

  // Maqueta: botones que aún no tienen pantalla propia.
  const PLACEHOLDERS = {
    "create-room": "Crear sala — disponible en el Bloque 4 (multijugador).",
    "join-room": "Unirse con código — disponible en el Bloque 4 (multijugador).",
    practice: "Modo práctica — llega en el Bloque 2.",
  };

  // Delegación de eventos: cualquier elemento con data-go navega.
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-go]");
    if (!el) return;
    const dest = el.dataset.go;

    if (PLACEHOLDERS[dest]) {
      // De momento avisamos en lugar de navegar.
      console.log(`[DosLos] ${PLACEHOLDERS[dest]}`);
      flash(el);
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

  // Pantalla inicial según el hash (permite recargar en una sub-pantalla).
  const initial = location.hash.replace("#", "") || "menu";
  show(initial);
})();
