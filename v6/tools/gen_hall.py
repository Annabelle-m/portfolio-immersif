#!/usr/bin/env python3
"""Génère la scène SVG du hall (v6.26) : façade vue de dehors, puis hall vu de dos de la voyageuse.
Usage : python3 tools/gen_hall.py   (réécrit le <svg id="hallSvg"> dans index.html)"""
import re, pathlib
VX, VY = 560, 440          # point de fuite du hall
FWX1, FWX2, FWY1, FWY2 = 420, 700, 392, 488   # mur du fond
def P(t, g, h):            # point du hall : t = profondeur (1 = mur du fond), g = -1..1 gauche/droite, h = -1 plafond .. 1 sol
    return (VX + 140 * t * g, VY + 48 * t * h)
def pt(p): return "%.1f,%.1f" % p
def line(a, b, **k):
    at = " ".join('%s="%s"' % (x.replace("_", "-"), v) for x, v in k.items())
    return '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" %s/>' % (a[0], a[1], b[0], b[1], at)
T = 16
o = []
# ------------------------------------------------ INTÉRIEUR : le hall vu de l'entrée
o.append('<g class="int"><g class="int-cam">')
o.append('<rect x="-1800" y="-1400" width="6000" height="3600" fill="#0a0e16"/>')
o.append('<polygon points="%s %s %s %s" fill="#070a11"/>' % (pt(P(1,-1,-1)), pt(P(1,1,-1)), pt(P(T,1,-1)), pt(P(T,-1,-1))))              # plafond
o.append('<polygon points="%s %s %s %s" fill="#0d1320"/>' % (pt(P(1,1,-1)), pt(P(1,1,1)), pt(P(T,1,1)), pt(P(T,1,-1))))                  # mur de droite
o.append('<polygon points="%s %s %s %s" fill="url(#iSkyL)"/>' % (pt(P(1,-1,-1)), pt(P(1,-1,1)), pt(P(T,-1,1)), pt(P(T,-1,-1))))           # mur de gauche : baie vitrée sur le tarmac
o.append('<polygon points="%s %s %s %s" fill="url(#iFloor)"/>' % (pt(P(1,-1,1)), pt(P(1,1,1)), pt(P(T,1,1)), pt(P(T,-1,1))))             # sol
# mur du fond : verrière sur le tarmac, avion au poste
o.append('<rect x="%d" y="%d" width="%d" height="%d" fill="url(#iSkyF)"/>' % (FWX1, FWY1, FWX2-FWX1, FWY2-FWY1))
o.append('<circle cx="560" cy="470" r="70" fill="url(#hGlow)" opacity=".65"/>')
o.append('<path d="M468 482 h150 l-8 -3 q-30 -2 -62 -4 l-22 -24 h-8 l8 24 h-26 l-12 -10 h-8 l6 14 h-24 q-8 0 -8 3 Z" fill="#0c111b" opacity=".92"/>')   # avion
o.append('<rect x="%d" y="%d" width="%d" height="3" fill="#06080d"/>' % (FWX1, FWY2-9, FWX2-FWX1))
for x in (467, 513, 560, 607, 653): o.append('<rect x="%d" y="%d" width="2.4" height="%d" fill="#06080d"/>' % (x, FWY1, FWY2-FWY1))
o.append('<g filter="url(#fb1)">')
# le panneau des départs, tout au fond du hall (le vrai panneau vient s'y poser en zoomant)
o.append('<g class="far-board"><ellipse cx="560" cy="437" rx="92" ry="52" fill="url(#hGlow)" opacity=".35"/><rect x="502" y="409" width="116" height="56" rx="4" fill="#0b0f17" stroke="#262d3b"/><rect x="502" y="409" width="116" height="11" rx="4" fill="#151b27"/><rect x="508" y="413" width="30" height="3" rx="1.5" fill="#ffc23d"/>')
for i in range(5):
    y = 425 + i*8
    o.append('<rect x="508" y="%d" width="14" height="3" fill="#ffc23d" opacity=".85"/><rect x="527" y="%d" width="%d" height="3" fill="#f4f6f8" opacity=".75"/><rect x="590" y="%d" width="22" height="3" fill="#52f59a" opacity="%s"/>' % (y, y, 28+((i*17)%26), y, ".9" if i==1 else ".45"))
o.append('</g>')
# plafond : bandes lumineuses + poutres
for g in (-.62, -.2, .2, .62):
    o.append(line(P(1.04,g,-1), P(T,g,-1), stroke="#ffe6b8", stroke_opacity=".7", stroke_width="5", stroke_linecap="round"))
for t in (1.35, 1.8, 2.4, 3.2, 4.4, 6.2, 9):
    a, b = P(t,-1,-1), P(t,1,-1); o.append(line(a, b, stroke="#18202f", stroke_width="%.1f" % (2.4*t)))
    for g in (-.62,-.2,.2,.62):
        c = P(t,g,-1); o.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#fff1d2" opacity=".5"/>' % (c[0], c[1]+1.6*t, 7*t*.4+4, 1.6*t))
# mur de gauche : meneaux et traverses de la baie
for t in (1.25, 1.6, 2.1, 2.8, 3.8, 5.2, 7.4, 11):
    a, b = P(t,-1,-1), P(t,-1,1); o.append(line(a, b, stroke="#06090f", stroke_width="%.1f" % (1.9*t)))
for h in (-.42, .5):
    o.append(line(P(1,-1,h), P(T,-1,h), stroke="#06090f", stroke_width="5"))
# mur de droite : comptoirs d'enregistrement et enseignes
for t0, t1 in ((1.35,1.9),(2.3,3.1),(3.7,4.9)):
    pts = [P(t0,.92,.55), P(t1,.92,.55), P(t1,.92,1), P(t0,.92,1)]
    o.append('<polygon points="%s" fill="#161e2e"/>' % " ".join(pt(p) for p in pts))
    top = [P(t0,.92,.55), P(t1,.92,.55), P(t1,.78,.55), P(t0,.78,.55)]
    o.append('<polygon points="%s" fill="#222c40"/>' % " ".join(pt(p) for p in top))
    a, b = P(t0+.12,.92,.1), P(t1-.12,.92,.1); o.append(line(a, b, stroke="#ffc23d", stroke_opacity=".7", stroke_width="%.1f" % (2.2*t0)))
o.append('</g>')
# rayons de soleil couchant à travers la baie, reflets des colonnes et de la verrière sur le sol poli
for k,(g0,g1) in enumerate(((-1,-.75),(-.78,-.52),(-.55,-.3))):
    o.append('<polygon points="%s %s %s %s" fill="#ffb86b" opacity="%.2f" filter="url(#fbl)"/>' % (pt(P(1.2,g0,1)), pt(P(1.2,g1,1)), pt(P(7,g1+.3,1)), pt(P(7,g0+.3,1)), 0.16 - k*.03))
o.append('<polygon points="%s %s %s %s" fill="#ffd9a0" opacity=".16" filter="url(#fbl)"/>' % (pt(P(1,-.12,1)), pt(P(1,.12,1)), pt(P(3,.3,1)), pt(P(3,-.3,1))))
# sol : carreaux et reflets des baies
o.append('<polygon points="%s %s %s %s" fill="url(#iGlint)"/>' % (pt(P(1,-1,1)), pt(P(1,-.3,1)), pt(P(T,-.3,1)), pt(P(T,-1,1))))
for k in range(-8, 9):
    g = k * .25; o.append(line(P(1,g,1), P(T,g,1), stroke="#fff", stroke_opacity=".05", stroke_width="2"))
for t in (1.12, 1.3, 1.55, 1.9, 2.4, 3.2, 4.4, 6.5, 10):
    o.append(line(P(t,-1,1), P(t,1,1), stroke="#fff", stroke_opacity=".05", stroke_width="2"))
o.append('<polygon points="%s %s %s %s" fill="#ffc98a" opacity=".07"/>' % (pt(P(1,-.18,1)), pt(P(1,.18,1)), pt(P(T,.5,1)), pt(P(T,-.5,1))))
# bloom des plafonniers
for t in (1.35, 1.8, 2.4, 3.2, 4.4):
    for g in (-.62,-.2,.2,.62):
        c = P(t,g,-1); o.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#ffe2ad" opacity=".22" filter="url(#fb)"/>' % (c[0], c[1]+3*t, 16*t*.5+8, 5*t))
# colonnes
for t in (1.7, 2.6, 3.8, 5.6):
    for g in (-.8, .8):
        x, y0, y1, w = VX + 140*t*g, VY-48*t, VY+48*t, 9.5*t
        o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#iCol)"/>' % (x-w/2, y0, w, y1-y0))
        o.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#000" opacity=".3" filter="url(#fb1)"/>' % (x, y1, w*.9, w*.2))
        o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#iRefl)" opacity=".35"/>' % (x-w/2, y1, w, 52*t*.5))
# enseignes suspendues
for t, wd in ((3.3, 220),):
    y0 = VY-48*t; cx = VX
    o.append(line((cx-wd/2+10, y0), (cx-wd/2+10, y0+t*8+16), stroke="#1d2536", stroke_width="2"))
    o.append(line((cx+wd/2-10, y0), (cx+wd/2-10, y0+t*8+16), stroke="#1d2536", stroke_width="2"))
    o.append('<rect x="%.1f" y="%.1f" width="%d" height="%.1f" rx="4" fill="#070a10" stroke="#262d3b"/>' % (cx-wd/2, y0+t*8+14, wd, 26+t*2))
    o.append('<text x="%d" y="%.1f" text-anchor="middle" class="hall-sign" style="font-size:%dpx">DÉPARTS · DEPARTURES</text>' % (cx, y0+t*8+14+18+t, 9+ int(t*1.4)))
o.append('<rect x="-1800" y="-1400" width="6000" height="3600" fill="url(#iVig)" pointer-events="none"/>')
o.append('</g>')   # fin int-cam
o.append('<rect class="dim" x="-1800" y="-1400" width="6000" height="3600" fill="#05070b" opacity="0" pointer-events="none"/>')
CHAR_ID = "int"
def girl(cls):
    arm = """<path d="M-7 0 C-11 22 -12 46 -11 68 L10 68 C11 46 10 22 7 0 Z" fill="url(#gCoat)"/><path d="M-11 63 H10 V70 H-11 Z" fill="#c2ab7e"/><path d="M-8 70 C-9 79 -6 86 0 87 C6 86 9 79 8 70 Z" fill="url(#gSkin)"/>"""
    leg = """<path d="M-24 -148 C-28 -112 -26 -92 -24 -72 C-22 -52 -23 -32 -20 -14 L-4 -14 C-3 -34 -3 -52 -2 -74 C-1 -102 0 -126 -2 -148 Z" fill="url(#%s)"/><path d="M-20 -14 L-4 -14 C-2 -7 -1 -2 -2 1 L-23 1 C-24 -4 -23 -9 -20 -14 Z" fill="url(#gShoe)"/><path d="M-23 -1 H-2" stroke="#120d09" stroke-width="3" stroke-linecap="round"/>"""
    return """<g class="char %s"><g class="sway"><g class="bob">
  <ellipse cx="6" cy="3" rx="62" ry="10" fill="#000" opacity=".5" filter="url(#fb)"/>
  <g class="leg l">""" % cls + leg % "gTrou" + """</g>
  <g class="leg r"><g transform="scale(-1,1)">""" + leg % "gTrouR" + """</g></g>
  <g class="arm l"><g transform="translate(-35,-246)"><g class="armi">""" + arm + """</g></g></g>
  <path d="M-28 -250 C-18 -259 18 -259 28 -250 C35 -246 39 -230 39 -210 C39 -190 41 -170 43 -146 C44 -139 44 -134 43 -128 C20 -121 -20 -121 -43 -128 C-44 -134 -44 -139 -43 -146 C-41 -170 -39 -190 -39 -210 C-39 -230 -35 -246 -28 -250 Z" fill="url(#gCoat)"/>
  <path d="M-43 -146 C-20 -139 20 -139 43 -146 L43 -128 C20 -121 -20 -121 -43 -128 Z" fill="#c2ab7e"/>
  <path d="M-28 -250 C-18 -259 -6 -259 -2 -258 L-4 -122 C-20 -122 -32 -124 -43 -128 C-44 -134 -44 -139 -43 -146 C-41 -170 -39 -190 -39 -210 C-39 -230 -35 -246 -28 -250 Z" fill="#fff" opacity=".12"/>
  <path d="M28 -250 C35 -246 39 -230 39 -210 C39 -190 41 -170 43 -146 C44 -139 44 -134 43 -128 C34 -126 28 -125 22 -124 C27 -160 29 -210 25 -252 Z" fill="#000" opacity=".14"/>
  <g stroke="#9c8558" stroke-opacity=".4" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M-30 -160 C-31 -148 -33 -138 -35 -126"/><path d="M30 -160 C31 -148 33 -138 36 -126"/><path d="M-38 -222 C-36 -210 -36 -196 -37 -184"/></g>
  <path d="M-16 -258 C-6 -251 6 -251 16 -258 L14 -250 C5 -243 -5 -243 -14 -250 Z" fill="#c2ab7e"/>
  <path d="M-29 -243 C-37 -228 -38 -202 -34 -184" stroke="#6a361a" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M29 -243 C37 -228 38 -202 34 -184" stroke="#6a361a" stroke-width="7" stroke-linecap="round" fill="none"/>
  <g class="pack"><path d="M-31 -239 C-31 -246 -25 -250 -18 -250 H18 C25 -250 31 -246 31 -239 V-178 C31 -169 27 -165 20 -165 H-20 C-27 -165 -31 -169 -31 -178 Z" fill="url(#gBag)"/>
    <path d="M-32 -249 H32 C33 -232 31 -219 28 -212 C10 -207 -10 -207 -28 -212 C-31 -219 -33 -232 -32 -249 Z" fill="#6a361a"/><path d="M-28 -214 C-10 -209 10 -209 28 -214" stroke="#c9a24a" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>
    <rect x="-21" y="-198" width="42" height="26" rx="6" fill="#6a361a"/><rect x="-21" y="-198" width="42" height="26" rx="6" fill="none" stroke="#c9a24a" stroke-opacity=".35" stroke-width="1.2"/>
    <path d="M-12 -210 V-192 M12 -210 V-192" stroke="#4d2813" stroke-width="5" stroke-linecap="round"/><rect x="-16" y="-198" width="8" height="7" rx="1.5" fill="#c9a24a"/><rect x="8" y="-198" width="8" height="7" rx="1.5" fill="#c9a24a"/>
    <path d="M-10 -250 C-10 -258 10 -258 10 -250" stroke="#4d2813" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M-31 -239 C-31 -246 -25 -250 -18 -250 H-8 L-12 -165 H-20 C-27 -165 -31 -169 -31 -178 Z" fill="#fff" opacity=".1"/></g>
  <g class="arm r"><g transform="translate(35,-246) scale(-1,1)"><g class="armi">""" + arm + """</g></g></g>
  <path d="M-6 -272 C-6 -266 -7 -260 -8 -254 H8 C7 -260 6 -266 6 -272 Z" fill="url(#gSkin)"/>
  <g class="head"><ellipse cx="-17" cy="-282" rx="2.6" ry="5.2" fill="#e2b393"/><ellipse cx="17" cy="-282" rx="2.6" ry="5.2" fill="#e2b393"/>
    <path d="M-17.5 -284 C-19 -302 -9 -309 0 -309 C9 -309 19 -302 17.5 -284 C17 -272 11 -264 0 -264 C-11 -264 -17 -272 -17.5 -284 Z" fill="url(#gHair)"/>
    <path d="M0 -309 C-12 -306 -16 -296 -15 -284" stroke="#8a5a3f" stroke-opacity=".45" stroke-width="1.6" fill="none"/><path d="M4 -308 C12 -304 15 -296 15 -286" stroke="#8a5a3f" stroke-opacity=".3" stroke-width="1.4" fill="none"/>
    <ellipse cx="0" cy="-316" rx="11" ry="10" fill="url(#gHair)"/><path d="M-6 -319 C-2 -323 4 -323 7 -319" stroke="#8a5a3f" stroke-opacity=".5" stroke-width="1.4" fill="none"/>
    <path d="M-9 -270 C-4 -266 4 -266 9 -270 L8 -264 C3 -261 -3 -261 -8 -264 Z" fill="url(#gSkin)"/></g>
</g></g></g>"""
o.append('</g>')
interior = "\n".join(o)
# ------------------------------------------------ EXTÉRIEUR : la façade vue du parvis
D = 560
e = []
e.append('<g class="ext"><g class="ext-cam">')
e.append('<rect x="-1800" y="-1400" width="6000" height="4000" fill="url(#eSky)"/>')
e.append('<polygon points="-1800,252 2900,252 2900,640 -1800,640" fill="#0d121c"/><rect x="-1800" y="244" width="4700" height="10" fill="#1a2233"/>')
e.append('<rect x="-1800" y="296" width="4700" height="324" fill="url(#eGlassIn)"/>')
# intérieur chaud derrière les vitres
for x in range(-1300, 2500, 190):
    e.append(line((x, 296), (VX + (x - VX)*.18, 460), stroke="#ffe6b8", stroke_opacity=".22", stroke_width="4"))
e.append('<rect x="-1800" y="462" width="4700" height="158" fill="#2a1c12" opacity=".7"/>')
for x in range(-1300, 2500, 190):
    if 300 < x < 840: continue
    e.append('<rect x="%d" y="296" width="9" height="324" fill="#06090f"/>' % x)
e.append('<rect x="-1800" y="392" width="4700" height="9" fill="#06090f"/>')
e.append('<polygon points="-1800,296 -1500,296 -1800,620" fill="url(#hShine)" opacity=".5"/>')
e.append('<g fill="url(#hShine)"><polygon points="140,296 250,296 40,620 -70,620"/><polygon points="1000,296 1120,296 900,620 780,620"/><polygon points="1500,296 1600,296 1380,620 1280,620"/></g>')
# auvent
e.append('<rect x="250" y="326" width="620" height="22" fill="#05070c"/><rect x="250" y="346" width="620" height="3" fill="#2d3850"/>')
for x in (300, 420, 540, 660, 780): e.append('<ellipse cx="%d" cy="351" rx="30" ry="5" fill="#ffe0a3" opacity=".6"/>' % x)
# bloc porte (décalé pour que son axe soit x = 560)
door = '''<g transform="translate(200,0)" class="door">
<rect x="136" y="348" width="448" height="60" fill="#0f1623"/><rect x="136" y="348" width="448" height="3" fill="#2d3850"/>
<rect x="186" y="360" width="348" height="36" rx="4" fill="#070a10" stroke="#ffc23d" stroke-opacity=".7"/>
<text x="392" y="383" text-anchor="middle" class="hall-sign" style="font-size:11px;letter-spacing:.06em">AÉROPORT · BORDEAUX-MÉRIGNAC</text>
<path d="M207 380 l16 -3 l6 -10 h4 l-3 10 l11 -1 l3 -4 h3 l-1 7 l1 7 h-3 l-3 -4 l-11 -1 l3 10 h-4 l-6 -10 l-16 -3 Z" fill="#ffc23d" transform="translate(18,-2)"/>
<rect x="136" y="402" width="448" height="6" fill="#1b2434"/>
<g class="leaf l"><rect x="220" y="408" width="140" height="212" fill="#ffd9a0" opacity=".05"/><rect x="223" y="411" width="134" height="206" fill="none" stroke="#3a4558" stroke-width="7"/><rect x="223" y="598" width="134" height="19" fill="#262f40"/><rect x="223" y="505" width="134" height="22" fill="#fff" opacity=".1"/><polygon points="240,411 288,411 252,598 204,598" fill="url(#hShine)" opacity=".8"/><rect x="342" y="470" width="6" height="74" rx="3" fill="#c7cfdc"/></g>
<g class="leaf r"><rect x="360" y="408" width="140" height="212" fill="#ffd9a0" opacity=".05"/><rect x="363" y="411" width="134" height="206" fill="none" stroke="#3a4558" stroke-width="7"/><rect x="363" y="598" width="134" height="19" fill="#262f40"/><rect x="363" y="505" width="134" height="22" fill="#fff" opacity=".1"/><polygon points="392,411 440,411 404,598 356,598" fill="url(#hShine)" opacity=".8"/><rect x="372" y="470" width="6" height="74" rx="3" fill="#c7cfdc"/></g>
<g><rect x="140" y="408" width="80" height="212" fill="#ffd9a0" opacity=".04"/><rect x="143" y="411" width="74" height="206" fill="none" stroke="#2d3748" stroke-width="7"/><rect x="143" y="505" width="74" height="22" fill="#fff" opacity=".1"/>
<rect x="500" y="408" width="80" height="212" fill="#ffd9a0" opacity=".04"/><rect x="503" y="411" width="74" height="206" fill="none" stroke="#2d3748" stroke-width="7"/><rect x="503" y="505" width="74" height="22" fill="#fff" opacity=".1"/></g>
<rect x="136" y="617" width="448" height="6" fill="#06090f"/></g>'''
e.append(door)
# parvis
e.append('<rect x="-1800" y="620" width="4700" height="1100" fill="url(#ePave)"/><rect x="-1800" y="620" width="4700" height="4" fill="#3a4152"/>')
for k in range(-14, 15):
    x = VX + k * 150; e.append(line((x, 1500), (VX + (x - VX)*.07, 622), stroke="#fff", stroke_opacity=".045", stroke_width="2"))
for y in (636, 655, 682, 720, 775, 855, 980, 1160):
    e.append(line((-1800, y), (2900, y), stroke="#fff", stroke_opacity=".045", stroke_width="2"))
e.append('<polygon class="spill" points="340,622 780,622 1150,1500 -30,1500" fill="url(#eSpill)"/>')
e.append('<polygon points="340,626 780,626 830,668 290,668" fill="#0c1018" stroke="#1d2432" stroke-width="2"/>')
for lx in (60, 1040):
    e.append('<g><rect x="%d" y="396" width="6" height="228" fill="#0a0e16"/><circle cx="%d" cy="394" r="26" fill="url(#hGlow)" opacity=".85"/><ellipse cx="%d" cy="628" rx="34" ry="6" fill="#000" opacity=".4"/></g>' % (lx, lx+3, lx+3))
for bx in (170, 930): e.append('<g transform="translate(%d,660)"><ellipse cx="0" cy="6" rx="22" ry="5" fill="#000" opacity=".45"/><rect x="-9" y="-46" width="18" height="48" rx="7" fill="#1a2132"/><rect x="-9" y="-46" width="18" height="6" rx="3" fill="#ffc23d" opacity=".8"/></g>' % bx)
e.append('<ellipse class="flare" cx="560" cy="570" rx="330" ry="230" fill="url(#hGlow)"/>')
e.append('<rect x="-1800" y="-1400" width="6000" height="4000" fill="url(#eVig)" pointer-events="none"/>')
e.append('</g></g>')
exterior = "\n".join(e)
defs = '''<defs>
<linearGradient id="eSky" gradientUnits="userSpaceOnUse" x1="0" y1="-400" x2="0" y2="300"><stop offset="0" stop-color="#0d1330"/><stop offset=".55" stop-color="#3b3160"/><stop offset=".86" stop-color="#cf6a4e"/><stop offset="1" stop-color="#ffb347"/></linearGradient>
<linearGradient id="eGlassIn" gradientUnits="userSpaceOnUse" x1="0" y1="296" x2="0" y2="620"><stop offset="0" stop-color="#1a1420"/><stop offset=".5" stop-color="#5a3a24"/><stop offset="1" stop-color="#a8723a"/></linearGradient>
<linearGradient id="ePave" gradientUnits="userSpaceOnUse" x1="0" y1="620" x2="0" y2="1100"><stop offset="0" stop-color="#1b2130"/><stop offset="1" stop-color="#10141d"/></linearGradient>
<linearGradient id="eSpill" gradientUnits="userSpaceOnUse" x1="0" y1="620" x2="0" y2="1100"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".62"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></linearGradient>
<radialGradient id="eVig" cx=".5" cy=".5" r=".8"><stop offset=".6" stop-color="#05070b" stop-opacity="0"/><stop offset="1" stop-color="#05070b" stop-opacity=".7"/></radialGradient>
<linearGradient id="iSkyL" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="900"><stop offset="0" stop-color="#0f1630"/><stop offset=".4" stop-color="#4b3b63"/><stop offset=".5" stop-color="#d4694f"/><stop offset=".58" stop-color="#ffbe4a"/><stop offset=".66" stop-color="#6b3f46"/><stop offset="1" stop-color="#1a1822"/></linearGradient>
<linearGradient id="iSkyF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f5e"/><stop offset=".55" stop-color="#d4694f"/><stop offset="1" stop-color="#ffbe4a"/></linearGradient>
<linearGradient id="iFloor" gradientUnits="userSpaceOnUse" x1="0" y1="488" x2="0" y2="900"><stop offset="0" stop-color="#2a2530"/><stop offset=".25" stop-color="#171d2b"/><stop offset="1" stop-color="#0d121c"/></linearGradient>
<linearGradient id="iGlint" gradientUnits="userSpaceOnUse" x1="0" y1="488" x2="0" y2="900"><stop offset="0" stop-color="#ffb064" stop-opacity=".5"/><stop offset="1" stop-color="#ffb064" stop-opacity="0"/></linearGradient>
<linearGradient id="iRefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dfe9" stop-opacity=".8"/><stop offset="1" stop-color="#d9dfe9" stop-opacity="0"/></linearGradient>
<linearGradient id="iCol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dfe9"/><stop offset=".55" stop-color="#8d97a8"/><stop offset="1" stop-color="#3b4558"/></linearGradient>
<radialGradient id="iVig" cx=".35" cy=".55" r=".85"><stop offset=".55" stop-color="#05070b" stop-opacity="0"/><stop offset="1" stop-color="#05070b" stop-opacity=".7"/></radialGradient>
<linearGradient id="hShine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="hGlow"><stop offset="0" stop-color="#fff2cf" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb347" stop-opacity=".45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<linearGradient id="gCoat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ecdcb6"/><stop offset=".45" stop-color="#d9c49b"/><stop offset="1" stop-color="#b19a6c"/></linearGradient>
<linearGradient id="gTrou" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#434d63"/><stop offset="1" stop-color="#232a38"/></linearGradient>
<linearGradient id="gShoe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a352a"/><stop offset="1" stop-color="#241810"/></linearGradient>
<linearGradient id="gTrouR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b4458"/><stop offset="1" stop-color="#1c2230"/></linearGradient>
<linearGradient id="gSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eebf9f"/><stop offset="1" stop-color="#c0906f"/></linearGradient>
<linearGradient id="gBag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a35a2d"/><stop offset=".5" stop-color="#8b4a25"/><stop offset="1" stop-color="#5c2e16"/></linearGradient>
<filter id="fb" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="fb1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter>
<filter id="fbl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<linearGradient id="gHair" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#63402c"/><stop offset="1" stop-color="#321c10"/></linearGradient>
<linearGradient id="gCase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#34496f"/><stop offset=".5" stop-color="#22304f"/><stop offset="1" stop-color="#0f1626"/></linearGradient>
</defs>'''
svg = '<svg id="hallSvg" viewBox="0 0 1600 900" preserveAspectRatio="xMinYMax slice" focusable="false">\n' + defs + '\n' + interior + '\n' + exterior + '\n      </svg>'
p = pathlib.Path(__file__).resolve().parent.parent / "index.html"
s = p.read_text(encoding="utf8")
s2 = re.sub(r'<svg id="hallSvg".*?</svg>', lambda m: svg, s, count=1, flags=re.S)
assert s2 != s or svg in s
p.write_text(s2, encoding="utf8"); print("ok", len(svg))
