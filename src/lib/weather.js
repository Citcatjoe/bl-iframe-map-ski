// Mapping code WMO → picto Font Awesome, couleur et libellé FR.
// `glyph`/`weight` servent au rendu canvas des pastilles (police FA 6 Free).

const SUN = '#E0A800';
const GREY = '#6A6262';
const SNOW = '#2E7BD6';
const DARK = '#121010';

const W = {
  none: { icon: 'fa-solid fa-circle-question', glyph: '\uf059', weight: 900, color: GREY, desc: 'Pas de données' },
  sun: { icon: 'fa-solid fa-sun', glyph: '\uf185', weight: 900, color: SUN, desc: 'Ensoleillé' },
  partly: { icon: 'fa-solid fa-cloud-sun', glyph: '\uf6c4', weight: 900, color: SUN, desc: 'Peu nuageux' },
  cloud: { icon: 'fa-solid fa-cloud', glyph: '\uf0c2', weight: 900, color: GREY, desc: 'Couvert' },
  fog: { icon: 'fa-solid fa-smog', glyph: '\uf75f', weight: 900, color: GREY, desc: 'Brouillard' },
  snow: { icon: 'fa-regular fa-snowflake', glyph: '\uf2dc', weight: 400, color: SNOW, desc: 'Chutes de neige' },
  storm: { icon: 'fa-solid fa-cloud-bolt', glyph: '\uf76c', weight: 900, color: DARK, desc: 'Orage' },
  showers: { icon: 'fa-solid fa-cloud-showers-heavy', glyph: '\uf740', weight: 900, color: DARK, desc: 'Averses' },
  rain: { icon: 'fa-solid fa-cloud-rain', glyph: '\uf73d', weight: 900, color: DARK, desc: 'Pluie' },
};

export function wmo(code) {
  if (code == null) return W.none;
  if (code === 0) return W.sun;
  if (code <= 2) return W.partly;
  if (code === 3) return W.cloud;
  if (code === 45 || code === 48) return W.fog;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return W.snow;
  if (code >= 95) return W.storm;
  if (code >= 80) return W.showers;
  return W.rain;
}

/** Couleur du picto dans l'UI HTML : les gris/noirs suivent le thème. */
export function uiIconColor(w) {
  if (w.color === GREY) return 'var(--color-icon-weak)';
  if (w.color === DARK) return 'var(--color-icon-default)';
  return w.color;
}

export const fmtTemp = (t) => (t == null || Number.isNaN(t) ? '–' : `${Math.round(t)}°`.replace('-', '−'));
export const fmtSnow = (s) => (s == null ? '–' : `${Math.round(s)} cm`);
export const fmtWind = (w) => (w == null ? '–' : `${Math.round(w)} km/h`);
/** « 2 970 m » (séparateur de milliers fr-CH). */
export const fmtAltitude = (m) => (m == null ? '–' : `${Math.round(m).toLocaleString('fr-CH')} m`);

/** Libellé de jour : Aujourd'hui / Demain / jour abrégé (fr-CH). */
export function dayLabel(date, index, short = false) {
  if (index === 0) return short ? 'Auj.' : 'Aujourd’hui';
  if (index === 1) return short ? 'Dem.' : 'Demain';
  return new Date(`${date}T12:00`).toLocaleDateString('fr-CH', { weekday: 'short' }).replace('.', '');
}

export const hostOf = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
