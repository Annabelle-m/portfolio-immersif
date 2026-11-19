# Editing the content

All text lives in [`v6/js/data.js`](../v6/js/data.js). You do not need to touch
the 3D code to change what the portfolio says.

## `PROFILE`

```js
const PROFILE = {
  name, email, linkedin, github,
  cv: "assets/cv/Annabelle_MEGY_CV.pdf",   // path relative to v6/
  role:  { fr, en },
  base:  { fr, en },
  pitch: { fr, en }
};
```

To update the CV, replace the PDF in `v6/assets/cv/` (or change `cv`).

## `UI`

Interface strings, one object per language (`UI.fr`, `UI.en`). Both objects
must have the same keys. Elements in `index.html` use `data-i18n="key"` (plain
text) or `data-i18n-html="key"` (HTML allowed).

## `WORLDS`

An ordered array, in the order of the road loop.

```js
{
  id: "japan",             // unique id
  section: "experience",   // key into UI[lang].sections
  code: "HND", flight: "AM 303", gate: "C07", time: "11:05",   // departures board
  country: { fr, en },
  label:   { fr, en },
  accent: "#...",          // colour used on the board and hub
  cities: [ /* see below */ ]
}
```

### A city

```js
{
  id: "kyoto",
  amb: "kyoto",            // lighting mood (key in AMB3, world.js)
  name: "Kyoto",
  contact: true,           // optional: shows e-mail and LinkedIn links
  postcard: true,          // optional: shows the postcard form
  panel: {
    fr: { kicker, title, lead, items: [[label, text], ...], tags: [...] },
    en: { ...same shape... }
  }
}
```

Panel fields:

- `kicker`: small line above the title.
- `title`, `lead`: heading and intro.
- `items`: list of `[label, text]` pairs.
- `tags`: chips shown at the bottom.

## Adding a city

1. Add the city object to the right world in `WORLDS`, with both `fr` and `en` panels.
2. Add a lighting mood in `AMB3` (`v6/js/world.js`), keyed by the same name as `amb`.
3. Add its scenery style: a building and prop style in `STYLE_BLD` and `STYLE_PROPS`, and a landmark in `LANDMARK` if it has one.
4. Optionally add a sound profile in `SCENE` (`v6/js/audio.js`). Without one, no ambience layer plays.
5. Reload and ride to check the placement and the panel.

## Adding a world

Do the same as for a city, then also:

- Add a `KEY` entry for the music in `audio.js`.
- Check the ring road length and the hub spokes in `NET` (`world.js`), since the network is derived from the number of worlds and cities.

## Translating

Language codes are `fr` and `en`. To add one, extend every `{ fr, en }` object,
`UI`, and the language toggle in `app.js` (`applyLang`).
