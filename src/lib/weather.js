// Famille de temps (`sky` de weather.json, déduite du pictogramme MétéoSuisse par scripts/fetch-weather.mjs) →
// picto du widget (`icon`, clé de src/lib/weatherIcons.js) et libellé FR. Averses et pluie partagent le picto de
// la pluie ; seul le libellé les distingue.

const W = {
  none: { icon: 'none', desc: 'Pas de données' },
  sun: { icon: 'sun', desc: 'Ensoleillé' },
  partly: { icon: 'partly', desc: 'En partie ensoleillé' },
  'clear-night': { icon: 'clear-night', desc: 'Ciel dégagé' },
  'partly-night': { icon: 'partly-night', desc: 'Peu nuageux' },
  cloud: { icon: 'cloud', desc: 'Couvert' },
  fog: { icon: 'fog', desc: 'Brouillard' },
  snow: { icon: 'snow', desc: 'Chutes de neige' },
  sleet: { icon: 'sleet', desc: 'Pluie et neige' },
  storm: { icon: 'storm', desc: 'Orage' },
  showers: { icon: 'rain', desc: 'Averses' },
  rain: { icon: 'rain', desc: 'Pluie' },
};

export const skyOf = (sky) => W[sky] ?? W.none;

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

const TZ = 'Europe/Zurich';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Date du jour à l'heure suisse, AAAA-MM-JJ (même format que `days[].date`). */
export const todayKey = (now = Date.now()) => new Date(now).toLocaleDateString('sv-SE', { timeZone: TZ });

/**
 * Libellés d'un jour du bandeau 7 jours : initiale (« A » aujourd'hui, puis L, M, M, J, V, S, D), abréviation à
 * 3 lettres pour une fiche large (« Auj. », « Ven »…) et nom complet pour `title` / `aria-label` (lève M / M).
 */
export function weekDayLabels(date, today) {
  const d = new Date(`${date}T12:00`);
  if (date === today) return { initial: 'A', short: 'Auj.', full: 'Aujourd’hui' };
  const short = d.toLocaleDateString('fr-CH', { weekday: 'short' }).replace('.', '');
  return {
    initial: short[0].toUpperCase(),
    short: short[0].toUpperCase() + short.slice(1, 3),
    full: d.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

/**
 * Jours du week-end montré par le mode compact (AAAA-MM-JJ, heure suisse) : du lundi au samedi, le samedi et le
 * dimanche qui viennent (le samedi : aujourd'hui et demain) ; le dimanche, ce dimanche seul. Le week-end suivant
 * apparaît à minuit, dans la nuit du dimanche au lundi (décision du product owner, 05/11/2026).
 */
export function weekendDates(now = Date.now()) {
  const d = new Date(now);
  const [y, m, day] = d.toLocaleDateString('sv-SE', { timeZone: TZ }).split('-').map(Number);
  const i = WEEKDAYS.indexOf(d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ }));
  // Calcul à midi UTC : pas de décalage de date au passage à l'heure d'été ou d'hiver.
  const at = (offset) => new Date(Date.UTC(y, m - 1, day + offset, 12)).toISOString().slice(0, 10);
  return i === 6 ? [at(0)] : [at(5 - i), at(6 - i)];
}

/** « sam. 8 » (fr-CH). */
export const weekendLabel = (date) => new Date(`${date}T12:00`).toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric' });

export const hostOf = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
