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

  /* ---------- 7. Año dinámico en el footer ---------- */
  const anio = document.querySelector("[data-anio]");
  if (anio) anio.textContent = new Date().getFullYear();
})();