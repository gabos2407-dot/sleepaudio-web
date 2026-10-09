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
})();