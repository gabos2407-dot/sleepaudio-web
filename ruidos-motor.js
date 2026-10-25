/* ==========================================================
   Motor de ruidos de Sleep Audio (Web Audio API)
   Genera los 16 ruidos en el navegador, en tiempo real.
   Basado en la maqueta de la app. Un solo ruido a la vez.
   Uso: RuidosMotor.play(id, estado, entradaSeg) · stop() ·
        setVolume(v) · setLevel(n) · setType(t) · setBinaural(c, b) ·
        programarFin(seg, bajada) · cancelarFin() · isPlaying()
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Parámetros de cada ruido (iguales a la maqueta) ---------- */
  var CUT = [1200, 3500, 12000];                 // blanco/rosa/marrón: corte según intensidad
  var RAIN_CUT = [2500, 4500, 7000];
  var GAP = [[22000, 40000], [11000, 24000], [6000, 13000]];   // pausa entre truenos
  var FAN = { cut: [800, 1900, 4800], res: [240, 520, 1050], amp: [0.8, 1.3, 1.9], hum: [48, 86, 140], blade: [1.8, 4.4, 8.5] };
  var ACP = [
    { cut: [1100, 2000, 3200], res: [420, 650, 900], amp: [0.9, 1.35, 1.9], hum: [56, 60, 64], hg: 0.08 },
    { cut: [700, 1300, 2200], res: [130, 200, 300], amp: [0.9, 1.4, 2.0], hum: [40, 46, 52], hg: 0.03 }
  ];
  var WAVE = { cut: [900, 1800, 3200], rate: [0.07, 0.11, 0.17], depth: [0.3, 0.4, 0.5] };
  var DRONE = { base: [41.2, 55, 73.4], ratio: [1, 1.5, 2, 3, 1], gain: [0.22, 0.12, 0.1, 0.05, 0.15] };
  var GRN = [380, 500, 650], GREY = [3500, 7000, 16000], BLUE = [4500, 9000, 18000];
  var BOX = { cut: [1300, 2200, 3500], amp: [0.9, 1.35, 1.9] };
  var CAB = { cut: [420, 650, 1000], amp: [0.9, 1.3, 1.8] };
  var BOWL = { gap: [[20000, 30000], [12000, 20000], [7000, 12000]] };
  /* Tren nocturno: segundos entre pares de golpes de rueda, corte del rumor y fuerza del traqueteo */
  var TRAIN = { period: [1.7, 1.15, 0.8], cut: [170, 230, 320], rattle: [0.05, 0.08, 0.12], hit: [0.55, 0.7, 0.85] };

  var ctx = null, master = null, buffers = {}, voz = null, n = null;

  function contexto() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* Volumen percibido: curva cuadrática como en la app */
  function g(st) { return Math.pow(st.vol / 100, 2); }

  /* ---------- Generador de ruido en búfer (20 s, sin cortes al repetir) ---------- */
  function gen(type) {
    var sr = ctx.sampleRate, len = sr * 20, x = sr * 2, b = ctx.createBuffer(2, len - x, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = new Float32Array(len), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0, prev = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1, v;
        if (type === "white") v = w * 0.5;
        else if (type === "blue") { v = (w - prev) * 0.35; prev = w; }
        else if (type === "pink") {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          v = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { last = (last + 0.02 * w) / 1.02; v = last * 3.5; }
        d[i] = v;
      }
      for (var j = 0; j < x; j++) { var t = j / x * Math.PI / 2; d[j] = d[j] * Math.sin(t) + d[len - x + j] * Math.cos(t); }
      b.copyToChannel(d.subarray(0, len - x), ch);
    }
    return b;
  }
  function loopSrc(key, type) {
    if (!buffers[key]) buffers[key] = gen(type);
    var s = ctx.createBufferSource(); s.buffer = buffers[key]; s.loop = true; return s;
  }
  function fade(st, t) {
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(0, ctx.currentTime);
    gn.gain.linearRampToValueAtTime(g(st), ctx.currentTime + t);
    gn.connect(master);
    return gn;
  }

  /* ---------- Ruidos de búfer: blanco, rosa, marrón, lluvia, ventilador, aire ---------- */
  function startBuffer(st, fin) {
    var id = st.id, rain = (id === "rain" || id === "rain1"), fan = id === "fan", ac = id === "ac";
    var s = loopSrc(id === "white" ? "white" : id === "pink" ? "pink" : id === "brown" ? "brown" : rain ? "white" : "pink",
                    id === "white" || rain ? "white" : id === "brown" ? "brown" : "pink");
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = rain ? RAIN_CUT[st.lvl] : CUT[st.lvl];
    var gn = fade(st, fin);
    var o = { s: s, f: f, g: gn, x: [] }, am, rs, rs3, am3, P;
    if (rain) {
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 700;
      var pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 3000; pk.Q.value = 0.6; pk.gain.value = 4;
      s.connect(hp); hp.connect(pk); pk.connect(f);
      o.upd = function () { f.frequency.setTargetAtTime(RAIN_CUT[st.lvl], ctx.currentTime, 0.08); };
    } else if (fan) {
      var hp2 = ctx.createBiquadFilter(); hp2.type = "highpass"; hp2.frequency.value = 180;
      am = ctx.createGain(); am.gain.value = FAN.amp[st.lvl];
      rs = ctx.createBiquadFilter(); rs.type = "peaking"; rs.Q.value = 1.3; rs.gain.value = 10; rs.frequency.value = FAN.res[st.lvl];
      s.connect(hp2); hp2.connect(rs); rs.connect(am); am.connect(f);
      f.frequency.value = FAN.cut[st.lvl];
    } else if (ac) {
      P = ACP[st.type || 0];
      var hp3 = ctx.createBiquadFilter(); hp3.type = "highpass"; hp3.frequency.value = st.type ? 60 : 150;
      rs3 = ctx.createBiquadFilter(); rs3.type = "peaking"; rs3.Q.value = 1.0; rs3.gain.value = 9; rs3.frequency.value = P.res[st.lvl];
      am3 = ctx.createGain(); am3.gain.value = P.amp[st.lvl];
      s.connect(hp3); hp3.connect(rs3); rs3.connect(am3); am3.connect(f);
      f.frequency.value = P.cut[st.lvl];
      if (st.type) {
        var ah = ctx.createBiquadFilter(); ah.type = "highpass"; ah.frequency.value = 3500;
        var ag = ctx.createGain(); ag.gain.value = 0.16; s.connect(ah); ah.connect(ag); ag.connect(gn);
      }
    } else {
      s.connect(f);
      o.upd = function () { f.frequency.setTargetAtTime(CUT[st.lvl], ctx.currentTime, 0.08); };
    }
    f.connect(gn); s.start();

    if (ac) {
      var h1 = ctx.createOscillator(), hg1 = ctx.createGain();
      h1.type = st.type ? "sine" : "triangle"; h1.frequency.value = P.hum[st.lvl]; hg1.gain.value = P.hg;
      h1.connect(hg1); hg1.connect(gn); h1.start(); o.x = [h1];
      if (!st.type) {
        var h2 = ctx.createOscillator(), hg2 = ctx.createGain(); h2.frequency.value = P.hum[st.lvl] * 2; hg2.gain.value = 0.03;
        h2.connect(hg2); hg2.connect(gn); h2.start();
        var vl = ctx.createOscillator(), vg = ctx.createGain(); vl.frequency.value = 9; vg.gain.value = 0.05;
        vl.connect(vg); vg.connect(am3.gain); vl.start(); o.x.push(h2, vl);
      }
      o.upd = function () {
        var t = ctx.currentTime;
        f.frequency.setTargetAtTime(P.cut[st.lvl], t, 0.5);
        rs3.frequency.setTargetAtTime(P.res[st.lvl], t, 0.5);
        am3.gain.setTargetAtTime(P.amp[st.lvl], t, 0.5);
        h1.frequency.setTargetAtTime(P.hum[st.lvl], t, 0.6);
      };
    }
    if (fan) {
      var hum = ctx.createOscillator(), hg = ctx.createGain(); hum.type = "triangle"; hum.frequency.value = FAN.hum[st.lvl]; hg.gain.value = 0.07;
      hum.connect(hg); hg.connect(gn); hum.start();
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = FAN.blade[st.lvl]; lg.gain.value = 0.07;
      lfo.connect(lg); lg.connect(am.gain); lfo.start();
      o.x = [hum, lfo];
      o.upd = function () {
        var t = ctx.currentTime;
        f.frequency.setTargetAtTime(FAN.cut[st.lvl], t, 0.5);
        rs.frequency.setTargetAtTime(FAN.res[st.lvl], t, 0.5);
        am.gain.setTargetAtTime(FAN.amp[st.lvl], t, 0.5);
        hum.frequency.setTargetAtTime(FAN.hum[st.lvl], t, 0.6);
        lfo.frequency.setTargetAtTime(FAN.blade[st.lvl], t, 0.6);
      };
    }
    if (id === "rain") { o.th = setTimeout(function () { thunderLoop(st, o); }, 2500 + Math.random() * 3000); }
    return o;
  }

  function thunderLoop(st, o) {
    if (voz !== o) return;
    thunder(o);
    var r = GAP[st.lvl];
    o.th = setTimeout(function () { thunderLoop(st, o); }, r[0] + Math.random() * (r[1] - r[0]));
  }
  function thunder(o) {
    if (!buffers._th) buffers._th = gen("brown");
    var t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = buffers._th;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 110 + Math.random() * 140;
    var e = ctx.createGain(), P = 2.2 + Math.random() * 1.2, rise = 0.5 + Math.random() * 0.9;
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(P, t + rise);
    e.gain.linearRampToValueAtTime(P * 0.3, t + rise + 1.0);
    e.gain.linearRampToValueAtTime(P * 0.75, t + rise + 1.7);
    e.gain.linearRampToValueAtTime(P * 0.2, t + rise + 3.2);
    e.gain.linearRampToValueAtTime(0, t + rise + 6.5);
    s.connect(lp); lp.connect(e); e.connect(o.g);
    s.start(t, Math.random() * 6, 10);
  }

  /* ---------- Olas ---------- */
  function startWave(st, fin) {
    var s = loopSrc("pink", "pink");
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = WAVE.cut[st.lvl];
    var sw = ctx.createGain(); sw.gain.value = 0.6;
    var gn = fade(st, fin);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(), fg = ctx.createGain();
    lfo.frequency.value = WAVE.rate[st.lvl]; lg.gain.value = WAVE.depth[st.lvl]; fg.gain.value = 700;
    lfo.connect(lg); lg.connect(sw.gain); lfo.connect(fg); fg.connect(f.frequency);
    s.connect(f); f.connect(sw); sw.connect(gn); s.start(); lfo.start();
    return { s: s, f: f, g: gn, x: [lfo], upd: function () {
      var t = ctx.currentTime;
      f.frequency.setTargetAtTime(WAVE.cut[st.lvl], t, 0.6); lfo.frequency.setTargetAtTime(WAVE.rate[st.lvl], t, 0.6); lg.gain.setTargetAtTime(WAVE.depth[st.lvl], t, 0.6);
    } };
  }

  /* ---------- Ruido verde, gris y azul ---------- */
  function startColor(st, fin) {
    var s = loopSrc(st.id === "blue" ? "blue" : "white", st.id === "blue" ? "blue" : "white"), gn = fade(st, fin), f, upd;
    if (st.id === "green") {
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = GRN[st.lvl]; bp.Q.value = 0.55;
      var bg = ctx.createGain(); bg.gain.value = 4; s.connect(bp); bp.connect(bg); bg.connect(gn); f = bp;
      upd = function () { bp.frequency.setTargetAtTime(GRN[st.lvl], ctx.currentTime, 0.4); };
    } else if (st.id === "grey") {
      var ls = ctx.createBiquadFilter(); ls.type = "lowshelf"; ls.frequency.value = 250; ls.gain.value = 9;
      var pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 3200; pk.Q.value = 0.8; pk.gain.value = -8;
      var hs = ctx.createBiquadFilter(); hs.type = "highshelf"; hs.frequency.value = 9000; hs.gain.value = 7;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = GREY[st.lvl];
      s.connect(ls); ls.connect(pk); pk.connect(hs); hs.connect(lp); lp.connect(gn); f = lp;
      upd = function () { lp.frequency.setTargetAtTime(GREY[st.lvl], ctx.currentTime, 0.4); };
    } else {
      var lb = ctx.createBiquadFilter(); lb.type = "lowpass"; lb.frequency.value = BLUE[st.lvl];
      s.connect(lb); lb.connect(gn); f = lb;
      upd = function () { lb.frequency.setTargetAtTime(BLUE[st.lvl], ctx.currentTime, 0.4); };
    }
    s.start();
    return { s: s, f: f, g: gn, x: [], upd: upd };
  }

  /* ---------- Ventilador de caja ---------- */
  function startBox(st, fin) {
    var s = loopSrc("pink", "pink"), gn = fade(st, fin);
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 110;
    var pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 320; pk.Q.value = 0.9; pk.gain.value = 6;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = BOX.cut[st.lvl];
    var am = ctx.createGain(); am.gain.value = BOX.amp[st.lvl];
    var fl = ctx.createOscillator(), fg = ctx.createGain(); fl.frequency.value = 0.55; fg.gain.value = 0.06; fl.connect(fg); fg.connect(am.gain);
    var hum = ctx.createOscillator(), hg = ctx.createGain(); hum.type = "triangle"; hum.frequency.value = 60; hg.gain.value = 0.045; hum.connect(hg); hg.connect(gn);
    s.connect(hp); hp.connect(pk); pk.connect(am); am.connect(lp); lp.connect(gn);
    s.start(); fl.start(); hum.start();
    return { s: s, f: lp, g: gn, x: [fl, hum], upd: function () {
      var t = ctx.currentTime; lp.frequency.setTargetAtTime(BOX.cut[st.lvl], t, 0.5); am.gain.setTargetAtTime(BOX.amp[st.lvl], t, 0.5);
    } };
  }

  /* ---------- Cabina de avión ---------- */
  function startCabin(st, fin) {
    var sb = loopSrc("brown", "brown"), sp = loopSrc("pink", "pink"), gn = fade(st, Math.max(fin, 1.8));
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = CAB.cut[st.lvl];
    var pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 110; pk.Q.value = 0.9; pk.gain.value = 6;
    var gl = ctx.createGain(); gl.gain.value = CAB.amp[st.lvl];
    sb.connect(lp); lp.connect(pk); pk.connect(gl); gl.connect(gn);
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1200;
    var l2 = ctx.createBiquadFilter(); l2.type = "lowpass"; l2.frequency.value = 3200;
    var gh = ctx.createGain(); gh.gain.value = 0.1 * CAB.amp[st.lvl];
    sp.connect(hp); hp.connect(l2); l2.connect(gh); gh.connect(gn);
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator(), tg = ctx.createGain();
    o1.frequency.value = 95; o2.frequency.value = 96.2; o3.frequency.value = 143; tg.gain.value = 0.03;
    o1.connect(tg); o2.connect(tg); o3.connect(tg); tg.connect(gn);
    sb.start(); sp.start(); o1.start(); o2.start(); o3.start();
    return { s: sb, f: lp, g: gn, x: [sp, o1, o2, o3], upd: function () {
      var t = ctx.currentTime;
      lp.frequency.setTargetAtTime(CAB.cut[st.lvl], t, 0.5); gl.gain.setTargetAtTime(CAB.amp[st.lvl], t, 0.5); gh.gain.setTargetAtTime(0.1 * CAB.amp[st.lvl], t, 0.5);
    } };
  }

  /* ---------- Tren nocturno ---------- */
  /* Rumor grave continuo + traqueteo suave + el "ta-tán" de las ruedas al pasar
     por las juntas de la vía. Los golpes se programan por adelantado con el
     reloj de audio, así el ritmo no se tuerce aunque la pestaña esté de fondo. */
  function startTrain(st, fin) {
    var gn = fade(st, Math.max(fin, 1.8));
    var sb = loopSrc("brown", "brown"), sp = loopSrc("pink", "pink");
    // Rumor: marrón muy filtrado con un vaivén lento
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = TRAIN.cut[st.lvl];
    var rg = ctx.createGain(); rg.gain.value = 1.1;
    var sway = ctx.createOscillator(), swg = ctx.createGain(); sway.frequency.value = 0.13; swg.gain.value = 0.18;
    sway.connect(swg); swg.connect(rg.gain);
    sb.connect(lp); lp.connect(rg); rg.connect(gn);
    // Traqueteo: rosa en banda media, muy bajo
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.7;
    var tg = ctx.createGain(); tg.gain.value = TRAIN.rattle[st.lvl];
    sp.connect(bp); bp.connect(tg); tg.connect(gn);
    // Bus de los golpes de rueda
    var hits = ctx.createGain(); hits.gain.value = 1;
    var hlp = ctx.createBiquadFilter(); hlp.type = "lowpass"; hlp.frequency.value = 650;
    hits.connect(hlp); hlp.connect(gn);
    sb.start(); sp.start(); sway.start();

    var o = { s: sb, f: lp, g: gn, x: [sp, sway], upd: function () {
      var t = ctx.currentTime;
      lp.frequency.setTargetAtTime(TRAIN.cut[st.lvl], t, 0.8);
      tg.gain.setTargetAtTime(TRAIN.rattle[st.lvl], t, 0.8);
    } };

    function golpe(t, fuerza) {
      var s = ctx.createBufferSource(); s.buffer = buffers.brown;
      var b = ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = 140 + Math.random() * 40; b.Q.value = 0.9;
      var e = ctx.createGain();
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(fuerza * 7, t + 0.008);
      e.gain.setTargetAtTime(0, t + 0.01, 0.06);
      s.connect(b); b.connect(e); e.connect(hits);
      s.start(t, Math.random() * 10, 0.5);
    }
    var siguiente = ctx.currentTime + 0.8;
    function programar() {
      if (voz !== o) return;
      while (siguiente < ctx.currentTime + 1.5) {
        var p = TRAIN.period[st.lvl] * (0.97 + Math.random() * 0.06);
        var f = TRAIN.hit[st.lvl];
        var par = p * 0.16;                     // distancia entre las dos ruedas del bogie
        golpe(siguiente, f);
        golpe(siguiente + par, f * 0.85);
        siguiente += p;
      }
      o.th = setTimeout(programar, 250);
    }
    o.th = setTimeout(programar, 50);
    return o;
  }

  /* ---------- Cuencos tibetanos ---------- */
  function startBowls(st, fin) {
    var cs = ctx.createConstantSource(); cs.offset.value = 0;
    var gn = fade(st, Math.max(fin, 1));
    var bus = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
    var dl = ctx.createDelay(1), fb = ctx.createGain(), dlp = ctx.createBiquadFilter(); dl.delayTime.value = 0.5; fb.gain.value = 0.42; dlp.type = "lowpass"; dlp.frequency.value = 1800;
    bus.connect(lp); lp.connect(gn); lp.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(gn);
    cs.start();
    var o = { s: cs, f: lp, g: gn, x: [], upd: function () {} };
    var bases = [196, 247, 294, 330], R = [1, 2.71, 5.15], G = [0.5, 0.22, 0.1], TAU = [3.2, 2.0, 1.1];
    function strike() {
      var t = ctx.currentTime + 0.03, f0 = bases[Math.floor(Math.random() * bases.length)];
      R.forEach(function (r, k) {
        [0, 0.8].forEach(function (d) {
          var q = ctx.createOscillator(), e = ctx.createGain(); q.type = "sine"; q.frequency.value = f0 * r + d * r;
          e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(G[k] * 0.55, t + 0.012); e.gain.setTargetAtTime(0.0001, t + 0.012, TAU[k]);
          q.connect(e); e.connect(bus); q.start(t); q.stop(t + TAU[k] * 7);
        });
      });
    }
    function tick() {
      if (voz !== o) return;
      strike(); var r = BOWL.gap[st.lvl]; o.th = setTimeout(tick, r[0] + Math.random() * (r[1] - r[0]));
    }
    o.th = setTimeout(tick, 1200);
    return o;
  }

  /* ---------- Pulsos binaurales ---------- */
  function startBinaural(st, fin) {
    var cs = ctx.createConstantSource(); cs.offset.value = 0;
    var gn = fade(st, Math.max(fin, 2));
    function side(freq, pan) {
      var o = ctx.createOscillator(), og = ctx.createGain(), p = ctx.createStereoPanner();
      o.type = "sine"; o.frequency.value = freq; og.gain.value = 0.5; p.pan.value = pan;
      o.connect(og); og.connect(p); p.connect(gn); o.start(); return o;
    }
    var L = side(st.carrier, -1), R = side(st.carrier + st.beat, 1);
    cs.start();
    return { s: cs, f: null, g: gn, x: [L, R], upd: function () {
      var t = ctx.currentTime; L.frequency.setTargetAtTime(st.carrier, t, 0.3); R.frequency.setTargetAtTime(st.carrier + st.beat, t, 0.3);
    } };
  }

  /* ---------- Drone ambiental ---------- */
  function startDrone(st, fin) {
    var cs = ctx.createConstantSource(); cs.offset.value = 0;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    var gn = fade(st, Math.max(fin, 2));
    var oscs = DRONE.ratio.map(function (r, i) {
      var o = ctx.createOscillator(), og = ctx.createGain(); o.type = "sine";
      o.frequency.value = DRONE.base[st.lvl] * r; if (i === 4) o.detune.value = 8;
      og.gain.value = DRONE.gain[i]; o.connect(og); og.connect(f); o.start(); return o;
    });
    f.connect(gn); cs.start();
    return { s: cs, f: f, g: gn, x: oscs, upd: function () {
      var t = ctx.currentTime;
      oscs.forEach(function (o, i) { o.frequency.setTargetAtTime(DRONE.base[st.lvl] * DRONE.ratio[i], t, 0.8); });
    } };
  }

  /* ---------- API pública ---------- */
  function arrancar(st, fin) {
    var id = st.id;
    if (id === "wave") return startWave(st, fin);
    if (id === "drone") return startDrone(st, fin);
    if (id === "binaural") return startBinaural(st, fin);
    if (id === "green" || id === "grey" || id === "blue") return startColor(st, fin);
    if (id === "box") return startBox(st, fin);
    if (id === "cabin") return startCabin(st, fin);
    if (id === "bowls") return startBowls(st, fin);
    if (id === "train") return startTrain(st, fin);
    return startBuffer(st, fin);
  }

  function parar(suave) {
    var o = voz; if (!o) return;
    voz = null; clearTimeout(o.th);
    var t = ctx.currentTime, d = suave ? 0.4 : 0.05;
    o.g.gain.cancelScheduledValues(t);
    o.g.gain.setValueAtTime(o.g.gain.value, t); o.g.gain.linearRampToValueAtTime(0, t + d);
    setTimeout(function () {
      try { o.s.stop(); } catch (e) {}
      o.x.forEach(function (q) { try { q.stop(); } catch (e) {} });
      try { o.g.disconnect(); } catch (e) {}
    }, d * 1000 + 120);
  }

  window.RuidosMotor = {
    /* estado: {id, vol, lvl, type, carrier, beat}; entrada: segundos de entrada gradual */
    play: function (estado, entrada) {
      contexto();
      parar(false);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(1, ctx.currentTime);
      n = estado;
      voz = arrancar(estado, Math.max(1.2, entrada || 0));
    },
    stop: function () { if (ctx) parar(true); },
    isPlaying: function () { return !!voz; },
    setVolume: function (v) {
      if (!n) return; n.vol = v;
      if (voz) { voz.g.gain.cancelScheduledValues(ctx.currentTime); voz.g.gain.setTargetAtTime(g(n), ctx.currentTime, 0.05); }
    },
    setLevel: function (l) { if (!n) return; n.lvl = l; if (voz && voz.upd) voz.upd(); },
    setType: function (t) {   /* aire acondicionado: cambia el circuito, se reinicia suave */
      if (!n) return; n.type = t;
      if (voz) { parar(false); voz = arrancar(n, 1.2); }
    },
    setBinaural: function (carrier, beat) { if (!n) return; n.carrier = carrier; n.beat = beat; if (voz && voz.upd) voz.upd(); },
    /* Temporizador: programa la bajada final con el reloj de audio
       (sigue siendo exacta aunque la pestaña esté en segundo plano) */
    programarFin: function (seg, bajada) {
      if (!ctx) return;
      var t = ctx.currentTime, f = Math.min(bajada, seg);
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(1, t + 0.3);
      master.gain.setValueAtTime(1, t + Math.max(0.3, seg - f));
      master.gain.linearRampToValueAtTime(0, t + seg);
    },
    cancelarFin: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(1, t + 0.4);
    }
  };
})();
