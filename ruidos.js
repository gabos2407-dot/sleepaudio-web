/* ==========================================================
   Centro de ruidos · reproductor de cada página
   Usa RuidosMotor (ruidos-motor.js). Guarda volumen y ajustes
   en este navegador. Barra espaciadora: reproducir / pausar.
   ========================================================== */
(function () {
  "use strict";

  var rep = document.getElementById("reproductor");
  if (!rep || !window.RuidosMotor) return;
  var M = window.RuidosMotor;

  var id = rep.dataset.id;
  var nombre = rep.dataset.nombre;
  var BAJADA = 30;                       // segundos de bajada final del temporizador
  var tituloOriginal = document.title;
  var tactil = window.matchMedia && window.matchMedia("(hover: none)").matches;   /* móvil o tableta: sin teclado */

  /* ---------- Guardado en el navegador (si se puede) ---------- */
  function leer(k, def) {
    try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var guardado = leer("sa-ruido-" + id, {}) || {};
  var st = {
    id: id,
    vol: num(guardado.vol, +rep.dataset.vol),
    lvl: num(guardado.lvl, 1),
    type: num(guardado.type, 0),
    carrier: num(guardado.carrier, +(rep.dataset.carrier || 200)),
    beat: num(guardado.beat, +(rep.dataset.beat || 6))
  };
  var minutos = num(leer("sa-ruidos-temporizador", 0), 0);
  var entrada = num(leer("sa-ruidos-entrada", 0), 0);
  function num(v, def) { return typeof v === "number" && isFinite(v) ? v : def; }
  function guardarRuido() { guardar("sa-ruido-" + id, { vol: st.vol, lvl: st.lvl, type: st.type, carrier: st.carrier, beat: st.beat }); }

  /* ---------- Elementos ---------- */
  var $ = function (s) { return rep.querySelector(s); };
  var btn = $("#r-play"), estado = $("#r-estado"), cuenta = $("#r-cuenta");
  var vol = $("#r-vol"), volVal = $("#r-vol-val");

  /* Botones de un grupo (intensidad, tipo, temporizador, entrada) */
  function grupo(sel, attr, valor, alCambiar) {
    var bs = rep.querySelectorAll(sel + " button");
    function marcar(v) { bs.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset[attr] === v)); }); }
    marcar(valor);
    bs.forEach(function (b) {
      b.addEventListener("click", function () { var v = +b.dataset[attr]; marcar(v); alCambiar(v); });
    });
  }

  /* ---------- Reproducir / pausar ---------- */
  var sonando = false, fin = 0, reloj = null;

  function play() {
    M.play(st, entrada);
    sonando = true;
    if (minutos > 0) { fin = Date.now() + minutos * 60000; M.programarFin(minutos * 60, BAJADA); }
    else fin = 0;
    arrancarReloj();
    pintar();
  }
  function pausa(mensaje) {
    M.stop();
    sonando = false; fin = 0;
    clearInterval(reloj); reloj = null;
    pintar(mensaje);
  }
  function alternar() { if (sonando) pausa(); else play(); }

  function arrancarReloj() {
    clearInterval(reloj);
    reloj = setInterval(tic, 1000);
    tic();
  }
  function tic() {
    if (!sonando) return;
    if (fin) {
      var resta = Math.max(0, Math.round((fin - Date.now()) / 1000));
      cuenta.textContent = mmss(resta);
      if (resta <= 0) { pausa("Temporizador terminado. Buenas noches."); return; }
      estado.textContent = resta <= BAJADA ? "Bajando el volumen poco a poco…" : "Se apagará solo con una bajada suave.";
    }
  }
  function mmss(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (x < 10 ? "0" : "") + x;
  }

  function pintar(mensaje) {
    rep.classList.toggle("sonando", sonando);
    btn.setAttribute("aria-pressed", String(sonando));
    btn.setAttribute("aria-label", (sonando ? "Pausar " : "Reproducir ") + nombre);
    document.title = sonando ? "▶ " + nombre + " · Sleep Audio" : tituloOriginal;
    if (sonando) {
      if (!fin) { cuenta.textContent = "∞"; estado.textContent = tactil ? "Sonando sin límite." : "Sonando sin límite. Pulsa la barra espaciadora para pausar."; }
    } else {
      cuenta.textContent = minutos > 0 ? mmss(minutos * 60) : "∞";
      estado.textContent = mensaje || (tactil ? "Pulsa para escuchar." : "Pulsa para escuchar. También con la barra espaciadora.");
    }
  }

  btn.addEventListener("click", alternar);

  /* Barra espaciadora: pausa y reanuda (también tras tocar un ajuste del reproductor) */
  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space" && e.key !== " ") return;
    var t = e.target, tag = t && t.tagName;
    if (tag === "BUTTON" && (t === btn || !rep.contains(t))) return;   /* el botón de play ya responde solo */
    if (tag === "A" || tag === "TEXTAREA" || tag === "SELECT" || tag === "SUMMARY") return;
    if (tag === "INPUT" && t.type !== "range") return;
    if (t && t.isContentEditable) return;
    e.preventDefault();
    alternar();
  });

  /* ---------- Volumen ---------- */
  vol.value = st.vol; volVal.textContent = st.vol + " %";
  vol.addEventListener("input", function () {
    st.vol = +vol.value; volVal.textContent = st.vol + " %";
    M.setVolume(st.vol); guardarRuido();
  });

  /* ---------- Intensidad / tipo / binaurales ---------- */
  if ($(".r-lvl")) grupo(".r-lvl", "i", st.lvl, function (v) { st.lvl = v; M.setLevel(v); guardarRuido(); });
  if ($(".r-tipo")) grupo(".r-tipo", "t", st.type, function (v) { st.type = v; M.setType(v); guardarRuido(); });
  var car = $("#r-car"), beat = $("#r-beat");
  if (car && beat) {
    var carVal = $("#r-car-val"), beatVal = $("#r-beat-val");
    car.value = st.carrier; beat.value = st.beat;
    carVal.textContent = st.carrier + " Hz"; beatVal.textContent = String(st.beat).replace(".", ",") + " Hz";
    car.addEventListener("input", function () { st.carrier = +car.value; carVal.textContent = st.carrier + " Hz"; M.setBinaural(st.carrier, st.beat); guardarRuido(); });
    beat.addEventListener("input", function () { st.beat = +beat.value; beatVal.textContent = String(st.beat).replace(".", ",") + " Hz"; M.setBinaural(st.carrier, st.beat); guardarRuido(); });
  }

  /* ---------- Temporizador ---------- */
  grupo(".r-timer", "min", minutos, function (v) {
    minutos = v; guardar("sa-ruidos-temporizador", v);
    if (sonando) {
      if (v > 0) { fin = Date.now() + v * 60000; M.programarFin(v * 60, BAJADA); }
      else { fin = 0; M.cancelarFin(); }
      tic();
    }
    pintar();
  });

  /* ---------- Entrada gradual ---------- */
  grupo(".r-entrada", "s", entrada, function (v) { entrada = v; guardar("sa-ruidos-entrada", v); });

  /* Si el navegador congela el audio (móvil con pantalla bloqueada), al volver se ve el estado real */
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tic(); });

  pintar();
})();
