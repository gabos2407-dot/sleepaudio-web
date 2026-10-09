/* ============================================
   SLEEP AUDIO · DreamCode Studio
   Interacciones globales
   ============================================ */

(function () {
  "use strict";

  /* ---------- 1. Navbar con blur al hacer scroll ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 10) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 2. Menú móvil ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const abierto = links.classList.toggle("abierto");
      toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("abierto");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("scroll", () => {
      if (links.classList.contains("abierto")) {
        links.classList.remove("abierto");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 3. Marcar enlace activo según la URL ---------- */
  const rutaActual = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === rutaActual) a.classList.add("activo");
  });

  /* ---------- 4. Fade-in al hacer scroll ---------- */
  const elementos = document.querySelectorAll(".revelar");
  if (elementos.length && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    elementos.forEach((el) => obs.observe(el));
  } else {
    elementos.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- 5. Mockup del hero app: rotación de capturas ---------- */
  const mockupImgs = document.querySelectorAll(".mockup-marco img");
  const mockupDots = document.querySelectorAll(".mockup-dots span");
  if (mockupImgs.length > 1) {
    let actual = 0;
    const total = mockupImgs.length;
    const duracion = 2000; // ms por captura (2 segundos)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const activar = (i) => {
      mockupImgs.forEach((img, k) => img.classList.toggle("activa", k === i));
      mockupDots.forEach((dot, k) => dot.classList.toggle("activa", k === i));
      actual = i;
    };

    activar(0);

    if (!prefersReduced) {
      setInterval(() => {
        activar((actual + 1) % total);
      }, duracion);
    }
  }

  /* ---------- 6. Lightbox para capturas ---------- */
  const capturas = Array.from(document.querySelectorAll("[data-lightbox]"));
  if (capturas.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Galería de capturas");
    lb.innerHTML = `
      <span class="lightbox-contador" aria-hidden="true"></span>
      <button class="lightbox-cerrar" aria-label="Cerrar galería">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <button class="lightbox-prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="lightbox-next" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>
      <figure class="lightbox-figura">
        <img alt="">
        <figcaption></figcaption>
      </figure>
    `;
    document.body.appendChild(lb);

    const img = lb.querySelector("img");
    const cap = lb.querySelector("figcaption");
    const contador = lb.querySelector(".lightbox-contador");
    const btnCerrar = lb.querySelector(".lightbox-cerrar");
    const btnPrev = lb.querySelector(".lightbox-prev");
    const btnNext = lb.querySelector(".lightbox-next");

    let indice = 0;

    function mostrar(i) {
      indice = (i + capturas.length) % capturas.length;
      const el = capturas[indice];
      img.src = el.getAttribute("data-src") || el.querySelector("img")?.src || "";
      img.alt = el.getAttribute("data-alt") || "";
      cap.textContent = el.getAttribute("data-titulo") || "";
      contador.textContent = (indice + 1) + " / " + capturas.length;
    }

    function abrir(i) {
      mostrar(i);
      lb.classList.add("abierto");
      document.body.style.overflow = "hidden";
      btnCerrar.focus();
    }
    function cerrar() {
      lb.classList.remove("abierto");
      document.body.style.overflow = "";
    }
    function siguiente() { mostrar(indice + 1); }
    function anterior() { mostrar(indice - 1); }

    capturas.forEach((el, i) => {
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        abrir(i);
      });
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          abrir(i);
        }
      });
    });

    btnCerrar.addEventListener("click", cerrar);
    btnPrev.addEventListener("click", anterior);
    btnNext.addEventListener("click", siguiente);
    lb.addEventListener("click", (ev) => {
      if (ev.target === lb) cerrar();
    });
    document.addEventListener("keydown", (ev) => {
      if (!lb.classList.contains("abierto")) return;
      if (ev.key === "Escape") cerrar();
      else if (ev.key === "ArrowRight") siguiente();
      else if (ev.key === "ArrowLeft") anterior();
    });
  }

  /* ---------- 7. Muestras de audio del hero ---------- */
  const chips = Array.from(document.querySelectorAll(".preview-btn[data-src]"));
  if (chips.length) {
    const audio = new Audio();
    audio.preload = "none";

    const FUNDIDO = 450;      // ms que tarda el volumen en entrar o salir
    const COLA = 1.5;         // s finales en los que la muestra se apaga sola
    let activo = null;        // chip que está sonando (o cargando)
    let temporizador = null;  // intervalo del fundido en curso
    let avisoError = null;

    // Mensaje de estado (solo se ve si una muestra no carga)
    const estado = document.createElement("p");
    estado.className = "audio-preview-estado";
    estado.setAttribute("aria-live", "polite");
    const contenedor = chips[0].closest(".audio-preview");
    if (contenedor) contenedor.appendChild(estado);

    const nombreDe = (chip) => {
      const n = chip.querySelector(".sound-nombre");
      return (n ? n.textContent : chip.textContent).trim();
    };
    const etiquetar = (chip, sonando) => {
      chip.setAttribute("aria-pressed", sonando ? "true" : "false");
      chip.setAttribute("aria-label", (sonando ? "Pausar muestra: " : "Escuchar muestra: ") + nombreDe(chip));
    };

    // Cada chip recibe su mini ecualizador y su línea de progreso
    chips.forEach((chip) => {
      const ondas = document.createElement("span");
      ondas.className = "ondas";
      ondas.setAttribute("aria-hidden", "true");
      ondas.innerHTML = "<i></i><i></i><i></i>";
      const progreso = document.createElement("span");
      progreso.className = "progreso";
      progreso.setAttribute("aria-hidden", "true");
      chip.append(ondas, progreso);
      etiquetar(chip, false);
    });

    function fundir(hasta, alTerminar) {
      clearInterval(temporizador);
      const desde = audio.volume;
      const inicio = Date.now();
      temporizador = setInterval(() => {
        const k = Math.min(1, (Date.now() - inicio) / FUNDIDO);
        audio.volume = Math.min(1, Math.max(0, desde + (hasta - desde) * k));
        if (k >= 1) {
          clearInterval(temporizador);
          temporizador = null;
          if (alTerminar) alTerminar();
        }
      }, 30);
    }

    function restablecer(chip) {
      chip.classList.remove("sonando", "cargando");
      chip.style.setProperty("--progreso", "0");
      etiquetar(chip, false);
    }

    function parar(suave) {
      const chip = activo;
      if (!chip) return;
      activo = null;
      restablecer(chip);
      if (suave && !audio.paused) {
        fundir(0, () => audio.pause());
      } else {
        clearInterval(temporizador);
        temporizador = null;
        audio.pause();
      }
    }

    function fallo(chip) {
      if (activo === chip) activo = null;
      restablecer(chip);
      chip.classList.add("error");
      estado.textContent = "No se pudo cargar «" + nombreDe(chip) + "». Revisa tu conexión e inténtalo de nuevo.";
      clearTimeout(avisoError);
      avisoError = setTimeout(() => {
        chip.classList.remove("error");
        estado.textContent = "";
      }, 5000);
    }

    function reproducir(chip) {
      parar(false);
      clearInterval(temporizador);
      temporizador = null;
      clearTimeout(avisoError);
      estado.textContent = "";
      chips.forEach((c) => c.classList.remove("error"));

      activo = chip;
      chip.classList.add("cargando");
      etiquetar(chip, true);

      audio.src = chip.dataset.src;   // siempre empieza desde el principio
      audio.volume = 0;
      const promesa = audio.play();
      if (promesa && typeof promesa.catch === "function") {
        promesa.catch((err) => {
          // AbortError = se pulsó otro chip antes de que este empezara: no es un fallo
          if (activo === chip && err && err.name !== "AbortError") fallo(chip);
        });
      }
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        if (activo === chip) parar(true);
        else reproducir(chip);
      });
    });

    audio.addEventListener("playing", () => {
      if (!activo) return;
      activo.classList.remove("cargando");
      activo.classList.add("sonando");
      fundir(1);
    });

    audio.addEventListener("timeupdate", () => {
      if (!activo || !isFinite(audio.duration) || audio.duration <= 0) return;
      activo.style.setProperty("--progreso", (audio.currentTime / audio.duration).toFixed(4));
      // Apagado suave en los últimos segundos (si no hay otro fundido en marcha)
      const restante = audio.duration - audio.currentTime;
      if (temporizador === null && restante < COLA) {
        audio.volume = Math.max(0, Math.min(1, restante / COLA));
      }
    });

    audio.addEventListener("ended", () => parar(false));
    audio.addEventListener("error", () => { if (activo) fallo(activo); });
  }

  /* ---------- 8. Año dinámico en el footer ---------- */
  const anio = document.querySelector("[data-anio]");
  if (anio) anio.textContent = new Date().getFullYear();
})();