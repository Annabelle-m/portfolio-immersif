/* ==========================================================================
   Orchestration : vues (accueil, vol, conduite, version classique),
   langue, tableau des départs, HUD, fenêtres d'informations, son.
   ========================================================================== */

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let lang = store.get("am-lang") || "fr";
  let view = "home", currentWorld = null, soundOn = false, audio = null, hintTimer = 0, bannerTimer = 0, flapTimers = new Map();
  const t = (k) => UI[lang][k];
  const L = (o) => (o && typeof o === "object" && "fr" in o ? o[lang] : o);

  /* ---------- Langue ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => { const v = UI[lang][el.dataset.i18n]; if (typeof v === "string") el.textContent = v; });
    $$("[data-i18n-html]").forEach((el) => (el.innerHTML = UI[lang][el.dataset.i18nHtml]));
    buildBoard(); if (glOK) Ride3D.setLang(lang); buildMinimap(); if (view === "ride" && hubSpoke) showHub(hubSpoke); if (view === "ride" && lastPrompt) onPrompt(lastPrompt[0], lastPrompt[1]);
    if (view === "classic") buildClassic();
    if (view === "ride" && openSection) showPanel(openSection, true);
  }
  function toggleLang() { lang = lang === "fr" ? "en" : "fr"; store.set("am-lang", lang); applyLang(); }

  /* ---------- Vues ---------- */
  function setView(v) {
    view = v; $("#app").dataset.view = v; Sound.view(v);
    ["home", "flight", "ride", "classic"].forEach((id) => ($("#" + id).hidden = id !== v));
    if (v !== "ride") { Ride3D.pause(); $("#hub").hidden = true; hubSpoke = null; $("#exitPrompt").hidden = true; setEngine(0); openSection = null; $("#panel").innerHTML = ""; $("#panel").hidden = true; $("#panel").classList.remove("open"); }
    if (v !== "classic" && classicLenis) { classicLenis.destroy(); classicLenis = null; }   // le défilement adouci ne concerne que la version classique
    if (v === "classic") { buildClassic(); window.scrollTo(0, 0); }
    if (v === "home") ensureHall();
    try { history.replaceState(null, "", v === "classic" ? "#classic" : location.pathname + location.search); } catch {}
  }

  /* ---------- Tableau des départs ---------- */
  function buildBoard() {
    const rows = $("#boardRows"); rows.innerHTML = "";
    WORLDS.forEach((w) => {
      const b = document.createElement("button");
      b.className = "row"; b.dataset.world = w.id; b.style.setProperty("--accent", w.accent);
      b.innerHTML = `<span class="c-time">${w.time}</span><span class="c-flight">${w.flight}</span>
        <span class="c-dest"><b class="flap" data-text="${esc(L(w.country).toUpperCase())}">${esc(L(w.country).toUpperCase())}</b><small>${esc(L(w.label))}</small></span>
        <span class="c-gate">${w.gate}</span><span class="c-status"><i></i><b class="flap status-text">${esc(t("onTime").toUpperCase())}</b></span>`;
      const st = $(".status-text", b);
      const on = () => { b.classList.add("boarding"); flap(st, t("boarding").toUpperCase()); };
      const off = () => { b.classList.remove("boarding"); flap(st, t("onTime").toUpperCase()); };
      b.addEventListener("mouseenter", on); b.addEventListener("focus", on);
      b.addEventListener("mouseleave", off); b.addEventListener("blur", off);
      b.addEventListener("click", () => depart(w.id));
      b.setAttribute("aria-label", `${L(w.country)}, ${L(w.label)}, ${t("gate")} ${w.gate}`);
      rows.appendChild(b);
    });
  }
  const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÉÈ'-· ";
  function flap(el, target) {
    clearInterval(flapTimers.get(el));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = target; return; }
    let step = 0; const from = el.textContent, len = Math.max(from.length, target.length);
    const id = setInterval(() => {
      step++; let out = "";
      for (let i = 0; i < len; i++) out += step > i * .7 + 4 ? (target[i] || "") : FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
      el.textContent = out.trimEnd();
      if (step > len * .7 + 5) { clearInterval(id); el.textContent = target; }
    }, 38);
    flapTimers.set(el, id);
  }
  function tickClock() { const d = new Date(); $("#clock").textContent = d.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" }); }

  /* ---------- Vol ---------- */
  function depart(worldId) {
    const w = WORLDS.find((x) => x.id === worldId);
    if (!glOK) { setView("classic"); return; }
    currentWorld = w; setView("flight");
    $("#fFrom").textContent = "BOD"; $("#fTo").textContent = w.code;
    $("#fMeta").textContent = `${t("flight")} ${w.flight} · ${t("gate")} ${w.gate} · ${L(w.country)} · ${L(w.label)}`;
    let built = prebuilt, flown = false; const go = () => { if (built && flown) startRide(w.id); };
    if (!prebuilt) MODELS.then(() => Ride3D.prebuild(() => { prebuilt = built = true; $("#loading").hidden = true; go(); }));
    Flight3D.play({ amb: w.cities[0].amb, accent: w.accent, world: w.id, onProgress }, () => { flown = true; if (!built) { setView("ride"); $("#loading").hidden = false; } go(); });
  }
  let prebuilt = false;
  function flyHome() {
    const w = currentWorld || WORLDS[0]; if (!glOK) { setView("home"); return; } setView("flight");
    $("#fFrom").textContent = w.code; $("#fTo").textContent = "BOD";
    $("#fMeta").textContent = `${t("returnFlight")} · ${UI[lang].from}`;
    Flight3D.play({ amb: "airport", accent: w.accent, reverse: true, onProgress }, () => enterHall());
  }
  /* retour à l'accueil : la caméra entre dans le hall (zoom arrière sur l'image d'accueil) */
  function enterHall() {
    hallStarted = true; finishHall(); setView("home"); fitHall(); const h = $("#home"); h.classList.remove("entering"); void h.offsetWidth; h.classList.add("entering");
    setTimeout(() => h.classList.remove("entering"), 2600);
  }
  function onHallStart() { showPanel(null); $("#exitPrompt").hidden = true; $("#hallSkip").hidden = false; $("#fade").classList.remove("quick"); }
  function onHallFade() { if (view === "ride") $("#fade").classList.add("on", "white"); }
  function onHall() { $("#hallSkip").hidden = true; Ride3D.pause(); enterHall(); requestAnimationFrame(() => requestAnimationFrame(() => $("#fade").classList.remove("on", "white"))); }   // v6.50 : le voile blanc ne se lève qu'après la première image de l'accueil (le travail lourd est masqué)
  function onProgress(p) {
    $("#fpFill").style.width = p * 100 + "%"; $("#fpPlane").style.left = p * 100 + "%";
    const ph = p < .3 ? 0 : p < .72 ? 1 : 2; [0, 1, 2].forEach((i) => $("#ph" + i).classList.toggle("on", i === ph));
  }

  /* ---------- Conduite ---------- */
  let openSection = null;
  function startRide(worldId) {
    setView("ride"); $("#fade").classList.remove("on");
    $("#panel").hidden = true; openSection = null; $("#exitPrompt").hidden = true;
    $("#controlsHint").classList.remove("gone"); clearTimeout(hintTimer); hintTimer = setTimeout(() => $("#controlsHint").classList.add("gone"), 9000);
    $("#hallSkip").hidden = true; $("#fade").classList.remove("on", "white");
    Ride3D.start(worldId); $("#loading").hidden = true;
  }

  function onSection(s) {
    currentWorld = s.world; Sound.scene(s.amb || (s.city && s.city.amb) || "airport", s.world.id);
    $("#locWorld").textContent = `${L(s.world.country)} · ${L(s.world.label)}`;
    $("#loc").style.setProperty("--accent", s.world.accent);
    let kicker, title;
    if (s.kind === "spoke") { kicker = t("hubTitle").split("·")[0].trim(); title = "✈ Hub"; }
    else if (s.kind === "city") { kicker = `${L(s.world.country)} · ${s.city.panel[lang].kicker.split("·").pop().trim()}`; title = s.city.name; }
    else if (s.kind === "junction") { kicker = t("welcome"); title = L(s.world.country); }
    else { kicker = t("bridge"); title = `→ ${L(s.next.country)}`; }
    $("#locCity").textContent = title;
    $("#banner").style.setProperty("--accent", s.world.accent);
    $("#bannerKicker").textContent = kicker; $("#bannerTitle").textContent = title;
    $("#banner").classList.remove("show"); void $("#banner").offsetWidth; $("#banner").classList.add("show");
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $("#banner").classList.remove("show"), 2600);
  }

  // compétences : cartes visuelles (pictogrammes, badges), très peu de texte
  const IC = { html: ["H5", "#e44d26"], html5: ["H5", "#e44d26"], java: ["Jv", "#e76f00"], c: ["C#", "#68217a"], python: ["Py", "#3776ab", "#ffd43b"], nodejs: ["N", "#3c873a"], angular: ["A", "#dd0031"], swift: ["Sw", "#f05138"], kotlin: ["K", "#7f52ff"], unity: ["U", "#222c37"], mongodb: ["Mo", "#47a248"], gitlab: ["GL", "#fc6d26"], docker: ["Dk", "#2496ed"], scrum: ["Sc", "#0fa57a"], css: ["CSS", "#2d6ae0"], javascript: ["JS", "#f7df1e", "#1a1a1a"], react: ["⚛", "#16222b", "#61dafb"], vite: ["V", "#6a4cf0", "#ffd62e"], bootstrap: ["B", "#7952b3"], php: ["php", "#777bb3"], symfony: ["S", "#101010"], doctrine: ["D", "#f58220", "#1a1a1a"], twig: ["T", "#8bb82e", "#10200a"], mvc: ["MVC", "#37445a"], sql: ["SQL", "#2b7fa8"], mysql: ["My", "#00758f", "#f29111"], merise: ["M", "#8a4fff"], phpmyadmin: ["pMA", "#e98a18", "#1a1a1a"], git: ["Git", "#f05133"], github: ["GH", "#24292f"], playwright: ["PW", "#2ead33"], vercel: ["▲", "#000"], figma: ["Fi", "#a259ff"], agile: ["↻", "#0fa57a"] };
  const NOW = ["php", "mysql", "phpmyadmin"];   // outils utilisés au quotidien en alternance
  const BADGES = () => { const fr = lang === "fr"; return { losangeles: fr ? ["Responsive", "API asynchrones", "Composants"] : ["Responsive", "Async APIs", "Components"], newyork: fr ? ["Architecture MVC", "Comptes et sessions", "PHP en entreprise"] : ["MVC architecture", "Accounts and sessions", "PHP at work"], lasvegas: fr ? ["Modélisation Merise", "Jointures", "CRUD"] : ["Merise modelling", "Joins", "CRUD"], miami: fr ? ["Tests de bout en bout", "Mise en ligne", "Kanban"] : ["End-to-end tests", "Deployment", "Kanban"] }; };
  const tile = (tg, plain) => { const fr = lang === "fr", k = tg.toLowerCase().replace(/[^a-z0-9]/g, ""), d = IC[k] || [tg.slice(0, 2), "#37445a"], star = !plain && NOW.includes(k);
    return `<li class="k-tl${star ? " now" : ""}"><span class="k-ic" style="--bg:${d[1]};--fg:${d[2] || "#fff"}" aria-hidden="true">${esc(d[0])}</span><b>${esc(tg)}</b>${star ? `<em title="${fr ? "Utilisé en alternance" : "Used at work"}">★</em>` : ""}</li>`; };
  const tilesHTML = (tags, plain) => `<ul class="k-tiles">${tags.map((x) => tile(x, plain)).join("")}</ul>`;
  const badgesHTML = (id) => `<ul class="k-bdg">${(BADGES()[id] || []).map((b) => `<li><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(b)}</li>`).join("")}</ul>`;
  function panelHTML(s) {
    const p = s.city.panel[lang];
    const skill = s.world.section === "skills", proj = s.world.section === "projects";
    let html = `<button class="p-close" data-action="closePanel" aria-label="${t("close")}">✕</button><p class="p-kicker">${esc(p.kicker)}</p><h2>${esc(p.title)}</h2><p class="p-lead">${esc(skill ? p.lead.split(/(?<=[.!?])\s/)[0] : p.lead)}</p>`;
    if (skill) html += `<div class="p-skill">${tilesHTML(p.tags)}${badgesHTML(s.city.id)}</div>`;
    else if (proj && p.tags.length) html += `<div class="p-skill">${tilesHTML(p.tags, true)}</div>`;
    if (p.items.length && !skill) html += `<dl>${p.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
    if (s.city.contact) html += contactHTML();
    if (s.city.postcard) html += postcardHTML();
    if (p.tags.length && !skill && !proj) html += `<ul class="tags">${p.tags.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    if (p.links) html += `<div class="p-links">${p.links.map(([l, u]) => `<a class="chip chip-solid" href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div>`;
    html += `<button class="p-go" data-action="closePanel"><kbd>↑</kbd> ${t("closeAndGo")}</button>`;
    return html;
  }
  function contactHTML() {
    return `<div class="contact-card">
      <div class="mail-row"><span class="mail" id="mailText">${PROFILE.email}</span><button class="chip chip-alt" data-action="copy">${t("copy")}</button></div>
      <div class="p-links"><a class="chip chip-solid" href="mailto:${PROFILE.email}">✉ E-mail</a><a class="chip chip-alt" href="${PROFILE.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a><a class="chip chip-alt" href="${PROFILE.github}" target="_blank" rel="noopener">GitHub ↗</a><a class="chip chip-alt" href="${PROFILE.cv}" target="_blank" rel="noopener">${t("cvBtn")} ↗</a></div></div>`;
  }
  function postcardHTML() {
    return `<form class="postcard" id="postcard">
      <div class="pc-msg"><p class="pc-title">${t("postcardTitle")}</p><label for="pcMsg">${t("postcardMsg")}</label><textarea id="pcMsg" rows="3"></textarea></div>
      <div class="pc-side"><div class="pc-stamp">WDH<br>✈</div><label for="pcName">${t("postcardName")}</label><input id="pcName" autocomplete="name">
        <p class="pc-addr">Annabelle Megy<br>${PROFILE.email}<br>${lang === "fr" ? "Sossusvlei, Namibie" : "Sossusvlei, Namibia"}</p></div>
      <div class="pc-act"><button class="chip chip-solid" type="submit">✉ ${t("postcardSend")}</button><p class="pc-note">${t("postcardNote")}</p></div></form>`;
  }
  window.__showPanel = (s) => showPanel(s);   // utilisé par les tests de rendu
  function showPanel(s, force) {
    const el = $("#panel");
    if (!s) { el.classList.remove("open"); openSection = null; Sound.mode("drive"); setTimeout(() => { if (!openSection) el.hidden = true; }, 260); return; }
    if (openSection === s && !force) return;
    const draft = { n: $("#pcName")?.value, m: $("#pcMsg")?.value };
    openSection = s; Sound.sfx("open"); Sound.mode("reading"); el.style.setProperty("--accent", s.world.accent); el.innerHTML = panelHTML(s); el.hidden = false;
    if (draft.n && $("#pcName")) $("#pcName").value = draft.n; if (draft.m && $("#pcMsg")) $("#pcMsg").value = draft.m;
    requestAnimationFrame(() => el.classList.add("open"));
  }

  let lastPrompt = null, hubSpoke = null;
  function onPrompt(j, armed) {
    lastPrompt = j ? [j, armed] : null; const el = $("#exitPrompt"); el.hidden = !j; if (!j) return;
    el.classList.toggle("armed", !!armed);
    $("#promptText").textContent = armed ? `✓ ${t("shortcutArmed")} · ${t("shortcutSide")[j.spoke.side]}` : `${j.spoke.side > 0 ? "→" : "←"} ${t("shortcutPrompt")}`;
    $("#promptBtn").hidden = !!armed;
  }
  function takeExit() { if (view === "ride") Ride3D.armShortcut(); }
  function showHub(sp) {
    hubSpoke = sp; $("#hub").hidden = false; showPanel(null);
    $("#hubRows").innerHTML = WORLDS.map((w) => `<button class="row hub-row" data-action="hub" data-world="${w.id}" style="--accent:${w.accent}"><span class="c-time">${w.gate}</span><span class="c-dest"><b>${esc(L(w.country).toUpperCase())}</b><small>${esc(L(w.label))}${w.id === sp.world.id ? (lang === "fr" ? " · retour" : " · back") : ""}</small></span><span class="c-status"><i></i><b>${w.code}</b></span></button>`).join("")
      + `<button class="row hub-row hub-home" data-action="hub" data-world="home"><span class="c-time">BOD</span><span class="c-dest"><b>${esc(t("hubHome").toUpperCase())}</b><small>${esc(UI[lang].from)}</small></span><span class="c-status"><i></i><b>✈</b></span></button>`;
    setTimeout(() => $("#hubRows .row")?.focus(), 50);
  }
  function hubChoose(id) {
    $("#hub").hidden = true; hubSpoke = null;
    if (id === "home") { flyHome(); return; }
    $("#fade").classList.add("quick", "on"); setTimeout(() => { Ride3D.hubChoose(id); $("#fade").classList.remove("on"); setTimeout(() => $("#fade").classList.remove("quick"), 400); }, 250);
  }

  let tickLast = 0, spdShown = -1, mmEls = null;
  function onTick({ kmh, ring, spoke }) {
    const now = performance.now(); setEngine(kmh / 80);
    if (now - tickLast < 66) return;   // v6.48 : vitesse et mini-carte à ~15 Hz (évite de repeindre le SVG à chaque image)
    tickLast = now;
    const sp = Math.round(kmh); if (sp !== spdShown) { spdShown = sp; $("#speed").textContent = sp; }
    if (!mmEls || !mmEls.dot || !mmEls.dot.isConnected) mmEls = { dot: $("#mmDot"), sc: $("#mmScoot"), tr: $("#mmTrail") };
    { const p = mmDisp(ring), deg = -126 + 72 * p, rad = spoke == null ? MMR : MMR * (1 - spoke * .78), dot = mmEls.dot, wi = Math.min(4, Math.floor(p)), w = WORLDS[wi] && WORLDS[wi].id;
      if (w !== mmActive) { mmActive = w; $$("#minimap .mp-w").forEach((g) => g.classList.toggle("on", g.dataset.w === w)); }
      if (dot) { dot.setAttribute("transform", `translate(${(Math.cos(deg * Math.PI / 180) * rad).toFixed(1)} ${(Math.sin(deg * Math.PI / 180) * rad).toFixed(1)})`);
        const sc = mmEls.sc, t = deg + 90, left = Math.cos(t * Math.PI / 180) < 0; if (sc) sc.setAttribute("transform", left ? `rotate(${t - 180})` : `rotate(${t}) scale(-1 1)`); }
      const tr = mmEls.tr; if (tr) tr.setAttribute("stroke-dasharray", `${(MMR * Math.PI / 180 * 72 * p).toFixed(1)} 800`); }
  }

  /* ---------- Mini-carte : la boucle des mondes autour de l'aéroport ---------- */
  const MMR = 60;   // rayon de la route (carte illustrée)
  const MM_LAY = [  // france, usa, japan, australia, namibia : monument (lx,ly) + petite plaque (px,py)
    { lx: -8, ly: -110, px: 94, py: -128 }, { lx: 128, ly: -58, px: 128, py: 2 }, { lx: 114, ly: 52, px: 118, py: 116 },
    { lx: -114, ly: 52, px: -118, py: 116 }, { lx: -128, ly: -58, px: -128, py: 2 }];
  const MM_ICO = { about: "👤", skills: "</>", experience: "💼", projects: "📁", contact: "✉️" };
  const MM_FLAG = {
    france: `<rect width="6" height="12" fill="#2b4fa8"/><rect x="6" width="6" height="12" fill="#fff"/><rect x="12" width="6" height="12" fill="#d8322f"/>`,
    usa: `<rect width="18" height="12" fill="#fff"/><path d="M0 1h18M0 4h18M0 7h18M0 10h18" stroke="#d8322f" stroke-width="1.6"/><rect width="8" height="6.4" fill="#2b4a8c"/>`,
    japan: `<rect width="18" height="12" fill="#fff" stroke="#ddd" stroke-width=".5"/><circle cx="9" cy="6" r="3.4" fill="#d8322f"/>`,
    australia: `<rect width="18" height="12" fill="#233f8c"/><rect width="8" height="6" fill="#2b3f95"/><path d="M0 3h8M4 0v6" stroke="#fff" stroke-width="1.5"/><path d="M0 3h8M4 0v6" stroke="#d8322f" stroke-width=".6"/><circle cx="13" cy="8" r="1.1" fill="#fff"/><circle cx="12" cy="3" r=".8" fill="#fff"/>`,
    namibia: `<rect width="18" height="12" fill="#2f5fb0"/><path d="M0 12L18 0v4L4 12z" fill="#fff"/><path d="M0 12L18 0M0 12h4L18 4" stroke="#d8322f" stroke-width="0"/><path d="M4 12L18 2.5V0L0 12z" fill="#d8322f"/><path d="M0 12h18V4z" fill="#2f8f4e"/>`
  };
  const MM_ART = {
    france: `<ellipse cx="0" cy="30" rx="36" ry="7" fill="#6fae5a"/><rect x="-34" y="8" width="9" height="22" fill="#9a9aa8"/><rect x="-24" y="14" width="8" height="16" fill="#b4b4c0"/><rect x="20" y="12" width="9" height="18" fill="#a9a9b6"/><path d="M-13 30L-5 -4L-2 -26L0 -40L2 -26L5 -4L13 30L7 30L0 10L-7 30z" fill="#8c5a32"/><path d="M-6 -4H6M-9 12H9" stroke="#e4b46e" stroke-width="2.2"/>`,
    usa: `<ellipse cx="-4" cy="30" rx="40" ry="7" fill="#7aa8a0"/><rect x="14" y="2" width="9" height="28" fill="#7e8aa6"/><rect x="25" y="-8" width="8" height="38" fill="#97a3bd"/><path d="M-18 30V14l7-4 3-26h8l3 26 7 4v16z" fill="#58b59a"/><path d="M-10-18l-4-8M-6-18l-1-9M-2-18l2-8M2-18l4-7" stroke="#58b59a" stroke-width="2.2" stroke-linecap="round"/><path d="M-6 -4L-13 -24" stroke="#58b59a" stroke-width="4" stroke-linecap="round"/><path d="M-13 -24l-2-6 5 1z" fill="#ffc24b"/>`,
    japan: `<ellipse cx="0" cy="32" rx="42" ry="7" fill="#7bbf6e"/><path d="M-6 30L18-6L42 30z" fill="#6d86c4"/><path d="M12-0L18-6L24-0L21 3L18 0L15 3z" fill="#fff"/><g fill="#d8322f"><rect x="-26" y="-12" width="5" height="42"/><rect x="-6" y="-12" width="5" height="42"/><path d="M-32-14Q-14-22 6-14L4-8H-30z"/><rect x="-28" y="-2" width="30" height="4"/></g><g fill="#f4a9c4"><circle cx="-36" cy="22" r="8"/><circle cx="-28" cy="16" r="7"/><circle cx="26" cy="26" r="7"/><circle cx="34" cy="20" r="6"/></g>`,
    australia: `<rect x="-42" y="22" width="84" height="8" fill="#bfa58a"/><path d="M-36 24Q-34 -10 -12 -6Q-18 8 -14 24z" fill="#f6f4f0" stroke="#cfd3dc" stroke-width="1"/><path d="M-14 24Q-10 -22 12 -18Q4 0 8 24z" fill="#fff" stroke="#cfd3dc" stroke-width="1"/><path d="M8 24Q14 -6 34 -2Q26 10 30 24z" fill="#f6f4f0" stroke="#cfd3dc" stroke-width="1"/><path d="M-22 30h50" stroke="#8d7a60" stroke-width="2"/>`,
    namibia: `<path d="M-44 32L-14-6L16 32z" fill="#e69a4e"/><path d="M-14 -6L16 32H-2z" fill="#c9752f"/><path d="M-38 32L-20 8L-4 32z" fill="#f2b162"/><rect x="26" y="-2" width="4" height="34" fill="#6b4a2a"/><path d="M8 0Q28-20 52 0Q30-8 8 0z" fill="#8ea63c"/><path d="M12-4Q28-16 48-4" stroke="#d9c54a" stroke-width="3" fill="none"/>`
  };
  const MM_MOB = matchMedia("(max-width: 820px)");
  MM_MOB.addEventListener && MM_MOB.addEventListener("change", () => buildMinimap());
  function buildMinimap() {
    const svg = $("#minimap"), secs = NET.sections, total = NET.ring.len;
    const R0 = 0, pt = (deg, r) => [(Math.cos(deg * Math.PI / 180) * r).toFixed(1), (Math.sin(deg * Math.PI / 180) * r).toFixed(1)];
    // la boucle est étirée en 5 secteurs égaux de 72° (un par monde) pour que plaques et scooter restent alignés
    mmSec = WORLDS.map((w) => { const m = secs.filter((s) => s.world.id === w.id); return [m[0].start / total, m[m.length - 1].end / total]; });
    let out = `<defs><filter id="mmGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="mmWob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter><filter id="mmSh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter><linearGradient id="mmPap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e8c9"/><stop offset="1" stop-color="#e8cfa0"/></linearGradient></defs>`;
    out += `<circle r="76" class="mp-mbg"/><g class="mp-bgw"><rect x="-186" y="-162" width="372" height="302" rx="26" class="mp-bg"/></g>`;
    // globe central (continents stylisés)
    out += `<circle r="48" fill="#161c2c" stroke="rgba(255,255,255,.14)" stroke-width="1.2" stroke-dasharray="2 3"/><g fill="rgba(255,255,255,.13)"><path d="M-36-14Q-30-30-12-28L-4-18-14-6-22 6-32 2z"/><path d="M-16 8L-4 10 0 28-8 40-16 24z"/><path d="M4-26Q18-32 30-24L34-8 20-4 10-12z"/><path d="M8-2L22-2 26 16 18 30 8 18z"/><path d="M28 12L38 14 36 24 28 22z"/></g>`;
    // route + piste parcourue
    out += `<circle r="${MMR}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/>`;
    WORLDS.forEach((w, i) => { const r = (d) => pt(d, MMR), [x0, y0] = r(-126 + 72 * i + 2), [x1, y1] = r(-126 + 72 * (i + 1) - 2); out += `<path d="M${x0} ${y0} A${MMR} ${MMR} 0 0 1 ${x1} ${y1}" stroke="${w.accent}" class="mp-glow"/><path d="M${x0} ${y0} A${MMR} ${MMR} 0 0 1 ${x1} ${y1}" stroke="${w.accent}" class="mp-arc"/>`; });
    out += `<circle id="mmTrail" r="${MMR}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0 400" transform="rotate(-126)" opacity=".9"/>`;
    // v6.53 : les embranchements vers l'aéroport central (le scooter les suit en rayon quand il prend la bretelle)
    NET.junctions.forEach((j) => { const deg = -126 + 72 * mmDisp(j.sb / total), [x0, y0] = pt(deg, MMR - 3), [x1, y1] = pt(deg, MMR * .22 + 11); out += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" class="mm-spoke" style="stroke:${WORLDS[j.wi] ? WORLDS[j.wi].accent : "#ffb920"}"/>`; });
    WORLDS.forEach((w, i) => {
      const L0 = MM_LAY[i], deg = -90 + 72 * i, [nx, ny] = pt(deg, MMR), tri = NET.triggers.findIndex((tr) => tr.sec.world.id === w.id), nm = esc(L(w.country)), lb = esc(L(w.label)), pw = Math.max(74, nm.length * 7.4 + 38);
      out += `<g class="mp-w" data-w="${w.id}" data-mm="${tri}" tabindex="0" role="button" aria-label="${nm} · ${lb}" style="--c:${w.accent}">`;
      out += `<g transform="translate(${L0.lx} ${L0.ly}) scale(1.25)" class="mp-art">${MM_ART[w.id]}</g>`;
      out += `<g transform="translate(${L0.px} ${L0.py})" class="mp-plate"><rect x="${-pw / 2}" y="-13" width="${pw}" height="26" rx="9"/>`;
      out += `<g transform="translate(${pw / 2 - 25} -6) scale(1.05)"><g>${MM_FLAG[w.id]}</g></g>`;
      out += `<text x="${-pw / 2 + 9}" y="4.5" class="mp-c">${nm}</text></g></g>`;
    });
    // une pastille par ville sur la route : clic = on y saute
    NET.triggers.forEach((tr, i) => {
      const deg = -126 + 72 * mmDisp(tr.s / total), [x, y] = pt(deg, MMR), [tx, ty] = pt(deg, MMR - 15), c = tr.sec.world.accent;
      out += `<g class="mp-city" data-mm="${i}" tabindex="0" role="button" aria-label="${esc(tr.sec.city.name)}" style="--c:${c}"><circle cx="${x}" cy="${y}" r="6.5" class="mp-hit"/><circle cx="${x}" cy="${y}" r="4" class="mp-pin"/><text x="${tx}" y="${ty}" class="mp-cn">${esc(tr.sec.city.name)}</text></g>`;
    });
    out += `<g class="mm-home" data-mm="home" tabindex="0" role="button" aria-label="${esc(t("toAirportLong"))}"><circle r="11" class="mm-halo"/><circle r="9" class="mm-hub"/><text y="4" class="mm-hub-t">✈</text></g>`;
    out += `<g id="mmDot" class="mp-dot"><circle r="11" fill="#fff" stroke="#ffb920" stroke-width="2.4"/><g id="mmScoot"><text y="5.6" text-anchor="middle" font-size="15">🛵</text></g>`;
    svg.setAttribute("viewBox", MM_MOB.matches ? "-76 -76 152 152" : "-192 -168 384 314");
    svg.innerHTML = out; mmActive = null; mmEls = null;
  }
  let mmActive = null, mmSec = [];
  function mmDisp(ring) {   // position réelle sur la boucle -> secteur de 72° (progression 0..5)
    const r = ((ring % 1) + 1) % 1;
    for (let i = 0; i < mmSec.length; i++) { const [a, b] = mmSec[i]; if (r >= a && r < b) return i + (r - a) / Math.max(1e-6, b - a); }
    return mmSec.length ? 0 : r * 5;
  }

  function mmGo(id) {
    if (view !== "ride" || Ride3D.flying) return;
    if (id === "home") { showPanel(null); flyHome(); return; }
    const tr = NET.triggers[+id]; if (!tr) return;
    Ride3D.flyTo(tr.s, tr);
  }
  function onFly(target) {
    const b = $("#flyBubble"); Sound.mode(target == null ? "drive" : "fly"); if (target != null && !onFly.on) Sound.sfx("jump"); onFly.on = target != null;
    clearTimeout(onFly.t); if (target == null) { b.classList.remove("on"); return; }
    const L2 = UI[lang].flyLines; b.textContent = L2[Math.floor(Math.random() * L2.length)];
    b.classList.add("on"); clearTimeout(onFly.t); onFly.t = setTimeout(() => { b.textContent = UI[lang].flyChute; }, 1500);
  }
  document.addEventListener("click", (e) => { const g = e.target.closest("[data-mm]"); if (g) { e.preventDefault(); mmGo(g.dataset.mm); try { g.blur(); } catch {} } });   // v6.52 : on rend le focus, sinon Espace relançait un saut au lieu de « Passer »
  document.addEventListener("keydown", (e) => { if (onFly.on && (e.key === " " || e.key === "Escape")) return; const g = e.target.closest && e.target.closest("[data-mm]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); mmGo(g.dataset.mm); } }, true);

  /* ---------- Contrôles ---------- */
  const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  window.addEventListener("keydown", (e) => {
    if (view === "flight" && (e.key === "Escape" || e.key === " " || e.key === "Enter")) { e.preventDefault(); Flight3D.skip(); return; }
    if (view === "ride" && !$("#hallSkip").hidden) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); Ride3D.skipHall(); } return; }
    if (view === "home" && $("#home").dataset.hall === "walk" && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); skipIntro(); return; }   // v6.51 : espace = « Passer » aussi pour l'intro
    if (view === "ride" && onFly.on && (e.key === "Escape" || e.key === " ")) { e.preventDefault(); Ride3D.skipFly(); return; }                                          // et pour le saut depuis la carte
    if (view !== "ride") return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const k = KEYMAP[e.code];
    if (k) { e.preventDefault(); if (!e.repeat) Ride3D.setKey(k, true); $("#controlsHint").classList.add("gone"); }
    if ((e.key === "Enter" || e.code === "KeyE") && !$("#exitPrompt").hidden) { e.preventDefault(); takeExit(); }
  });
  window.addEventListener("keyup", (e) => { const k = KEYMAP[e.code]; if (k) Ride3D.setKey(k, false); });
  window.addEventListener("blur", () => ["up", "down", "left", "right"].forEach((k) => Ride3D.setKey(k, false)));
  $$(".touch [data-key]").forEach((b) => {
    const k = b.dataset.key;
    const on = (e) => { e.preventDefault(); Ride3D.setKey(k, true); b.classList.add("on"); $("#controlsHint").classList.add("gone"); };
    const off = (e) => { e.preventDefault(); Ride3D.setKey(k, false); b.classList.remove("on"); };
    b.addEventListener("pointerdown", on); ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, off));
  });
  document.addEventListener("visibilitychange", () => { if (view === "ride") document.hidden ? Ride3D.pause() : Ride3D.resume(); });

  /* ---------- Actions ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]"); const go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); setView(go.dataset.go); return; }
    if (!a) return;
    const act = a.dataset.action;
    if (act === "lang") toggleLang();
    else if (act === "classic") { store.set("am-mode", "classic"); setView("classic"); }
    else if (act === "immersive") { store.set("am-mode", "immersive"); setView("home"); }
    else if (act === "skip") Flight3D.skip();
    else if (act === "skipHall") Ride3D.skipHall();
    else if (act === "closePanel") Ride3D.closePanel();
    else if (act === "shortcut") takeExit();
    else if (act === "hub") hubChoose(a.dataset.world);
    else if (act === "airport") { showPanel(null); flyHome(); }
    else if (act === "exit") takeExit();
    else if (act === "sound") toggleSound();
    else if (act === "copy") copyMail(a);
    else if (act === "openDoors") openDoors();
    else if (act === "skipIntro") skipIntro();
    else if (act === "fly") { const id = a.dataset.world; store.set("am-mode", "immersive"); depart(id); }
  });
  // v6.24 : dans un cadre isolé (aperçu, iframe) un mailto: simple peut être bloqué ; on l'ouvre explicitement
  function openMail(href) { try { const w = window.open(href, "_blank"); if (!w) location.href = href; } catch { location.href = href; } }
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"]'); if (!a) return;
    e.preventDefault(); openMail(a.getAttribute("href"));
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "postcard") return; e.preventDefault();
    const n = $("#pcName").value.trim(), m = $("#pcMsg").value.trim();
    const subject = encodeURIComponent(lang === "fr" ? `Carte postale du portfolio${n ? " · " + n : ""}` : `Postcard from your portfolio${n ? " · " + n : ""}`);
    openMail(`mailto:${PROFILE.email}?subject=${subject}&body=${encodeURIComponent(m + (n ? "\n\n— " + n : ""))}`);
  });
  function copyMail(btn) {
    const done = () => { btn.textContent = t("copied"); setTimeout(() => (btn.textContent = t("copy")), 1600); };
    const fallback = () => { const r = document.createRange(); const el = btn.parentElement.querySelector(".mail"); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(PROFILE.email).then(done, fallback); } catch { fallback(); }
  }
  const glOK = Ride3D.init($("#gl"), $("#snow"), { onSection, onPanel: (s) => showPanel(s), onPrompt, onTick, onHallStart, onHall, onHallFade, onFly, onChute: () => Sound.sfx("chute"), onLand: () => Sound.sfx("land"), onHome: flyHome, onExited: () => { Ride3D.pause(); flyHome(); } });
  Flight3D.init($("#gl"));
  /* modèles Blender : chargés pendant que l'on regarde l'accueil */
  const MODELS = loadModels().then((n) => { applyTemplates(); Ride3D.refreshRider(); return n; }).catch(() => 0);

  /* ---------- Son du moteur (Web Audio, désactivé par défaut) ---------- */
  function toggleSound() {
    soundOn = !soundOn; document.querySelectorAll(".sound-state").forEach((e) => { e.textContent = soundOn ? "●" : "○"; }); document.querySelectorAll(".sound-btn").forEach((e) => e.setAttribute("aria-pressed", soundOn));   // v6.5 : bouton son aussi dans l'aéroport
    Sound.unlock(); Sound.set(soundOn); Sound.view(view); if (currentWorld) Sound.world(currentWorld.id);
  }
  addEventListener("pointerdown", () => { if (soundOn) Sound.unlock(); }, { passive: true });
  function setEngine(pct) { if (typeof Sound !== "undefined") Sound.engine(pct); }

  /* ---------- Version classique ---------- */
  function buildClassic() {
    // v6.22 : même expérience de défilement que lenis.dev, avec nos couleurs et la ligne de vol en haut —
    // fond animé discret (particules, quelques signes de code, une route aérienne en pointillés),
    // titres qui restent collés pendant que le contenu défile, projets en défilement horizontal, expériences qui s'empilent.
    const S = UI[lang].sections, fr = lang === "fr";
    const world = (id) => WORLDS.find((w) => w.id === id);
    const plane = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5c.9 0 1.5 1.3 1.5 3.2v4.4l8 4.9v2.1l-8-2.4v4.4l2.4 1.8v1.6L12 20.4l-3.9 1.1v-1.6l2.4-1.8v-4.4l-8 2.4V14l8-4.9V4.7c0-1.9.6-3.2 1.5-3.2z"/></svg>`;
    const FLAGS = {
      france: `<rect width="10" height="20" fill="#1f3fa8"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#e1322d"/>`,
      usa: `<rect width="30" height="20" fill="#fff"/><path d="M0 1.5h30M0 4.6h30M0 7.7h30M0 10.8h30M0 13.9h30M0 17h30M0 19.6h30" stroke="#c8273a" stroke-width="1.6"/><rect width="13" height="10.8" fill="#27336e"/><g fill="#fff"><circle cx="2.6" cy="2.4" r=".8"/><circle cx="6.5" cy="2.4" r=".8"/><circle cx="10.4" cy="2.4" r=".8"/><circle cx="4.5" cy="5.4" r=".8"/><circle cx="8.4" cy="5.4" r=".8"/><circle cx="2.6" cy="8.4" r=".8"/><circle cx="6.5" cy="8.4" r=".8"/><circle cx="10.4" cy="8.4" r=".8"/></g>`,
      japan: `<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#c8102e"/>`,
      australia: `<rect width="30" height="20" fill="#0a2a7a"/><path d="M0 0l14 9M14 0L0 9" stroke="#fff" stroke-width="2"/><path d="M0 0l14 9M14 0L0 9" stroke="#d3202f" stroke-width=".8"/><path d="M7 0v9M0 4.5h14" stroke="#fff" stroke-width="3"/><path d="M7 0v9M0 4.5h14" stroke="#d3202f" stroke-width="1.6"/><g fill="#fff"><circle cx="7" cy="14.6" r="1.9"/><circle cx="22.5" cy="3.6" r="1.1"/><circle cx="26.2" cy="8.2" r="1.1"/><circle cx="19" cy="9.6" r="1.1"/><circle cx="22.5" cy="16.2" r="1.1"/><circle cx="24.6" cy="11.6" r=".6"/></g>`,
      namibia: `<rect width="30" height="20" fill="#fff"/><path d="M0 0h21L0 14z" fill="#0c3b8c"/><path d="M30 20H9L30 6z" fill="#1a8a4a"/><path d="M0 20v-3.5L24.75 0H30v3.5L5.25 20z" fill="#d3202f"/><circle cx="6" cy="5" r="2.4" fill="#ffce00"/>`
    };
    const flag = (id) => `<svg class="k-flag" viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${FLAGS[id]}</svg>`;
    // pas de noms de villes ici (ils n'ont de sens qu'en version immersive)
    const parts = (c, job) => { const p = c.panel[lang], kick = p.kicker.split(" · ").pop(), [org, role] = job ? p.title.split(" · ") : [], place = job ? p.lead.split(". ")[0].replace(/\.$/, "") : "", lead = job ? (p.lead.includes(". ") ? p.lead.slice(p.lead.indexOf(". ") + 2) : "") : p.lead;
      return { kick, title: job ? role || org : p.title, org: job ? org + ", " + place : "", body: `${lead ? `<p class="k-lead">${esc(lead)}</p>` : ""}${p.items.length ? `<dl class="k-items">${p.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}${p.tags.length ? `<ul class="k-badges">${p.tags.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${p.links ? `<p class="k-links">${p.links.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(l)}</a>`).join("")}</p>` : ""}` }; };
    const row = (c, extra, i) => { const q = parts(c, false); return `<article class="k-row" style="--i:${i}"><p class="k-kick">${esc(q.kick)}</p><h3>${esc(q.title)}</h3>${q.body}${extra}</article>`; };
    // expériences : un carré numéroté (les postes se suivent dans le temps) + son détail
    const job = (c, i) => { const q = parts(c, true); return `<article class="k-jobc" style="--i:${i}"><div class="k-sq"><b>${String(i + 1).padStart(2, "0")}</b><p><span>${esc(q.kick)}</span><strong>${esc(q.title)}</strong><small>${esc(q.org)}</small></p></div><div class="k-det">${q.body}</div></article>`; };
    // titres découpés en lettres (mot par mot) : anime.js les fait monter quand ils arrivent à l'écran
    const split = (txt) => txt.split(" ").map((wd) => `<span class="k-w">${[...wd].map((ch) => `<b>${esc(ch)}</b>`).join("")}</span>`).join(" ");
    const COUNT = { skills: fr ? "domaines" : "areas", experience: fr ? "postes" : "roles", projects: fr ? "projets" : "projects" };
    const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const cta = (label, href, ext) => `<a class="k-cta" href="${href}"${ext ? ` target="_blank" rel="noopener"` : ""}><i>${arrow}</i><span>${esc(label)}</span></a>`;
    const head = (w, title) => `<header class="k-head"><p class="k-label">${flag(w.id)}${esc(L(w.country))}</p><h2 aria-label="${esc(title)}"><span aria-hidden="true">${split(title)}</span></h2><p class="k-count">${COUNT[w.section] ? w.cities.length + " " + COUNT[w.section] : ""}</p><button class="k-fly" data-action="fly" data-world="${w.id}">${plane}<span>${fr ? "Explorer en scooter" : "Explore by scooter"}</span></button></header>`;
    const section = (id, title, kind, extras = {}) => { const w = world(id);
      if (kind === "cas") return `<section class="k-sec k-light" id="c-${w.section}"><p class="k-state">${esc(L(PROFILE.pitch)).replace(/(15 ans|15 years|applications web|web applications|web apps|alternance M1\/M2|Master's work-study[^.]*)/g, "<mark>$1</mark>")}</p><div class="k-cas-wrap" style="--n:${w.cities.length}"><div class="k-cas-pin">${head(w, title)}<div class="k-cas-list">${w.cities.map((c, i) => job(c, i)).join("")}</div></div></div></section>`;
      const rows = w.cities.map((c, i) => row(c, extras[c.id] || "", i)).join("");
      const wcard = (c, i) => { const q = c.panel[lang], first = q.lead.split(/(?<=[.!?])\s/)[0], sub = q.kicker.split(" · ").pop();
        return `<article class="k-row k-wh-card" role="listitem" style="--i:${i}"><p class="k-kick">${esc(sub)}</p><h3>${esc(q.title)}</h3><p class="k-lead">${esc(first)}</p>${tilesHTML(q.tags)}${badgesHTML(c.id)}</article>`; };
      if (kind === "wheel") return `<section class="k-sec k-wheel" id="c-${w.section}">${head(w, title)}<div class="k-wh-wrap"><div class="k-wh-pin"><div class="k-wh-stage" role="list">${w.cities.map(wcard).join("")}</div><div class="k-wh-nav" aria-hidden="true">${w.cities.map((c, i) => `<button type="button" data-wh="${i}" tabindex="-1"><i></i><span>${esc(parts(c, false).title)}</span></button>`).join("")}</div></div></div></section>`;
      return `<section class="k-sec k-${kind}" id="c-${w.section}">${head(w, title)}${kind === "hs" ? `<div class="k-hs-wrap"><div class="k-hs-pin"><div class="k-hs-track">${rows}<div class="k-hs-end"><p>${fr ? "Envie d'en voir plus ?" : "Want to see more?"}</p>${cta(fr ? "Tout mon GitHub" : "My GitHub", PROFILE.github, true)}</div></div></div></div>` : `<div class="k-rows">${rows}</div>`}</section>`; };
    const facts = fr ? [["15 ans", "dans le tourisme"], ["Bac+3", "en cours"], ["PHP, MySQL", "en alternance"], ["M1 / M2", "recherché"]] : [["15 years", "in travel"], ["Bachelor's", "in progress"], ["PHP, MySQL", "work-study"], ["Master's", "wanted"]];
    const stops = [{ name: fr ? "Départ" : "Start", label: "Bordeaux", jump: "c-top0" }].concat(WORLDS.map((w) => ({ id: w.id, name: L(w.country), label: L(w.label), jump: "c-" + w.section })));
    const [first, ...rest] = PROFILE.name.split(" "), endTxt = fr ? "Une alternance M1/M2 en développement." : "A Master's work-study position in development.";
    const WARP = fr ? ["Quinze ans", "de voyages", "Et maintenant", "place au code"] : ["Fifteen years", "of travel", "And now", "time to code"];
    $("#classic").innerHTML = `
      <canvas class="k-bg" aria-hidden="true"></canvas>
      <header class="k-top"><a class="k-brand" href="#" data-jump="c-top0">${esc(PROFILE.name)}</a>
        <p class="k-loc">Bordeaux, France <time id="kClock"></time></p>
        <div class="k-top-act"><button class="k-ghost" data-action="lang">${t("lang")}</button><button class="k-btn" data-action="immersive">${plane}<span>${t("immersive")}</span></button></div></header>
      <nav class="k-fp" aria-label="${fr ? "Itinéraire" : "Itinerary"}" style="--n:${stops.length - 1}"><span class="k-fp-line"><span class="k-fp-fill"></span></span><span class="k-fp-plane">${plane}</span>
        ${stops.map((s, i) => `<button class="k-stop" data-jump="${s.jump}" style="--i:${i}" aria-label="${esc(s.name)}, ${esc(s.label)}"><i>${s.id ? flag(s.id) : ""}</i><b>${esc(s.name)}</b></button>`).join("")}</nav>
      <main class="k-main">
        <section class="k-hero" id="c-top0">
          <p class="k-avail"><i></i>${esc(t("available"))}</p>
          <h1 aria-label="${esc(PROFILE.name)}"><span class="k-wm" aria-hidden="true">${[first, rest.join(" ")].map((wd) => `<span>${[...wd].map((ch) => `<b>${esc(ch)}</b>`).join("")}</span>`).join(" ")}</span></h1>
          <p class="k-sub">${fr ? "Développeuse full-stack" : "Full-stack developer"}</p>
          <div class="k-hero-foot"><p class="k-scroll">${fr ? "Faites défiler<br>pour embarquer" : "Scroll<br>to board"}</p><p class="k-pitch">${esc(L(PROFILE.pitch))}</p>
            <div class="k-pills">${cta(fr ? "M'écrire" : "Email me", "mailto:" + PROFILE.email)}${cta(t("cvBtn"), PROFILE.cv, true)}<p class="k-links"><a href="${PROFILE.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${PROFILE.github}" target="_blank" rel="noopener">GitHub</a></p></div></div>
        </section>
        <dl class="k-facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        ${section("france", S.about + " & " + S.journey.toLowerCase(), "list")}
        ${section("usa", S.skills, "wheel")}
        <div class="k-warp" aria-hidden="true"><div class="k-warp-pin"><p class="k-warp-a"><span>${esc(WARP[0])}</span><span>${esc(WARP[1])}</span></p><p class="k-warp-m">${esc(WARP[2])}</p><p class="k-warp-b">${esc(WARP[3])}</p><i class="k-warp-panel"></i></div></div>
        ${section("japan", S.experience, "cas")}
        ${section("australia", S.projects, "hs")}
        ${section("namibia", S.contact, "list", { windhoek: contactHTML(), sossusvlei: postcardHTML() })}
        <section class="k-end"><p>${fr ? "Prochaine escale" : "Next stop"}</p><h2 aria-label="${esc(endTxt)}"><span aria-hidden="true">${split(endTxt)}</span></h2>
          ${cta(PROFILE.email, "mailto:" + PROFILE.email)}
          <div class="k-end-foot"><span>${esc(L(PROFILE.base))}</span><span>© ${new Date().getFullYear()} Annabelle Megy</span></div></section>
      </main>`;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches, A = window.anime && !calm ? window.anime : null, ease = "cubicBezier(.2,.8,.2,1)", TOP = 122, clamp = (x) => Math.min(1, Math.max(0, x)), io3 = (x) => 1 - Math.pow(1 - x, 3);
    $("#classic").classList.toggle("is-calm", calm);
    $$("#classic [data-jump]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); const tg = document.getElementById(el.dataset.jump); if (!tg) return; const y = tg.id === "c-top0" ? 0 : tg.getBoundingClientRect().top + window.scrollY - (tg.matches(".k-light") ? 60 : 128); if (classicLenis) classicLenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: calm ? "auto" : "smooth" }); }));
    // défilement adouci (Lenis) — coupé si l'utilisateur préfère moins d'animations
    if (classicLenis) { classicLenis.destroy(); classicLenis = null; }
    if (window.Lenis && !calm) { try { classicLenis = new Lenis({ lerp: .085, smoothWheel: true }); classicLenis.on("scroll", () => classicSpy && classicSpy()); } catch (e) { classicLenis = null; } }

    // ---- fond : particules, quelques signes de code, une route aérienne en pointillés qui avance avec la page
    const cv = $("#classic .k-bg"), cx = cv.getContext("2d"), GL = ["{ }", "</>", "=>", ";", "( )", "[ ]", "//", "&&"]; let W = 0, H = 0, dots = [];
    const seed = () => { const dpr = Math.min(1.5, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, Math.max(36, W * H / 15000))); dots = []; for (let i = 0; i < n; i++) dots.push({ x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8, g: i % 7 === 3 ? GL[(i / 7 | 0) % GL.length] : null, amber: i % 9 === 0, v: (Math.random() - .5) * .00006 }); };
    const draw = () => { if ($("#classic").hidden || !W) return; const sy = window.scrollY, max = Math.max(1, document.documentElement.scrollHeight - H), prog = Math.min(1, sy / max); cx.clearRect(0, 0, W, H); globe(sy);
      for (const p of dots) { if (!calm) p.x = (p.x + p.v + 1) % 1; const span = H * 1.25, y = (((p.y * span - sy * p.z * .32) % span) + span) % span - H * .12, x = p.x * W;
        if (p.g) { cx.font = `${Math.round(10 + 9 * p.z)}px ui-monospace, "Martian Mono", Menlo, monospace`; cx.fillStyle = `rgba(154,164,181,${(.06 + .1 * p.z).toFixed(3)})`; cx.fillText(p.g, x, y); }
        else { cx.fillStyle = p.amber ? `rgba(255,194,61,${(.2 + .45 * p.z).toFixed(3)})` : `rgba(244,246,248,${(.1 + .3 * p.z).toFixed(3)})`; cx.beginPath(); cx.arc(x, y, .5 + 1.1 * p.z, 0, 6.283); cx.fill(); } }
      const P0 = [-.04 * W, .86 * H], P1 = [.42 * W, -.02 * H], P2 = [1.04 * W, .3 * H], at = (t) => [(1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
      cx.lineWidth = 1.2; cx.setLineDash([2, 9]); cx.strokeStyle = "rgba(154,164,181,.16)"; cx.beginPath(); cx.moveTo(P0[0], P0[1]); cx.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); cx.stroke();
      const te = .04 + prog * .92; cx.strokeStyle = "rgba(255,194,61,.42)"; cx.beginPath(); for (let k = 0; k <= 40; k++) { const q = at(te * k / 40); k ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); } cx.stroke(); cx.setLineDash([]);
      const tip = at(te), gl = cx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 26); gl.addColorStop(0, "rgba(255,194,61,.35)"); gl.addColorStop(1, "rgba(255,194,61,0)"); cx.fillStyle = gl; cx.beginPath(); cx.arc(tip[0], tip[1], 26, 0, 6.283); cx.fill(); cx.fillStyle = "#ffc23d"; cx.beginPath(); cx.arc(tip[0], tip[1], 2.6, 0, 6.283); cx.fill(); };
    // v6.23 : à la place de la photo, un globe dessiné en code — continents en pointillés, itinéraire entre les cinq pays.
    // Carte du monde très simplifiée : 18 bandes de 10° de latitude (du nord au sud), paires [colonne début, colonne fin] par pas de 10° de longitude depuis 180° O.
    const LAND = [[13, 14], [6, 10, 12, 15, 26, 28], [1, 11, 13, 14, 16, 16, 19, 35], [2, 2, 5, 11, 17, 17, 19, 34], [5, 11, 18, 32], [6, 10, 17, 18, 21, 31], [7, 8, 16, 29], [8, 9, 16, 22, 25, 25, 28, 28, 30, 30], [10, 12, 17, 22, 28, 29], [10, 14, 19, 21, 28, 32], [10, 14, 19, 22, 30, 32], [11, 13, 19, 22, 29, 33], [10, 12, 19, 20, 30, 32, 35, 35], [10, 11, 32, 32, 35, 35], [11, 11], [12, 12], [0, 35], [0, 35]];
    const LD = []; LAND.forEach((row, r) => { for (let k = 0; k < row.length; k += 2) for (let c = row[k]; c <= row[k + 1]; c++) for (const dy of [1.25, 3.75, 6.25, 8.75]) for (const dx of [1.25, 3.75, 6.25, 8.75]) LD.push([90 - r * 10 - dy, -180 + c * 10 + dx]); });
    const STOPS = [[44.84, -.58], [34.05, -118.24], [35.68, 139.69], [-33.87, 151.21], [-22.56, 17.08], [44.84, -.58]], RAD = Math.PI / 180;
    const v3 = (la, lo) => [Math.cos(la * RAD) * Math.sin(lo * RAD), Math.sin(la * RAD), Math.cos(la * RAD) * Math.cos(lo * RAD)];
    const ROUTE = []; for (let k = 0; k < STOPS.length - 1; k++) { const a = v3(...STOPS[k]), b = v3(...STOPS[k + 1]), om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])); for (let q = 0; q < 40; q++) { const t = q / 40, s0 = Math.sin((1 - t) * om) / Math.sin(om), s1 = Math.sin(t * om) / Math.sin(om), h = 1 + .09 * Math.sin(Math.PI * t); ROUTE.push([(a[0] * s0 + b[0] * s1) * h, (a[1] * s0 + b[1] * s1) * h, (a[2] * s0 + b[2] * s1) * h]); } }
    const globe = (sy) => { const hv = clamp(1 - sy / (H * .95)); if (hv <= 0) return; const small = W < 720, R = small ? Math.min(W * .78, H * .42) : Math.min(W * .4, H * .6), gx = small ? W * .5 : W * .64, gy = H * (small ? .72 : .98) - sy * .45;
      const lon0 = ((calm ? 0 : performance.now() * .002) + sy * .16 + 8) * RAD, tilt = 20 * RAD, cl = Math.cos(lon0), sl = Math.sin(lon0), ct = Math.cos(tilt), st = Math.sin(tilt);
      const pr = (p) => { const x = p[0] * cl - p[2] * sl, z = p[0] * sl + p[2] * cl, y = p[1] * ct - z * st, zz = p[1] * st + z * ct; return [gx + R * x, gy - R * y, zz]; };
      cx.globalAlpha = hv; const g0 = cx.createRadialGradient(gx - R * .35, gy - R * .45, R * .1, gx, gy, R); g0.addColorStop(0, "rgba(40,52,76,.75)"); g0.addColorStop(1, "rgba(13,17,26,.85)"); cx.fillStyle = g0; cx.beginPath(); cx.arc(gx, gy, R, 0, 6.283); cx.fill();
      cx.lineWidth = 1; cx.strokeStyle = "rgba(154,164,181,.34)"; cx.stroke();
      cx.strokeStyle = "rgba(154,164,181,.1)"; cx.beginPath();   // méridiens et parallèles
      for (let lo = -180; lo < 180; lo += 20) { let on = false; for (let la = -90; la <= 90; la += 6) { const q = pr(v3(la, lo)); if (q[2] > 0) { on ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); on = true; } else on = false; } }
      for (let la = -60; la <= 60; la += 20) { let on = false; for (let lo = -180; lo <= 180; lo += 6) { const q = pr(v3(la, lo)); if (q[2] > 0) { on ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); on = true; } else on = false; } }
      cx.stroke();
      for (const d of LD) { const q = pr(v3(d[0], d[1])); if (q[2] > .02) { cx.fillStyle = `rgba(198,206,219,${(.12 + .42 * q[2]).toFixed(3)})`; const sz = 1.1 + 1.5 * q[2]; cx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz); } }
      cx.strokeStyle = "rgba(255,194,61,.85)"; cx.lineWidth = 1.5; cx.setLineDash([3, 6]); cx.beginPath(); let on = false; for (const p of ROUTE) { const q = pr(p); if (q[2] > 0) { on ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); on = true; } else on = false; } cx.stroke(); cx.setLineDash([]);
      for (let k = 0; k < STOPS.length - 1; k++) { const q = pr(v3(...STOPS[k])); if (q[2] > 0) { cx.fillStyle = "rgba(255,194,61,.22)"; cx.beginPath(); cx.arc(q[0], q[1], 9, 0, 6.283); cx.fill(); cx.fillStyle = "#ffc23d"; cx.beginPath(); cx.arc(q[0], q[1], 3.2, 0, 6.283); cx.fill(); } }
      const pl = pr(ROUTE[Math.floor(((calm ? .12 : performance.now() * .00003) % 1) * ROUTE.length)]); if (pl[2] > 0) { cx.fillStyle = "#f4f6f8"; cx.beginPath(); cx.arc(pl[0], pl[1], 2.6, 0, 6.283); cx.fill(); cx.strokeStyle = "rgba(244,246,248,.4)"; cx.lineWidth = 1; cx.beginPath(); cx.arc(pl[0], pl[1], 7, 0, 6.283); cx.stroke(); }
      cx.globalAlpha = 1; };
    classicDraw = draw;

    // mesures : nom sur toute la largeur, rangée de projets, cascade des expériences
    const wm = $("#classic .k-wm"), hs = $("#classic .k-hs-wrap"), pin = $("#classic .k-hs-pin"), track = $("#classic .k-hs-track"), cas = $("#classic .k-cas-wrap"), sqs = $$("#classic .k-sq"), dets = $$("#classic .k-det"), warp = $("#classic .k-warp"), wA = $$("#classic .k-warp-a span"), wB = $("#classic .k-warp-b"), wM = $("#classic .k-warp-m"), wP = $("#classic .k-warp-panel"); let hsLen = 0, casOn = false, whOn = false; const whWrap = $("#classic .k-wh-wrap"), whCards = $$("#classic .k-wh-card"), whBtns = $$("#classic .k-wh-nav button");
    const fit = () => { if ($("#classic").hidden) return; wm.style.fontSize = "100px"; const w = wm.getBoundingClientRect().width, box = wm.parentNode.getBoundingClientRect().width; if (w > 0) wm.style.fontSize = (100 * box / w * .995).toFixed(2) + "px";
      const wide = !calm && window.innerWidth >= 1000 && window.innerHeight >= 680; hs.classList.toggle("is-pinned", wide); track.style.transform = ""; hsLen = wide ? Math.max(0, track.scrollWidth - pin.clientWidth) : 0; hs.style.height = wide ? (window.innerHeight - TOP + hsLen) + "px" : "";
      whOn = !calm && window.innerWidth >= 820 && window.innerHeight >= 600; whWrap.classList.toggle("is-pinned", whOn); whWrap.style.height = whOn ? ((window.innerHeight - TOP) + (whCards.length - 1) * window.innerHeight * .8) + "px" : ""; if (!whOn) whCards.forEach((k) => { k.style.cssText = ""; k.classList.remove("is-on"); });
      casOn = wide; cas.classList.toggle("is-pinned", wide); if (!wide) { sqs.forEach((s) => (s.style.transform = "")); dets.forEach((d) => d.classList.remove("is-on")); }
      seed(); draw(); };
    fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const clock = () => { const e = $("#kClock"); if (e) e.textContent = new Date().toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }); };
    clock();
    // ligne de vol en haut + tous les effets liés au défilement
    const fp = $("#classic .k-fp"), marks = [$("#c-top0")].concat($$("#classic .k-sec")), btns = $$("#classic .k-stop"), n = marks.length - 1, heroWm = $("#classic .k-hero h1"), focusRows = $$("#classic .k-list .k-row");
    classicSpy = () => { if ($("#classic").hidden) return; const vh = window.innerHeight, sy = window.scrollY;
      if (!calm && sy < vh * 1.2) { heroWm.style.translate = "0 " + (sy * .3).toFixed(1) + "px"; }
      const ref = sy + vh * .42, tops = marks.map((m) => m.getBoundingClientRect().top + sy); tops[0] = vh * .42;   // en haut de page, l'avion est posé sur « Départ »
      const end = document.documentElement.scrollHeight - vh * .58; let i = 0; while (i < n && ref >= tops[i + 1]) i++;
      const a = tops[i], b = i < n ? tops[i + 1] : Math.max(end, a + 1), f = i < n ? clamp((ref - a) / (b - a)) : 0;
      fp.style.setProperty("--p", ((i + f) / n).toFixed(4)); btns.forEach((bt, k) => { bt.classList.toggle("on", k === i); bt.classList.toggle("done", k < i); if (k === i) bt.setAttribute("aria-current", "step"); else bt.removeAttribute("aria-current"); });
      // le bloc le plus proche du milieu de l'écran s'éclaire, les autres s'estompent
      let best = null, bd = 1e9; focusRows.forEach((r) => { const q = r.getBoundingClientRect(), d = Math.abs((q.top + Math.min(q.bottom, q.top + 320)) / 2 - vh * .5); if (d < bd) { bd = d; best = r; } }); focusRows.forEach((r) => r.classList.toggle("is-focus", r === best));
      // projets : le défilement vertical fait glisser la rangée de cartes
      if (hsLen) { const q = clamp((TOP - hs.getBoundingClientRect().top) / hsLen); track.style.transform = `translate3d(${(-q * hsLen).toFixed(1)}px,0,0)`; }
      // transition : deux lignes géantes qui glissent en sens opposés, puis un panneau clair qui s'ouvre et prend tout l'écran
      if (!calm) { const r = warp.getBoundingClientRect(), q = clamp(-r.top / Math.max(1, r.height - vh)), s = clamp((r.top * -1 + vh) / vh), z = io3(clamp((q - .42) / .58));
        if (r.bottom > -50 && r.top < vh + 50) { wA[0].style.transform = `translate3d(${(18 - (s * .35 + q * .65) * 46).toFixed(2)}%,0,0)`; wA[1].style.transform = `translate3d(${(6 - (s * .35 + q * .65) * 30).toFixed(2)}%,0,0)`; wB.style.transform = `translate3d(${(-40 + (s * .35 + q * .65) * 52).toFixed(2)}%,0,0)`;
          wM.style.opacity = clamp((q - .08) / .2).toFixed(3); wM.style.transform = `scale(${(1 + z * 5).toFixed(3)})`; const side = 50 - Math.max(.0001, z) * 50, tb = 38 * (1 - clamp(z * 2.2)); wP.style.clipPath = `inset(${tb.toFixed(2)}% ${side.toFixed(2)}%)`; wP.style.opacity = q > .42 ? 1 : 0; } }
      // expériences : les carrés numérotés arrivent un à un en cascade, le détail du poste courant s'affiche à côté
      if (casOn) { const r = cas.getBoundingClientRect(), q = clamp((TOP - r.top) / Math.max(1, r.height - (vh - TOP))), ff = q * (sqs.length - .3), cur = Math.min(sqs.length - 1, Math.floor(ff + .6));
        sqs.forEach((s, k) => { const t = k === 0 ? 1 : io3(clamp((ff - k + 1) / .55)); s.style.transform = `translate3d(0,${((1 - t) * 105).toFixed(2)}vh,0)`; s.classList.toggle("is-cur", k === cur); }); dets.forEach((d, k) => d.classList.toggle("is-on", k === cur)); }
      // compétences : les cartes sont posées sur une grande roue dont le centre est sous l'écran, le défilement la fait tourner
      if (whOn) { const r = whWrap.getBoundingClientRect(), q = clamp((TOP - r.top) / Math.max(1, r.height - (vh - TOP))), f = q * (whCards.length - 1), cur = Math.round(f), R = Math.max(900, window.innerWidth * .9), STEP = 31 * Math.PI / 180;
        whCards.forEach((k, i) => { const dd = i - f, ad = Math.abs(dd), th = dd * STEP, x = R * Math.sin(th), y = R * (1 - Math.cos(th)) * .62;
          k.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) rotate(${(th * 57.2958 * .8).toFixed(2)}deg) scale(${(1 - Math.min(.3, ad * .13)).toFixed(3)})`;
          k.style.opacity = ad > 2.2 ? 0 : (1 - Math.min(.72, ad * .62)).toFixed(3); k.style.zIndex = 10 - Math.round(ad * 3); k.style.visibility = ad > 2.2 ? "hidden" : "visible"; k.classList.toggle("is-on", i === cur); });
        whBtns.forEach((bt, i) => bt.classList.toggle("on", i === cur)); whWrap.style.setProperty("--wp", q.toFixed(4)); }
      if (calm) draw(); };
    classicFit = fit; classicClock = clock;
    whBtns.forEach((bt) => bt.addEventListener("click", () => { if (!whOn) return; const r = whWrap.getBoundingClientRect(), span = Math.max(1, r.height - (window.innerHeight - TOP)), y = window.scrollY + r.top - TOP + span * (+bt.dataset.wh / Math.max(1, whCards.length - 1)); if (classicLenis) classicLenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: "smooth" }); }));
    if (!classicBound) { classicBound = true; window.addEventListener("scroll", () => classicSpy && classicSpy(), { passive: true }); window.addEventListener("resize", () => { classicFit && classicFit(); classicSpy && classicSpy(); }); setInterval(() => classicClock && classicClock(), 20000);
      const loop = (ts) => { requestAnimationFrame(loop); if (document.hidden || view !== "classic") return; if (classicLenis) classicLenis.raf(ts); if (classicDraw && !matchMedia("(prefers-reduced-motion: reduce)").matches) classicDraw(); }; requestAnimationFrame(loop); }
    requestAnimationFrame(classicSpy);
    // anime.js : l'arrivée du haut de page, puis chaque grand titre qui monte lettre par lettre. Sans anime.js, tout reste visible.
    if (!A) return;
    const chars = (el) => el.querySelectorAll(".k-w b"), minor = ".k-label, .k-count, .k-fly, .k-end > p, .k-end > .k-cta, .k-end-foot";
    A.set("#classic .k-sub, #classic .k-avail, #classic .k-hero-foot > *, #classic .k-facts > div", { opacity: 0 });
    A.timeline({ easing: ease })
      .add({ targets: "#classic .k-wm b", translateY: ["105%", 0], rotate: [8, 0], duration: 950, delay: A.stagger(34) }, 150)
      .add({ targets: "#classic .k-sub, #classic .k-avail, #classic .k-hero-foot > *", translateY: [18, 0], opacity: [0, 1], duration: 700, delay: A.stagger(90) }, 750)
      .add({ targets: "#classic .k-facts > div", translateY: [22, 0], opacity: [0, 1], duration: 650, delay: A.stagger(80) }, 1150);
    if (!("IntersectionObserver" in window)) return;
    const show = (el) => { if (el.matches(".k-end")) A({ targets: el, opacity: [0, 1], scale: [.94, 1], duration: 900, easing: ease });
      if (el.matches(".k-state")) { A({ targets: el, opacity: [0, 1], translateY: [40, 0], duration: 1000, easing: ease }); return; }
      A({ targets: chars(el), translateY: ["110%", 0], duration: 850, delay: A.stagger(20, { start: el.matches(".k-end") ? 250 : 0 }), easing: ease });
      A({ targets: el.querySelectorAll(minor), opacity: [0, 1], translateY: [14, 0], duration: 650, delay: A.stagger(110, { start: 260 }), easing: ease }); };
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); show(en.target); } }), { rootMargin: "0px 0px -9% 0px" });
    $$("#classic .k-head, #classic .k-end, #classic .k-state").forEach((el) => { if (el.getBoundingClientRect().top < innerHeight * .9) return;
      if (el.matches(".k-state")) A.set(el, { opacity: 0 });
      else { A.set(chars(el), { translateY: "110%" }); A.set(el.querySelectorAll(minor), { opacity: 0 }); if (el.matches(".k-end")) A.set(el, { opacity: 0 }); }
      io.observe(el); });
  }
  let classicFit = null, classicClock = null, classicLenis = null, classicDraw = null;
  let classicSpy = null, classicBound = false;


  /* ---------- v6.25 : le hall d'aéroport dessiné ----------
     Pendant le chargement, on voit la porte d'entrée fermée. « Entrer » : la voyageuse arrive, les portes
     coulissantes s'ouvrent, elle traverse le hall et s'arrête devant le tableau des départs, qui apparaît. */
  let hallStarted = false, hallTimer = 0, hallReady = false;
  const calmMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function setHall(st) {
    const h = $("#home"); h.dataset.hall = st;
    const sk = $("#hgSkip"), en = $("#hgEnter"); if (!sk || !en) return;
    en.hidden = st !== "ready"; sk.hidden = st !== "walk";
    if (st === "ready") { try { en.focus({ preventScroll: true }); } catch {} }
  }
  /* cadrage : la scène est dessinée en 1600 x 900 ; on règle la fenêtre visible, la position d'arrivée (devant le tableau) et le zoom de départ */
  function fitHall() {
    const svg = $("#hallSvg"), h = $("#hall"); if (!svg || !h) return;
    const W = window.innerWidth, H = window.innerHeight; if (!W || !H) return;
    const s = Math.max(W / 1600, H / 900), visW = W / s, visH = H / s, mob = W <= 820, board = Math.min(660, W * .56);
    const x0 = visW < 1600 ? Math.max(0, Math.min(1600 - visW, 560 - visW / 2)) : 0;
    svg.setAttribute("viewBox", x0 + " 0 1600 900"); { const bs = Math.max(1, Math.min(1.32, (W - 48) / 780, (H - 330) / 380)); $("#home").style.setProperty("--bs", bs.toFixed(3)); $("#home").style.setProperty("--bi", (1 / bs).toFixed(3)); }
    // arrivée dans le hall : à gauche du tableau (sur téléphone : au centre, puis elle s'efface)
    const ey = mob ? 700 : 705, ex = mob ? x0 + W * .5 / s : Math.max(420, Math.min(780, x0 + (W - board - 36 - 190) / s));
    // façade vue de dehors : la porte (axe x = 560, y = 515) est cadrée au centre de l'écran
    const door = 560, doorY = 515, cx = x0 + visW / 2, cy = 900 - visH / 2;
    const z = Math.max(.8, Math.min(2.2, .46 * visW / 448, .6 * visH / 272));
    const ty = cy - .06 * visH - doorY, tx = cx - door, bottom = doorY + (900 - doorY - ty) / z;   // y (avant zoom) du bas de l'écran
    const sy = Math.min(900, bottom - 6);
    const st = h.style;
    st.setProperty("--ex", ex.toFixed(1) + "px"); st.setProperty("--ey", ey + "px"); st.setProperty("--es", ((ey - 440) * .00327).toFixed(3));
    hallG = { s, x0, tx, ty, z, itx: x0 + visW / 2 - 560 }; st.setProperty("--itx", hallG.itx.toFixed(1) + "px");
    st.setProperty("--cz", z.toFixed(3)); st.setProperty("--tx", tx.toFixed(1) + "px"); st.setProperty("--ty", ty.toFixed(1) + "px");
    st.setProperty("--sy", sy.toFixed(1) + "px"); st.setProperty("--ss", Math.max(.5, (sy - 470) * .00353).toFixed(3));
  }
  function ensureHall() { if (hallStarted) return; hallStarted = true; fitHall(); initHall(); }
  function initHall() {
    setHall("load"); hallReady = false;
    const bar = $("#hgBar"), t0 = performance.now();
    const waits = [document.fonts && document.fonts.ready, glOK && typeof MODELS !== "undefined" ? MODELS : 0].map((p) => Promise.resolve(p).catch(() => {}));
    Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 7000))]).then(() => (hallReady = true));
    let p = 0;
    const tick = () => {
      if ($("#home").dataset.hall !== "load") return;
      const el = performance.now() - t0, fin = hallReady && el > 1600, target = fin ? 1 : Math.min(.88, el / 2600 * .88);
      p += (target - p) * .14; bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      if (fin && p > .985) { bar.style.transform = "scaleX(1)"; setHall("ready"); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  let hallG = null, hallStop = null;
  /* petit moteur de secours si anime.js n'a pas pu se charger (réseau bloqué) : mêmes pistes, mêmes courbes */
  const EASE = { lin: (t) => t, in3: (t) => t * t * t, out3: (t) => 1 - Math.pow(1 - t, 3), io2: (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, io3: (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, io4: (t) => t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2 };
  const EASE_A = { lin: "linear", in3: "easeInCubic", out3: "easeOutCubic", io2: "easeInOutQuad", io3: "easeInOutCubic", io4: "easeInOutQuart" };
  function runTracks(tracks, done) {
    tracks.forEach((t) => t.fn(0));
    if (window.anime) {
      const tl = window.anime.timeline({ autoplay: true, complete: done });
      tracks.forEach((t) => { const o = { p: 0 }; tl.add({ targets: o, p: 1, duration: t.dur, easing: EASE_A[t.ease], update: () => t.fn(o.p) }, t.at); });
      return () => tl.pause();
    }
    const t0 = performance.now(), total = Math.max(...tracks.map((t) => t.at + t.dur)); let raf = 0, stopped = false;
    const step = (now) => { const el = now - t0; tracks.forEach((t) => t.fn(EASE[t.ease](Math.min(1, Math.max(0, (el - t.at) / t.dur)))));
      if (stopped) return; if (el < total) raf = requestAnimationFrame(step); else done(); };
    raf = requestAnimationFrame(step); return () => { stopped = true; cancelAnimationFrame(raf); };
  }
  function clearHallInline() {
    const root = $("#hall"); ["ext-cam", "ext", "int", "int-cam", "leaf", "flare", "spill", "dim", "far-board"].forEach((c) => $$("." + c, root).forEach((e) => e.removeAttribute("style")));
    $("#board").removeAttribute("style"); $(".home-intro").removeAttribute("style"); $("#home").classList.remove("stage-on");
  }
  function finishHall() { if (hallStop) { hallStop(); hallStop = null; } clearTimeout(hallTimer); clearHallInline(); setHall("done"); }
  /* séquence : les portes s'ouvrent, on traverse l'entrée, le hall apparaît avec le panneau des départs tout au fond, puis le panneau
     vient vers nous en zoomant (la caméra avance en même temps) jusqu'à occuper le centre de l'écran */
  function openDoors() {
    const h = $("#home"); if (h.dataset.hall !== "ready") return;
    setHall("walk"); clearTimeout(hallTimer);
    if (calmMotion() || !hallG) { hallTimer = setTimeout(finishHall, 150); return; }
    const G = hallG, q = (c) => $("." + c, $("#hall")), E = { cam: q("ext-cam"), ext: q("ext"), int: q("int"), ic: q("int-cam"), l: q("leaf.l"), r: q("leaf.r"), fl: q("flare"), sp: q("spill"), dim: q("dim"), far: q("far-board") };
    const board = $("#board"), intro = $(".home-intro");
    h.classList.add("stage-on"); board.style.opacity = "0"; board.style.transform = "none"; intro.style.opacity = "0";
    let rc = null, k0 = .15, dx = 0, dy = 0, inited = false;
    const initBoard = () => { if (inited) return true; if (S.a < 1) return false; inited = true; board.style.transform = "none"; rc = board.getBoundingClientRect(); const fr = E.far.querySelector("rect").getBoundingClientRect(); k0 = Math.max(.05, fr.width / rc.width); const bs = parseFloat(h.style.getPropertyValue("--bs")) || 1; dx = (fr.left + fr.width / 2 - (rc.left + rc.width / 2)) / bs; dy = (fr.top + fr.height / 2 - (rc.top + rc.height / 2)) / bs; return true; };
    const S = { a: 0, q: 0 }, applyInt = () => { E.ic.style.transform = "translate(" + (G.itx * S.q).toFixed(1) + "px,0px) scale(" + ((1.22 - .22 * S.a) / (1 - .6 * S.q)).toFixed(4) + ")"; };
    const tracks = [
      { at: 80, dur: 550, ease: "io4", fn: (p) => { E.l.style.transform = "translateX(" + (-136 * p).toFixed(1) + "px)"; E.r.style.transform = "translateX(" + (136 * p).toFixed(1) + "px)"; E.l.style.opacity = E.r.style.opacity = (1 - Math.max(0, (p - .45) / .55)).toFixed(3); E.sp.style.opacity = (.45 + .55 * p).toFixed(3); } },
      { at: 140, dur: 940, ease: "lin", fn: (p) => { E.fl.style.opacity = (Math.sin(Math.PI * p) * .6).toFixed(3); } },
      { at: 190, dur: 830, ease: "in3", fn: (p) => { E.cam.style.transform = "translate(" + G.tx + "px," + G.ty + "px) scale(" + (G.z * (1 + 2.3 * p)).toFixed(4) + ")"; } },
      { at: 480, dur: 300, ease: "lin", fn: (p) => { E.ext.style.opacity = (1 - p).toFixed(3); E.int.style.opacity = p.toFixed(3); } },
      { at: 480, dur: 830, ease: "out3", fn: (p) => { S.a = p; applyInt(); } },
      { at: 1330, dur: 2700, ease: "io2", fn: (p) => { if (!initBoard()) return; S.q = p; applyInt(); E.dim.style.opacity = (.42 * p).toFixed(3); } },
      { at: 1330, dur: 120, ease: "lin", fn: (p) => { if (!initBoard()) return; E.far.style.opacity = (1 - p).toFixed(3); board.style.opacity = p.toFixed(3); } },
      { at: 1330, dur: 2700, ease: "io2", fn: (p) => { if (!initBoard()) return; const k = k0 / (1 - (1 - k0) * p); board.style.transform = "translate(" + (dx * (1 - p)).toFixed(1) + "px," + (dy * (1 - p)).toFixed(1) + "px) scale(" + k.toFixed(4) + ")"; } },
      { at: 3650, dur: 440, ease: "out3", fn: (p) => { intro.style.opacity = p.toFixed(3); intro.style.transform = "translateY(" + (14 * (1 - p)).toFixed(1) + "px)"; } }
    ];
    hallStop = runTracks(tracks, finishHall);
  }
  function skipIntro() { finishHall(); }
  window.addEventListener("resize", fitHall);

  /* ---------- Démarrage ---------- */
  applyLang(); tickClock(); setInterval(tickClock, 15000);
  const h = location.hash.replace("#", "");
  if (h === "classic" || (!h && store.get("am-mode") === "classic")) setView("classic");
  else if (WORLDS.some((w) => w.id === h)) MODELS.then(() => startRide(h));
  else setView("home");
})();
