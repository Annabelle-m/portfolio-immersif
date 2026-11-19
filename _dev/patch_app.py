p='/home/claude/portfolio/v5/js/app.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:70]; s=s.replace(a,b)
rep("""    out += `<circle r="9" class="mm-hub"/><text y="3.5" class="mm-hub-t">✈</text><circle id="mmDot" r="4.5" class="mm-dot"/>`;
    svg.innerHTML = out;""","""    // v5 : chaque fenêtre est une destination cliquable (saut en parachute)
    NET.triggers.forEach((tr, i) => {
      const a = ang(tr.s), [x, y] = pt(a, 44), [tx, ty] = pt(a, 33), w = tr.sec.world;
      out += `<g class="mm-city" data-mm="${i}" tabindex="0" role="button" aria-label="${esc(tr.sec.city.name)}"><circle cx="${x}" cy="${y}" r="7" class="mm-hit"/><circle cx="${x}" cy="${y}" r="2.6" class="mm-pin" style="--c:${w.accent}"/><text x="${tx}" y="${ty}" class="mm-name">${esc(tr.sec.city.name)}</text></g>`;
    });
    out += `<g class="mm-home" data-mm="home" tabindex="0" role="button" aria-label="${esc(t("toAirportLong"))}"><circle r="9" class="mm-hub"/><text y="3.5" class="mm-hub-t">✈</text></g><circle id="mmDot" r="4.5" class="mm-dot"/>`;
    svg.innerHTML = out;""")
rep("""  /* ---------- Contrôles ---------- */""","""  function mmGo(id) {
    if (view !== "ride" || Ride3D.flying) return;
    if (id === "home") { showPanel(null); flyHome(); return; }
    const tr = NET.triggers[+id]; if (!tr) return;
    Ride3D.flyTo(tr.s, tr);
  }
  function onFly(target) {
    const b = $("#flyBubble");
    if (target == null) { b.classList.remove("on"); return; }
    const L2 = UI[lang].flyLines; b.textContent = L2[Math.floor(Math.random() * L2.length)];
    b.classList.add("on"); clearTimeout(onFly.t); onFly.t = setTimeout(() => { b.textContent = UI[lang].flyChute; }, 1500);
  }
  document.addEventListener("click", (e) => { const g = e.target.closest("[data-mm]"); if (g) { e.preventDefault(); mmGo(g.dataset.mm); } });
  document.addEventListener("keydown", (e) => { const g = e.target.closest && e.target.closest("[data-mm]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); mmGo(g.dataset.mm); } }, true);

  /* ---------- Contrôles ---------- */""")
rep("""onHallStart, onHall, onHome: flyHome,""","""onHallStart, onHall, onFly, onHome: flyHome,""")
open(p,'w').write(s)

p='/home/claude/portfolio/v5/js/data.js'; s=open(p).read()
rep("""    seeCode: "Code", available: "Disponible pour une alternance M1/M2"
  },""","""    seeCode: "Code", available: "Disponible pour une alternance M1/M2",
    flyLines: ["Wiiiii !", "Accrochez-vous !", "Livraison express !", "Raccourci aérien !"], flyChute: "Parachute ouvert ☂", mapHint: "Carte : cliquez une ville pour y sauter"
  },""")
rep("""    seeCode: "Code", available: "Available for a Master's work-study (M1/M2)"
  }""","""    seeCode: "Code", available: "Available for a Master's work-study (M1/M2)",
    flyLines: ["Wheeee!", "Hold on tight!", "Express delivery!", "Air shortcut!"], flyChute: "Parachute open ☂", mapHint: "Map: click a city to jump there"
  }""")
open(p,'w').write(s)

p='/home/claude/portfolio/v5/index.html'; s=open(p).read()
rep("""<svg class="minimap" id="minimap" viewBox="-68 -68 136 136" aria-hidden="true"></svg>""","""<div class="mm-wrap"><svg class="minimap" id="minimap" viewBox="-68 -68 136 136" aria-label="Carte"></svg><p class="mm-hint" data-i18n="mapHint"></p></div>
    <div class="fly-bubble" id="flyBubble" aria-live="polite"></div>""")
open(p,'w').write(s)

p='/home/claude/portfolio/v5/js/ride3d.js'; s=open(p).read()
rep("""      cooldown = armed = exiting = hall = null; lastSec""","""      cooldown = armed = exiting = hall = fly = null; lastSec""")
open(p,'w').write(s)

css='''
/* ==========================================================================
   v5 : fenêtres d'information plus grandes, carte cliquable, bulle de saut
   ========================================================================== */
@media (min-width: 821px) {
  .panel { top: calc(74px + env(safe-area-inset-top, 0px)); right: var(--gutter-r); width: min(880px, 60vw); max-height: calc(100% - 150px); padding: 34px 40px 28px; border-radius: 18px; font-size: 17px; line-height: 1.55; background: rgba(10,13,19,.9); }
  .p-kicker { font-size: 12.5px; margin-bottom: 10px; }
  .panel h2 { font-size: clamp(30px, 3.1vw, 46px); margin-bottom: 12px; }
  .p-lead { font-size: 19px; margin-bottom: 22px; max-width: 62ch; }
  .panel dl { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 30px; margin-bottom: 22px; }
  .panel dl div { padding-top: 14px; }
  .panel dt { font-size: 11.5px; }
  .panel dd { font-size: 16.5px; }
  .tags li { font-size: 13px; padding: .45em .85em; }
  .mail { font-size: 17px; }
}
@media (min-width: 821px) and (max-width: 1100px) { .panel { width: min(640px, 66vw); } .panel dl { grid-template-columns: 1fr; } }
.mm-wrap { position: absolute; left: var(--gutter-l); bottom: calc(18px + env(safe-area-inset-bottom, 0px)); z-index: 3; }
.mm-wrap .minimap { position: static; width: 210px; height: 210px; padding: 8px; }
.mm-hint { margin: 6px 0 0; width: 210px; text-align: center; font: 600 10px var(--f-mono); letter-spacing: .06em; color: rgba(255,255,255,.75); text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.mm-city, .mm-home { cursor: pointer; outline: none; }
.mm-hit { fill: transparent; }
.mm-pin { fill: #fff; stroke: var(--c); stroke-width: 1.6; transition: r .15s; }
.mm-name { fill: #fff; font: 700 5.4px var(--f-mono); text-anchor: middle; dominant-baseline: middle; opacity: 0; pointer-events: none; paint-order: stroke; stroke: rgba(8,10,16,.9); stroke-width: 2px; transition: opacity .15s; }
.mm-city:hover .mm-pin, .mm-city:focus-visible .mm-pin { r: 4.2; fill: var(--c); }
.mm-city:hover .mm-name, .mm-city:focus-visible .mm-name { opacity: 1; }
.mm-home:hover .mm-hub, .mm-home:focus-visible .mm-hub { fill: #fff; }
.mm-dot { pointer-events: none; }
.fly-bubble { position: absolute; left: 50%; top: 22%; z-index: 4; transform: translate(-50%, 10px) scale(.9); padding: 10px 18px; border-radius: 999px; background: #fff; color: #14121c; font: 800 20px var(--f-display); box-shadow: 0 10px 30px rgba(0,0,0,.35); opacity: 0; pointer-events: none; transition: opacity .2s, transform .35s cubic-bezier(.3,1.6,.5,1); }
.fly-bubble.on { opacity: 1; transform: translate(-50%, 0) scale(1); }
@media (max-width: 820px) { .mm-wrap { bottom: calc(100px + env(safe-area-inset-bottom, 0px)); } .mm-wrap .minimap { width: 130px; height: 130px; } .mm-hint { display: none; } }
@media (max-height: 520px) and (pointer: coarse) { .mm-wrap { display: none; } }
'''
open('/home/claude/portfolio/v5/css/style.css','a').write(css)
