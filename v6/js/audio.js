/* ==========================================================================
   Ambiance sonore (v6) — Web Audio, entièrement synthétisée (aucun fichier).
   - petite musique générative douce (nappes + notes pincées), une « tonalité » par pays
   - sons d'ambiance selon le lieu : ville, vent, oiseaux, vagues + mouettes, grillons la nuit
   - moteur de scooter plus doux, effets (cloche d'ouverture, whoosh du saut, atterrissage)
   Activée après le premier geste de l'utilisateur ; coupable avec le bouton « Son ».
   ========================================================================== */

const Sound = (() => {
  let ac = null, master, music, amb, sfx, verb, engine, noiseBuf, layers = {}, tick = 0, wanted = true, ready = false;
  const S = { scene: "airport", world: "france", view: "home", speed: 0, night: false, mode: "drive", flight: 0 };

  /* paysage sonore par décor : poids de chaque couche (0..1) */
  const SCENE = {
    airport: { crowd: .55, chime: 1, wind: .12 },
    paris: { traffic: .6, crowd: .45, birds: .3 }, bordeaux: { traffic: .45, crowd: .4, birds: .45, wind: .1 },
    losangeles: { traffic: .8, crowd: .3, birds: .15, wind: .1 }, newyork: { traffic: 1, crowd: .55, siren: .6 },
    lasvegas: { traffic: .7, crowd: .7, wind: .05 }, miami: { traffic: .5, crowd: .3, waves: .35, gull: .6, wind: .25 },
    tokyo: { traffic: .7, crowd: .6, chime: .5 }, kyoto: { birds: .9, wind: .22, water: .6, crowd: .12 },
    osaka: { traffic: .6, crowd: .6 }, nara: { birds: 1, wind: .22, crowd: .08 }, sapporo: { wind: .75, crowd: .08 },
    sydney: { traffic: .55, crowd: .4, waves: .35, gull: .8, birds: .25 }, melbourne: { traffic: .6, crowd: .5, birds: .3 },
    brisbane: { traffic: .4, crowd: .3, birds: .6, wind: .1 }, cairns: { traffic: .3, waves: .5, gull: .5, birds: .35, wind: .15 },
    goldcoast: { waves: 1, gull: .8, crowd: .25, wind: .25 }, uluru: { wind: .6, birds: .45, insects: .7 },
    windhoek: { traffic: .25, crowd: .25, wind: .35, birds: .5, insects: .4 }, sossusvlei: { wind: .7, crickets: 1 },
    ocean: { waves: 1, gull: .9, wind: .55 }
  };
  /* tonalité de la musique par pays : fondamentale MIDI, accords (demi-tons), gamme des notes pincées */
  const KEY = {
    france: { root: 62, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 4]], scale: [0, 2, 4, 7, 9], pluck: .5, tempo: .55 },
    usa: { root: 60, chords: [[0, 4, 7, 14], [-2, 2, 5, 9], [-7, -3, 0, 4], [0, 4, 7, 11]], scale: [0, 2, 4, 7, 9], pluck: .45, tempo: .5 },
    japan: { root: 57, chords: [[0, 7, 10, 14], [-2, 5, 8, 12], [-5, 2, 7, 10], [0, 7, 12, 15]], scale: [0, 2, 3, 7, 8], pluck: .42, tempo: .62, koto: true },
    australia: { root: 65, chords: [[0, 4, 7, 11], [2, 6, 9, 13], [-3, 0, 4, 7], [-5, -1, 2, 7]], scale: [0, 2, 4, 7, 9], pluck: .5, tempo: .5 },
    namibia: { root: 55, chords: [[0, 7, 10, 14], [-2, 5, 9, 12], [-4, 3, 7, 12], [0, 7, 10, 15]], scale: [0, 3, 5, 7, 10], pluck: .3, tempo: .7 }
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);

  function noise() { // bruit blanc bouclé de 3 s
    if (noiseBuf) return noiseBuf; const n = ac.sampleRate * 3; noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); let b = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = w * .5 + b * 6 * 0; } return noiseBuf;
  }
  function src(loop = true) { const s = ac.createBufferSource(); s.buffer = noise(); s.loop = loop; s.loopStart = 0; s.start(ac.currentTime, Math.random() * 2); return s; }
  const gain = (v, dst) => { const g = ac.createGain(); g.gain.value = v; dst && g.connect(dst); return g; };
  const filt = (type, f, q = .7, dst) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; dst && b.connect(dst); return b; };
  function lfo(rate, depth, target, type = "sine") { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); return o; }

  function impulse(sec = 2.6) { const n = ac.sampleRate * sec, b = ac.createBuffer(2, n, ac.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); } return b; }

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .3;
    const soft = filt("lowpass", 9000, .5); master = gain(0, ac.destination); soft.connect(comp); comp.connect(master);
    music = gain(.34, soft); amb = gain(.9, soft); sfx = gain(.7, soft);
    verb = ac.createConvolver(); verb.buffer = impulse(); const vg = gain(.5, music); verb.connect(vg);
    // ---- couches d'ambiance continues ----
    const L = (name, node, g0 = 0) => { const g = gain(g0, amb); node.connect(g); layers[name] = g; return g; };
    // circulation : grondement grave modulé
    { const s = src(), f = filt("lowpass", 320, .6), m = gain(1); s.connect(f); f.connect(m); lfo(.13, .25, m.gain); L("traffic", m); }
    { const s = src(), f = filt("bandpass", 900, .8), m = gain(.5); s.connect(f); f.connect(m); lfo(.31, .22, m.gain); L("crowd", m); }
    // vent : bande étroite qui respire
    { const s = src(), f = filt("bandpass", 520, 1.1), m = gain(.8); s.connect(f); f.connect(m); lfo(.07, 180, f.frequency); lfo(.11, .3, m.gain); L("wind", m); }
    // vagues : bruit grave dont le volume monte et descend lentement
    { const s = src(), f = filt("lowpass", 1100, .4), m = gain(.5); s.connect(f); f.connect(m); lfo(.085, .45, m.gain); L("waves", m); }
    { const s = src(), f = filt("lowpass", 1500, .4), m = gain(.4); s.connect(f); f.connect(m); lfo(.063, .35, m.gain); L("waves2", m); }
    // eau vive (jardins)
    { const s = src(), f = filt("highpass", 2400, .5), m = gain(.35); s.connect(f); f.connect(m); lfo(7, .1, m.gain); L("water", m); }
    // grillons de nuit : porteuse aiguë hachée
    { const o = ac.createOscillator(); o.frequency.value = 4300; const m = gain(0); o.connect(m); lfo(13, .12, m.gain, "square"); const e = gain(.5); m.connect(e); lfo(.45, .3, e.gain); o.start(); L("crickets", e); }
    // insectes (désert de jour)
    { const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = 6100; const m = gain(0); o.connect(m); lfo(24, .08, m.gain, "square"); const e = gain(.4); m.connect(e); lfo(.2, .25, e.gain); o.start(); L("insects", e); }
    // ---- moteur : nappe douce et grondement ----
    { const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = "sawtooth"; o2.type = "triangle"; const f = filt("lowpass", 380, .8), g = gain(0, sfx), n = src(), nf = filt("bandpass", 180, 1.2), ng = gain(.0);
      o1.connect(f); o2.connect(f); f.connect(g); n.connect(nf); nf.connect(ng); ng.connect(g); const put = gain(.0); lfo(14, .35, put.gain); o1.start(); o2.start();
      engine = { o1, o2, f, g, ng, put }; }
    // ---- planificateur : musique, oiseaux, mouettes, klaxons, carillons ----
    setInterval(schedule, 280);
    ready = true; return true;
  }

  /* ---------- musique générative ---------- */
  let chordIx = 0, nextChord = 0, nextArp = 0, nextBird = 0, nextGull = 0, nextCar = 0, nextChime = 0, nextSiren = 0;
  function pad(freq, t, dur, vol, dst) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = gain(0, dst); o.type = "sine"; o2.type = "triangle"; o.frequency.value = freq; o2.frequency.value = freq * 1.003;
    const f = filt("lowpass", 1400, .4); o.connect(f); o2.connect(f); f.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .38); g.gain.linearRampToValueAtTime(0, t + dur * 1.15);
    o.start(t); o2.start(t); o.stop(t + dur * 1.2); o2.stop(t + dur * 1.2);
  }
  function pluck(freq, t, vol, koto, dst) {
    const o = ac.createOscillator(), g = gain(0, dst), p = ac.createStereoPanner(); p.pan.value = rnd(-.6, .6); o.type = koto ? "sawtooth" : "triangle"; o.frequency.value = freq;
    const f = filt("lowpass", koto ? 2600 : 1800, .5); f.frequency.setValueAtTime(koto ? 2600 : 1800, t); f.frequency.exponentialRampToValueAtTime(500, t + .9);
    o.connect(f); f.connect(g); g.connect(p); p.connect(music); p.connect(verb);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + (koto ? 1.6 : 1.2));
    o.start(t); o.stop(t + 1.7);
  }
  function chirp(t, base, vol, n = 3) {
    const p = ac.createStereoPanner(); p.pan.value = rnd(-.8, .8); p.connect(amb);
    for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = gain(0, p), tt = t + i * rnd(.09, .14); o.frequency.setValueAtTime(base * rnd(.9, 1.1), tt); o.frequency.exponentialRampToValueAtTime(base * rnd(1.25, 1.7), tt + .07);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(vol, tt + .015); g.gain.exponentialRampToValueAtTime(.0001, tt + .09); o.connect(g); o.start(tt); o.stop(tt + .11); }
  }
  function gull(t, vol) {
    const p = ac.createStereoPanner(); p.pan.value = rnd(-.7, .7); p.connect(amb);
    [0, .38].forEach((d, i) => { const o = ac.createOscillator(), g = gain(0, p), f = filt("bandpass", 1700, 2), tt = t + d; o.type = "sawtooth"; o.frequency.setValueAtTime(1500 - i * 150, tt); o.frequency.exponentialRampToValueAtTime(820 - i * 120, tt + .34);
      lfo(30, 25, o.frequency); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(vol, tt + .05); g.gain.linearRampToValueAtTime(0, tt + .36); o.connect(f); f.connect(g); o.start(tt); o.stop(tt + .4); });
  }
  function carPass(t, vol) {
    const s = ac.createBufferSource(); s.buffer = noise(); s.loop = true; const f = filt("bandpass", 500, 1.4), g = gain(0, null), p = ac.createStereoPanner(), dir = Math.random() < .5 ? -1 : 1;
    s.connect(f); f.connect(g); g.connect(p); p.connect(amb); p.pan.setValueAtTime(dir * .9, t); p.pan.linearRampToValueAtTime(-dir * .9, t + 3);
    f.frequency.setValueAtTime(380, t); f.frequency.linearRampToValueAtTime(700, t + 1.4); f.frequency.linearRampToValueAtTime(350, t + 3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 1.4); g.gain.linearRampToValueAtTime(0, t + 3); s.start(t, rnd(0, 2)); s.stop(t + 3.1);
  }
  function siren(t, vol) {
    const o = ac.createOscillator(), g = gain(0, amb), f = filt("lowpass", 1800, .5); o.type = "triangle"; o.connect(f); f.connect(g);
    for (let i = 0; i < 6; i++) o.frequency.setValueAtTime(i % 2 ? 640 : 860, t + i * .55);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .6); g.gain.linearRampToValueAtTime(0, t + 3.3); o.start(t); o.stop(t + 3.4);
  }
  function chime(t, vol) { // « ding-dong » d'annonce d'aéroport
    [[659, 0], [523, .55]].forEach(([f, d]) => bell(f, t + d, vol, amb));
  }
  function bell(f, t, vol, dst) {
    [1, 2.01, 3.3].forEach((m, i) => { const o = ac.createOscillator(), g = gain(0, dst); o.frequency.value = f * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol / (i + 1), t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + 1.7 / (i + 1)); o.connect(g); o.start(t); o.stop(t + 1.8); });
  }

  function schedule() {
    if (!ac || !wanted || ac.state !== "running") return; const t = ac.currentTime, K = KEY[S.world] || KEY.france, sc = SCENE[S.scene] || SCENE.airport;
    // accords : toutes les ~8 s
    if (t > nextChord) { const ch = K.chords[chordIx++ % K.chords.length], dur = 8 / (K.tempo * 1.6);
      ch.forEach((n, i) => pad(mtof(K.root + n - (i === 0 ? 12 : 0)), t + .05, dur, i === 0 ? .06 : .035, music)); pad(mtof(K.root + ch[0] - 24), t + .05, dur, .05, music);
      nextChord = t + dur - .5; nextArp = Math.max(nextArp, t + 1.2); }
    // notes pincées : aléatoires sur la gamme, légères
    while (nextArp < t + .4) { if (Math.random() < K.pluck) { const oct = [0, 12, 12, 24][Math.floor(Math.random() * 4)], n = K.scale[Math.floor(Math.random() * K.scale.length)];
        pluck(mtof(K.root + 12 + n + oct), Math.max(nextArp, t), rnd(.03, .055), K.koto, music); } nextArp += K.tempo * (Math.random() < .3 ? 1.5 : 1); }
    const bed = S.view === "ride" || S.view === "home" || S.view === "hall";
    if (bed && sc.birds && !S.night && t > nextBird) { chirp(t, rnd(2600, 4200), .018 * sc.birds, 2 + Math.floor(Math.random() * 3)); nextBird = t + rnd(1.4, 5) / Math.max(.25, sc.birds); }
    if (bed && sc.gull && !S.night && t > nextGull) { gull(t, .02 * sc.gull); nextGull = t + rnd(9, 20) / sc.gull; }
    if (bed && sc.traffic && t > nextCar) { carPass(t, .05 * sc.traffic); nextCar = t + rnd(3.5, 9) / sc.traffic; }
    if (bed && sc.siren && t > nextSiren) { siren(t, .012 * sc.siren); nextSiren = t + rnd(25, 50); }
    if (bed && sc.chime && t > nextChime) { chime(t, .035 * sc.chime); nextChime = t + rnd(22, 38); }
  }

  /* ---------- état : on cale les gains sur le lieu courant ---------- */
  function mix() {
    if (!ac) return; const sc = SCENE[S.scene] || SCENE.airport, now = ac.currentTime, tgt = { traffic: 0, crowd: 0, wind: 0, waves: 0, waves2: 0, water: 0, crickets: 0, insects: 0 };
    const quiet = S.view === "flight" ? 0 : 1;
    tgt.traffic = (sc.traffic || 0) * .55 * quiet; tgt.crowd = (sc.crowd || 0) * .3 * quiet; tgt.wind = (sc.wind || 0) * .5 * quiet; tgt.waves = (sc.waves || 0) * .6 * quiet; tgt.waves2 = (sc.waves || 0) * .45 * quiet;
    tgt.water = (sc.water || 0) * .12 * quiet; tgt.crickets = (S.night ? (sc.crickets || .25 * (sc.birds || 0)) : 0) * .035 * quiet; tgt.insects = (!S.night ? (sc.insects || 0) : 0) * .02 * quiet;
    if (S.view === "ride" && S.mode === "reading") { for (const k in tgt) tgt[k] *= .5; }            // fenêtre ouverte : l'ambiance s'efface un peu
    if (S.mode === "fly") { tgt.wind = .85; for (const k of ["traffic", "crowd", "crickets", "insects", "water"]) tgt[k] *= .3; }
    for (const k in tgt) layers[k] && layers[k].gain.setTargetAtTime(tgt[k], now, 1.2);
    music.gain.setTargetAtTime(S.view === "flight" ? .2 : S.mode === "reading" ? .3 : .34, now, 1.5);
    // vol de l'avion : grondement
    if (jet) { jet.g.gain.setTargetAtTime(S.view === "flight" ? .1 : 0, now, .5); }
  }

  let jet = null;
  function ensureJet() { if (jet) return; const s = src(), f = filt("lowpass", 520, .6), g = gain(0, amb); s.connect(f); f.connect(g); lfo(.4, 60, f.frequency); jet = { g }; }

  /* ---------- API ---------- */
  return {
    /** à appeler lors d'un geste utilisateur : crée/réveille le contexte audio */
    unlock() { try { if (!ac && !build()) return; ensureJet(); if (ac.state === "suspended") ac.resume(); master.gain.setTargetAtTime(wanted ? .85 : 0, ac.currentTime, .6); mix(); } catch (e) { console.warn("audio", e); } },
    set(on) { wanted = !!on; if (ac) { master.gain.setTargetAtTime(wanted ? .85 : 0, ac.currentTime, .4); if (wanted && ac.state === "suspended") ac.resume(); } },
    get on() { return wanted; },
    scene(amb, world) { S.scene = amb; if (world) S.world = world; S.night = !!(window.AMB3 && AMB3[amb] && AMB3[amb].night); mix(); },
    view(v) { S.view = v; if (v === "home") { S.scene = "airport"; S.night = false; S.speed = 0; } if (ac && wanted) ensureJet(); this.engine(0); mix(); },
    mode(m) { S.mode = m; mix(); },
    world(w) { if (KEY[w]) S.world = w; },
    /** vitesse normalisée 0..1 : moteur doux, plus grave et plus feutré que la v5 */
    engine(a) {
      if (!ac || !engine) return; a = Math.min(1.2, Math.abs(a)); const now = ac.currentTime, on = S.view === "ride" && S.mode !== "fly";
      const f0 = 52 + a * 70; engine.o1.frequency.setTargetAtTime(f0, now, .15); engine.o2.frequency.setTargetAtTime(f0 * .5, now, .15);
      engine.f.frequency.setTargetAtTime(260 + a * 380, now, .2); engine.g.gain.setTargetAtTime(on ? .012 + a * .03 : 0, now, .2); engine.ng.gain.setTargetAtTime(on ? .15 + a * .5 : 0, now, .2);
    },
    sfx(name) {
      if (!ac || !wanted || ac.state !== "running") return; const t = ac.currentTime;
      if (name === "open") { bell(880, t, .05, sfx); bell(1320, t + .12, .03, sfx); }
      if (name === "close") { bell(660, t, .035, sfx); }
      if (name === "board") { bell(659, t, .06, sfx); bell(523, t + .5, .06, sfx); bell(784, t + 1, .05, sfx); }
      if (name === "land") { const o = ac.createOscillator(), g = gain(0, sfx); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + .3); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); o.start(t); o.stop(t + .4); bell(1046, t + .1, .03, sfx); }
      if (name === "jump") { // salto : sifflet montant puis whoosh
        const o = ac.createOscillator(), g = gain(0, sfx); o.type = "sine"; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(1500, t + .9); o.frequency.exponentialRampToValueAtTime(760, t + 1.8);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .1); g.gain.linearRampToValueAtTime(0, t + 1.9); o.connect(g); o.start(t); o.stop(t + 2);
        const s = ac.createBufferSource(); s.buffer = noise(); s.loop = true; const f = filt("bandpass", 600, .8), w = gain(0, sfx); s.connect(f); f.connect(w); f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + 1); f.frequency.exponentialRampToValueAtTime(500, t + 3);
        w.gain.setValueAtTime(0, t); w.gain.linearRampToValueAtTime(.12, t + .8); w.gain.linearRampToValueAtTime(0, t + 3.2); s.start(t, 0); s.stop(t + 3.3);
      }
      if (name === "chute") { const s = ac.createBufferSource(); s.buffer = noise(); const f = filt("lowpass", 900, .5), w = gain(0, sfx); s.connect(f); f.connect(w); w.gain.setValueAtTime(0, t); w.gain.linearRampToValueAtTime(.16, t + .04); w.gain.exponentialRampToValueAtTime(.001, t + .5); s.start(t, 0); s.stop(t + .55); }
    }
  };
})();
