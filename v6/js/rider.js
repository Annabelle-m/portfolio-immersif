/* ==========================================================================
   La voyageuse de la page d'accueil, sur son scooter.
   Chignon brun, veste beige ample, jean foncé, sac à dos en cuir brun.
   Repère local : avant = +z, haut = +y, x = côté (gauche de la conductrice).
   ========================================================================== */

function buildRider() {
  if (typeof TPL !== "undefined" && TPL.rider) { const mb = new MB(); stampM(mb, "rider", M4.id(), null, null); return GLR.mesh(mb); }
  const mb = new MB(), L = new Loc(mb, [0, 0, 0], 0);
  const body = "#9fd3c4", bodyD = "#6fb3a2", chrome = "#c9ced3", tire = "#151515", seat = "#4a2f22";
  const skin = "#e2b393", hair = "#4a2b1c", jacket = "#d9c49b", jacketD = "#c7b086", jeans = "#2f3542", leather = "#8b4a25", leatherD = "#6a361a", shoe = "#2a1d16";

  // --- scooter ---
  [[-0.62, .27], [0.66, .27]].forEach(([z, y]) => { L.cyl(.07, y, z, .27, .14, 16, tire, 0, 1, 0, Math.PI / 2); L.cyl(.075, y, z, .14, .15, 10, chrome, 0, 1, 0, Math.PI / 2); });
  L.sph(0, .56, -.42, .36, .3, .56, body, 0, 18, 12);                       // coque arrière
  L.sph(0, .5, -.42, .38, .2, .58, bodyD, 0, 16, 8);
  L.box(0, .28, .12, .36, .1, .62, "#2b2d30");                                // plancher
  L.box(0, .28, .5, .5, .82, .1, body, 0, 0, -.22);                           // tablier
  L.sph(0, .5, .68, .17, .22, .26, body, 0, 12, 8);                          // garde-boue avant
  L.cyl(0, .55, .58, .045, .55, 8, chrome, 0, 1, -.22);                       // colonne
  L.box(0, 1.06, .48, .74, .07, .1, "#2a2b2e");                               // guidon
  L.box(0, 1.02, .5, .2, .16, .2, body);
  L.sph(0, 1.04, .62, .085, .085, .05, "#fff6dc", 1, 10, 6);                  // phare
  [-1, 1].forEach((sd) => { L.seg([sd * .3, 1.08, .48], [sd * .4, 1.3, .44], .015, chrome, 5); L.sph(sd * .42, 1.33, .44, .07, .05, .02, "#dfe5ea", 0, 8, 5); L.cyl(sd * .37, 1.04, .48, .035, .12, 8, "#1b1b1b", 0, 1, 0, Math.PI / 2); });
  L.sph(0, .84, -.3, .2, .07, .4, seat, 0, 12, 6);                            // selle
  L.box(0, .58, -.98, .2, .07, .03, "#c51f2c", 1);                            // feu arrière
  L.box(0, .42, -.99, .22, .11, .02, "#f2f2f2"); L.box(-.1, .42, -1.0, .02, .11, .01, "#1d3f8f");
  L.box(0, .7, -.8, .34, .05, .3, chrome);                                    // porte-bagages

  // --- la voyageuse ---
  L.sph(0, .95, -.32, .19, .12, .17, jeans, 0, 10, 6);                        // bassin
  [-1, 1].forEach((sd) => {
    L.seg([sd * .12, .95, -.3], [sd * .15, .98, .12], .085, jeans, 8);       // cuisses
    L.seg([sd * .15, .98, .12], [sd * .15, .38, .26], .07, jeans, 8, .85);   // tibias
    L.box(sd * .15, .3, .3, .11, .09, .25, shoe);                            // chaussures
  });
  // buste (veste ample), légèrement penché
  L.seg([0, .96, -.33], [0, 1.43, -.24], .2, jacket, 12, .92);
  L.sph(0, 1.42, -.24, .2, .1, .14, jacket, 0, 10, 6);
  L.box(0, .92, -.35, .42, .2, .3, jacketD, 0, -.1);                          // bas de la veste
  // bras vers le guidon
  [-1, 1].forEach((sd) => {
    L.sph(sd * .2, 1.38, -.22, .085, .085, .085, jacket, 0, 8, 6);
    L.seg([sd * .21, 1.38, -.22], [sd * .29, 1.18, .08], .07, jacket, 8, .9);
    L.seg([sd * .29, 1.18, .08], [sd * .36, 1.07, .43], .058, jacket, 8, .85);
    L.sph(sd * .37, 1.06, .46, .045, .045, .05, skin, 0, 8, 6);
  });
  // tête et chignon
  L.cyl(0, 1.48, -.22, .055, .1, 8, skin);
  L.sph(0, 1.64, -.2, .105, .125, .115, skin, 0, 14, 10);
  L.sph(0, 1.665, -.225, .115, .125, .12, hair, 0, 14, 10);                  // cheveux (arrière et dessus)
  L.sph(0, 1.79, -.26, .068, .06, .068, hair, 0, 10, 8);                      // chignon
  L.sph(0, 1.62, -.31, .05, .045, .03, hair, 0, 8, 6);
  // sac à dos en cuir
  L.box(0, 1.0, -.48, .34, .44, .17, leather);
  L.box(0, 1.3, -.49, .35, .16, .19, leatherD, 0, .25);                       // rabat
  L.box(0, 1.08, -.57, .24, .16, .05, leatherD);                              // poche avant
  [-1, 1].forEach((sd) => { L.box(sd * .07, 1.14, -.575, .03, .1, .02, "#c9a24a"); L.box(sd * .12, 1.0, -.4, .04, .46, .05, leatherD); L.seg([sd * .12, 1.42, -.4], [sd * .13, 1.45, -.27], .022, leatherD, 5); });
  L.box(0, 1.47, -.47, .1, .03, .05, leatherD);                               // poignée
  return GLR.mesh(mb);
}
