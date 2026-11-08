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
      // threshold 0: la sección aparece en cuanto asoma 80px en pantalla, mida lo que mida.
      // (Con un porcentaje, las secciones muy largas no llegaban a mostrarse en el móvil.)
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    elementos.forEach((el) => obs.observe(el));
  } else {
    elementos.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- 5. Mockup del hero app: rotación de capturas ---------- */
  const mockupMarco = document.querySelector(".mockup-marco");
  const mockupImgs = document.querySelectorAll(".mockup-marco img");
  const mockupDots = document.querySelectorAll(".mockup-dots span");
  if (mockupMarco && mockupImgs.length > 0) {
    let actual = 0;
    let timer = null;
    const total = mockupImgs.length;
    const duracion = 2500; // ms por captura
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const activar = (i) => {
      mockupImgs.forEach((img, k) => img.classList.toggle("activa", k === i));
      mockupDots.forEach((dot, k) => dot.classList.toggle("activa", k === i));
      actual = i;
    };

    const reiniciarTimer = () => {
      if (timer) clearInterval(timer);
      if (total > 1 && !prefersReduced) {
        timer = setInterval(() => {
          // mientras se ve el vídeo dentro del marco, las capturas no rotan
          if (mockupMarco.classList.contains("con-video")) return;
          activar((actual + 1) % total);
        }, duracion);
      }
    };

    // Cambiar de captura haciendo clic en los puntos
    mockupDots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        activar(idx);
        reiniciarTimer();
      });
    });

    activar(0);
    reiniciarTimer();
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

  // Los vídeos llaman a esta función para detener las muestras de audio antes de empezar
  let pararMuestras = () => {};

  /* ---------- 7. Muestras de audio: chips del hero y tarjeta reproductor ---------- */
  // Las pistas salen de los chips del hero (nombre, emoji y URL). La tarjeta
  // reproductor usa esas mismas pistas, así que solo suena una cosa a la vez.
  const chips = Array.from(document.querySelectorAll(".preview-btn[data-src]"));
  if (chips.length) {
    const audio = new Audio();
    audio.preload = "none";

    const FUNDIDO = 450;      // ms que tarda el volumen en entrar o salir
    const COLA = 1.5;         // s finales en los que la muestra se apaga sola
    let activo = null;        // chip que está sonando (o cargando)
    let indice = 0;           // pista seleccionada en la tarjeta
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
    const emojiDe = (chip) => {
      const e = chip.querySelector(".sound-emoji");
      return e ? e.textContent.trim() : "";
    };
    const etiquetar = (chip, sonando) => {
      chip.setAttribute("aria-pressed", sonando ? "true" : "false");
      chip.setAttribute("aria-label", (sonando ? "Pausar muestra: " : "Escuchar muestra: ") + nombreDe(chip));
    };
    const mmss = (s) => (isFinite(s) && s >= 0)
      ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0")
      : "–:––";

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

    // Tarjeta reproductor (si la página la tiene)
    const tarjeta = document.querySelector("[data-reproductor]");
    const pieza = (sel) => (tarjeta ? tarjeta.querySelector(sel) : null);
    const t = {
      titulo: pieza("[data-titulo]"), emoji: pieza("[data-emoji]"), cuenta: pieza("[data-cuenta]"),
      play: pieza("[data-play]"), anterior: pieza("[data-anterior]"), siguiente: pieza("[data-siguiente]"),
      actual: pieza("[data-actual]"), total: pieza("[data-total]")
    };
    const hayTarjeta = !!(tarjeta && t.titulo && t.play);

    function pintarTarjeta() {
      if (!hayTarjeta) return;
      const chip = chips[indice];
      const esLaActiva = activo === chip;
      t.titulo.textContent = nombreDe(chip);
      if (t.emoji) t.emoji.textContent = emojiDe(chip);
      if (t.cuenta && !tarjeta.classList.contains("error")) {
        t.cuenta.textContent = "Muestra " + (indice + 1) + " de " + chips.length;
      }
      tarjeta.classList.toggle("sonando", esLaActiva && chip.classList.contains("sonando"));
      tarjeta.classList.toggle("cargando", esLaActiva && chip.classList.contains("cargando"));
      t.play.setAttribute("aria-pressed", esLaActiva ? "true" : "false");
      t.play.setAttribute("aria-label", (esLaActiva ? "Pausar muestra: " : "Escuchar muestra: ") + nombreDe(chip));
      if (!esLaActiva) {
        tarjeta.style.setProperty("--progreso", "0");
        if (t.actual) t.actual.textContent = "0:00";
        if (t.total) t.total.textContent = "–:––";
      }
    }

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

    function quitarAviso() {
      clearTimeout(avisoError);
      estado.textContent = "";
      chips.forEach((c) => c.classList.remove("error"));
      if (hayTarjeta) tarjeta.classList.remove("error");
    }

    function parar(suave) {
      const chip = activo;
      if (!chip) return;
      activo = null;
      restablecer(chip);
      pintarTarjeta();
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
      pintarTarjeta();
      if (hayTarjeta) {
        tarjeta.classList.add("error");
        if (t.cuenta) t.cuenta.textContent = "No se pudo cargar la muestra";
      }
      clearTimeout(avisoError);
      avisoError = setTimeout(() => { quitarAviso(); pintarTarjeta(); }, 5000);
    }

    function reproducir(chip) {
      parar(false);
      clearInterval(temporizador);
      temporizador = null;
      quitarAviso();

      activo = chip;
      indice = chips.indexOf(chip);
      chip.classList.add("cargando");
      etiquetar(chip, true);
      pintarTarjeta();

      audio.src = chip.dataset.src;   // siempre empieza desde el principio
      audio.volume = 0;
      const promesa = audio.play();
      if (promesa && typeof promesa.catch === "function") {
        promesa.catch((err) => {
          // AbortError = se eligió otra pista antes de que esta empezara: no es un fallo
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

    if (hayTarjeta) {
      t.play.addEventListener("click", () => {
        const chip = chips[indice];
        if (activo === chip) parar(true);
        else reproducir(chip);
      });
      // Anterior / siguiente: si algo estaba sonando, sigue sonando la nueva pista
      const mover = (paso) => {
        const sonaba = activo !== null;
        indice = (indice + paso + chips.length) % chips.length;
        if (sonaba) reproducir(chips[indice]);
        else { quitarAviso(); pintarTarjeta(); }
      };
      if (t.anterior) t.anterior.addEventListener("click", () => mover(-1));
      if (t.siguiente) t.siguiente.addEventListener("click", () => mover(1));
      pintarTarjeta();
    }

    audio.addEventListener("playing", () => {
      if (!activo) return;
      activo.classList.remove("cargando");
      activo.classList.add("sonando");
      pintarTarjeta();
      fundir(1);
    });

    audio.addEventListener("timeupdate", () => {
      if (!activo || !isFinite(audio.duration) || audio.duration <= 0) return;
      const avance = (audio.currentTime / audio.duration).toFixed(4);
      activo.style.setProperty("--progreso", avance);
      if (hayTarjeta) {
        tarjeta.style.setProperty("--progreso", avance);
        if (t.actual) t.actual.textContent = mmss(audio.currentTime);
        if (t.total) t.total.textContent = mmss(audio.duration);
      }
      // Apagado suave en los últimos segundos (si no hay otro fundido en marcha)
      const restante = audio.duration - audio.currentTime;
      if (temporizador === null && restante < COLA) {
        audio.volume = Math.max(0, Math.min(1, restante / COLA));
      }
    });

    audio.addEventListener("ended", () => parar(false));
    audio.addEventListener("error", () => { if (activo) fallo(activo); });

    pararMuestras = () => parar(false);
  }

  /* ---------- 8. Vídeo de YouTube (no se carga nada hasta que se pulsa) ---------- */
  // Usa el dominio de privacidad de YouTube. El vídeo necesita que la página
  // se abra por http/https (Live Server o publicada), no con doble clic.
  const crearIframeVideo = (id, titulo) => {
    const marcoVideo = document.createElement("iframe");
    marcoVideo.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) +
      "?autoplay=1&rel=0&playsinline=1";
    marcoVideo.title = titulo;
    marcoVideo.allow = "autoplay; encrypted-media; picture-in-picture";
    marcoVideo.allowFullscreen = true;
    marcoVideo.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    return marcoVideo;
  };

  // 8a. Vídeo dentro del marco de móvil (página Sleep Audio)
  document.querySelectorAll("[data-video-inline]").forEach((boton) => {
    const marco = boton.closest(".mockup-marco");
    if (!marco) return;
    const zona = boton.closest(".hero-figura") || marco.parentElement;
    const cerrar = zona.querySelector("[data-video-cerrar]");

    boton.addEventListener("click", () => {
      pararMuestras();
      marco.appendChild(crearIframeVideo(boton.dataset.videoInline, "Vídeo de Sleep Audio"));
      marco.classList.add("con-video");
      zona.classList.add("viendo-video");
      if (cerrar) { cerrar.hidden = false; cerrar.focus(); }
    });

    if (cerrar) {
      cerrar.addEventListener("click", () => {
        const marcoVideo = marco.querySelector("iframe");
        if (marcoVideo) marcoVideo.remove();   // quitarlo detiene el vídeo
        marco.classList.remove("con-video");
        zona.classList.remove("viendo-video");
        cerrar.hidden = true;
        boton.focus();
      });
    }
  });

  // 8b. Vídeo en una ventana sobre la página (botón "Ver vídeo" del inicio)
  const lanzadoresVideo = Array.from(document.querySelectorAll("[data-video-modal]"));
  if (lanzadoresVideo.length) {
    const modal = document.createElement("div");
    modal.className = "video-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Vídeo de Sleep Audio");
    modal.innerHTML = `
      <button type="button" class="video-cerrar" aria-label="Cerrar vídeo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="video-marco"></div>
    `;
    document.body.appendChild(modal);

    const marcoModal = modal.querySelector(".video-marco");
    const cerrarModal = modal.querySelector(".video-cerrar");
    let origen = null;

    const cerrarVideo = () => {
      if (!modal.classList.contains("abierto")) return;
      modal.classList.remove("abierto");
      marcoModal.innerHTML = "";               // quitarlo detiene el vídeo
      document.body.style.overflow = "";
      if (origen) origen.focus();
    };

    lanzadoresVideo.forEach((boton) => {
      boton.addEventListener("click", () => {
        origen = boton;
        pararMuestras();
        marcoModal.innerHTML = "";
        marcoModal.appendChild(crearIframeVideo(boton.dataset.videoModal, "Vídeo de Sleep Audio"));
        modal.classList.add("abierto");
        document.body.style.overflow = "hidden";
        cerrarModal.focus();
      });
    });

    cerrarModal.addEventListener("click", cerrarVideo);
    modal.addEventListener("click", (ev) => { if (ev.target === modal) cerrarVideo(); });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") cerrarVideo(); });
  }

  /* ---------- 9. Copiar al portapapeles (lo usan "Compartir" y "Copiar correo") ---------- */
  const copiarAlPortapapeles = async (texto) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        return true;
      }
    } catch (e) { /* se intenta el método de respaldo */ }
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    campo.remove();
    return ok;
  };

  // Cambia el texto del botón unos segundos para confirmar la acción
  const avisoEnBoton = (boton, selectorTexto) => {
    const texto = boton.querySelector(selectorTexto) || boton;
    const original = texto.textContent;
    let reloj = null;
    return (mensaje) => {
      texto.textContent = mensaje;
      boton.classList.add("hecho");
      clearTimeout(reloj);
      reloj = setTimeout(() => {
        texto.textContent = original;
        boton.classList.remove("hecho");
      }, 2500);
    };
  };

  /* ---------- 10. Botón "Compartir" ---------- */
  // En móvil abre el menú de compartir del teléfono; en ordenador copia el enlace.
  document.querySelectorAll("[data-compartir]").forEach((boton) => {
    const avisar = avisoEnBoton(boton, "[data-compartir-texto]");
    const enlace = () => window.location.href.split("#")[0];

    boton.addEventListener("click", async () => {
      const tactil = window.matchMedia("(pointer: coarse)").matches;
      if (tactil && navigator.share) {
        const descripcion = document.querySelector('meta[name="description"]');
        try {
          await navigator.share({
            title: document.title,
            text: descripcion ? descripcion.content : "",
            url: enlace()
          });
          return;
        } catch (e) {
          if (e && e.name === "AbortError") return;   // el usuario cerró el menú
        }
      }
      avisar((await copiarAlPortapapeles(enlace())) ? "Enlace copiado" : "No se pudo copiar");
    });
  });

  /* ---------- 11. Botón "Copiar correo" ---------- */
  document.querySelectorAll("[data-copiar]").forEach((boton) => {
    const avisar = avisoEnBoton(boton, "[data-copiar-texto]");
    boton.addEventListener("click", async () => {
      avisar((await copiarAlPortapapeles(boton.dataset.copiar)) ? "Correo copiado" : "No se pudo copiar");
    });
  });

  /* ---------- 12. Año dinámico en el footer ---------- */
  const anio = document.querySelector("[data-anio]");
  if (anio) anio.textContent = new Date().getFullYear();

  /* ---------- 13. Visitas que llegan desde la app (?desde=app) ---------- */
  // Quien ya tiene Sleep Audio no necesita el botón de descarga:
  // se ocultan los bloques [data-solo-web] y se muestran los [data-solo-app].
  if (new URLSearchParams(window.location.search).get("desde") === "app") {
    document.documentElement.classList.add("desde-app");
    document.querySelectorAll("[data-solo-web]").forEach((el) => { el.hidden = true; el.style.display = "none"; });
    document.querySelectorAll("[data-solo-app]").forEach((el) => { el.hidden = false; });
  }
  /* ---------- 14. Lucero: si la tocas, da un saltito y celebra ---------- */
  document.querySelectorAll("[data-lucero]").forEach((el) => {
    const img = el.querySelector("img");
    if (!img) return;
    const original = img.getAttribute("src");
    const celebra = original.replace(/lucero[^/]*\.webp$/, "lucero-celebra.webp");
    let espera = null;
    el.addEventListener("click", () => {
      el.classList.remove("salta");
      void el.offsetWidth;                // reinicia la animación si se toca seguido
      el.classList.add("salta");
      img.src = celebra;
      clearTimeout(espera);
      espera = setTimeout(() => { img.src = original; el.classList.remove("salta"); }, 1400);
    });
  });
  /* ---------- 15. Reproductor del inicio: escena "Noche en la cabaña" ---------- */
  // Igual que en la app: en pausa la escena queda quieta; al sonar una muestra cobra vida
  // (humo, lluvia, luciérnagas y estrellas). Se dibuja en un espacio fijo de 568×464
  // y se escala para llenar el recuadro sin deformarse.
  const lienzo = document.querySelector("[data-escena-cabana]");
  const tarjetaEscena = document.querySelector("[data-reproductor]");
  if (lienzo && lienzo.getContext) {
    const x = lienzo.getContext("2d");
    const W = 568, H = 464, TAU = Math.PI * 2;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const azar = Math.random;

    const estrellas = [], lluvia = [], luciernagas = [];
    let humo = [];
    for (let i = 0; i < 110; i++) estrellas.push({ x: azar() * W, y: azar() * H * 0.6, r: azar() * 1.8 + 0.4, p: azar() * TAU });
    for (let i = 0; i < 120; i++) lluvia.push({ x: azar() * W, y: azar() * H, s: 6 + azar() * 6 });
    for (let i = 0; i < 14; i++) luciernagas.push({ x: azar() * W, y: H * 0.62 + azar() * H * 0.3, p: azar() * TAU });

    const cx = 290, cy = 386;   // posición de la cabaña

    function poligono(puntos, color) {
      x.fillStyle = color; x.beginPath(); x.moveTo(puntos[0][0], puntos[0][1]);
      for (let k = 1; k < puntos.length; k++) x.lineTo(puntos[k][0], puntos[k][1]);
      x.closePath(); x.fill();
    }
    function pino(px, py, s, color) {
      x.fillStyle = color;
      for (let k = 0; k < 4; k++) {
        x.beginPath();
        x.moveTo(px, py - s * (1.2 + k * 0.55));
        x.lineTo(px - s * (0.55 + k * 0.12), py - s * k * 0.55);
        x.lineTo(px + s * (0.55 + k * 0.12), py - s * k * 0.55);
        x.closePath(); x.fill();
      }
      x.fillRect(px - s * 0.06, py, s * 0.12, s * 0.25);
    }
    function niebla(y, t, alfa) {
      const g = x.createLinearGradient(0, y, 0, y + 80);
      g.addColorStop(0, "rgba(180,190,255,0)");
      g.addColorStop(0.5, "rgba(180,190,255," + alfa + ")");
      g.addColorStop(1, "rgba(180,190,255,0)");
      x.fillStyle = g; x.fillRect((t / 60) % 80 - 80, y, W + 160, 80);
    }
    function brillo(gx, gy, radio, alfa) {
      const g = x.createRadialGradient(gx, gy, 2, gx, gy, radio);
      g.addColorStop(0, "rgba(255,170,70," + alfa + ")");
      g.addColorStop(1, "rgba(255,170,70,0)");
      x.fillStyle = g; x.fillRect(gx - radio, gy - radio, radio * 2, radio * 2);
    }
    // El humo nace sobre la chimenea, sube, se ensancha y se desvanece
    function moverHumo() {
      if (azar() < 0.12) humo.push({ x: cx + 46, y: cy - 126, a: 0.35, r: 5 });
      humo.forEach((s) => { s.y -= 0.5; s.x += 0.25; s.r += 0.06; s.a -= 0.002; });
      humo = humo.filter((s) => s.a > 0);
    }
    for (let i = 0; i < 260; i++) moverHumo();   // para que en pausa ya se vea la columna de humo

    function dibujar(t, vivo) {
      const parpadeo = vivo ? 0.82 + 0.18 * Math.sin(t / 130) * Math.sin(t / 77) : 0.9;

      const cielo = x.createLinearGradient(0, 0, 0, H);
      cielo.addColorStop(0, "#101329"); cielo.addColorStop(0.5, "#292454"); cielo.addColorStop(1, "#5a3b6e");
      x.fillStyle = cielo; x.fillRect(0, 0, W, H);

      estrellas.forEach((s) => {
        x.globalAlpha = 0.25 + 0.24 * Math.sin(t / 900 + s.p);
        x.fillStyle = "#fff"; x.beginPath(); x.arc(s.x, s.y, s.r, 0, TAU); x.fill();
      });
      x.globalAlpha = 1;

      // Luna creciente
      x.fillStyle = "#f3f1ff"; x.beginPath(); x.arc(450, 92, 24, 0, TAU); x.fill();
      x.fillStyle = "#1d1b4d"; x.beginPath(); x.arc(460, 86, 22, 0, TAU); x.fill();

      // Montañas, niebla y colina
      poligono([[0,300],[90,210],[160,270],[250,170],[340,260],[430,200],[568,290],[568,464],[0,464]], "#232063");
      poligono([[0,340],[120,262],[210,318],[320,240],[430,320],[568,270],[568,464],[0,464]], "#1a1a52");
      niebla(300, t, 0.16);
      poligono([[0,380],[140,350],[300,372],[460,346],[568,368],[568,464],[0,464]], "#111437");

      // Pinos
      pino(40, 392, 46, "#0b0d26"); pino(96, 404, 34, "#0c0e29");
      pino(520, 396, 50, "#0b0d26"); pino(470, 410, 34, "#0c0e29");

      // Cabaña: muros, tejado y chimenea
      x.fillStyle = "#0f1030"; x.fillRect(cx - 70, cy - 64, 140, 64);
      poligono([[cx - 90, cy - 62], [cx, cy - 128], [cx + 90, cy - 62]], "#07081c");
      x.fillStyle = "#0a0b22"; x.fillRect(cx + 38, cy - 124, 16, 34);

      // Ventanas y puerta encendidas (parpadean con el fuego)
      const alfaVentana = 0.55 + 0.45 * parpadeo;
      [[cx - 50, cy - 44, 26, 24], [cx + 22, cy - 44, 26, 24]].forEach((v) => {
        x.fillStyle = "rgba(255,176,80," + alfaVentana + ")"; x.fillRect(v[0], v[1], v[2], v[3]);
        brillo(v[0] + 13, v[1] + 12, 60, 0.35 * parpadeo);
      });
      x.fillStyle = "rgba(255,196,110,.9)";
      x.fillRect(cx - 10, cy - 34, 20, 34);

      // Humo
      if (vivo) moverHumo();
      humo.forEach((s) => {
        x.fillStyle = "rgba(210,215,255," + Math.max(0, s.a) + ")";
        x.beginPath(); x.arc(s.x, s.y, s.r, 0, TAU); x.fill();
      });

      // Luciérnagas
      luciernagas.forEach((p) => {
        const a = 0.4 + 0.6 * Math.sin(t / 500 + p.p);
        x.fillStyle = "rgba(255,236,150," + Math.max(0, a) + ")";
        x.beginPath();
        x.arc(p.x + Math.sin(t / 1500 + p.p) * 14, p.y + Math.cos(t / 1900 + p.p) * 8, 2.4, 0, TAU);
        x.fill();
      });

      // Lluvia (en pausa, las gotas se quedan quietas)
      x.strokeStyle = "rgba(170,190,255,.45)"; x.lineWidth = 1.4; x.beginPath();
      lluvia.forEach((r) => {
        if (vivo) {
          r.y += r.s; r.x -= 1.2;
          if (r.y > H) { r.y = -10; r.x = azar() * W + 40; }
        }
        x.moveTo(r.x, r.y); x.lineTo(r.x - 3, r.y + 14);
      });
      x.stroke();
    }

    // Ajusta el lienzo al recuadro (nítido en pantallas de alta densidad) y centra la escena
    let ultimoT = 0;
    function ajustar() {
      const caja = lienzo.getBoundingClientRect();
      if (!caja.width || !caja.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      lienzo.width = Math.round(caja.width * dpr);
      lienzo.height = Math.round(caja.height * dpr);
      const escala = Math.max(lienzo.width / W, lienzo.height / H);
      x.setTransform(escala, 0, 0, escala, (lienzo.width - W * escala) / 2, (lienzo.height - H * escala) / 2);
      dibujar(ultimoT, false);
    }

    let enPantalla = true, cuadro = null;
    const sonando = () => !!(tarjetaEscena && tarjetaEscena.classList.contains("sonando"));
    function bucle(t) {
      ultimoT = t;
      dibujar(t, true);
      cuadro = requestAnimationFrame(bucle);
    }
    function actualizar() {
      const animar = sonando() && enPantalla && !reducir && !document.hidden;
      if (animar && cuadro === null) cuadro = requestAnimationFrame(bucle);
      if (!animar && cuadro !== null) { cancelAnimationFrame(cuadro); cuadro = null; dibujar(ultimoT, false); }
    }

    ajustar();
    window.addEventListener("resize", ajustar);
    if (tarjetaEscena) {
      new MutationObserver(actualizar).observe(tarjetaEscena, { attributes: true, attributeFilter: ["class"] });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entradas) => {
        enPantalla = entradas[0].isIntersecting;
        if (enPantalla) ajustar();
        actualizar();
      }).observe(lienzo);
    }
    document.addEventListener("visibilitychange", actualizar);
  }

})();