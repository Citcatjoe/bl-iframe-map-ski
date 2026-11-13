// Suivi d'audience, comme bl-iframe-traffic : événements poussés dans window.blickDataLayer, que
// iframeHeightAdjustment.js relaie à la page parente (message TRACK, ou pont natif dans les apps). Avant le chargement
// du script, blickDataLayer est le tableau posé dans index.html : il est vidé vers la page au chargement. Toujours
// relire window.blickDataLayer à l'envoi (le script remplace le tableau par un objet { push }).
// Conventions des widgets Blick (bl-tool-*, bl-iframe-*) : `iframe_impression` au chargement, `iframe_click` à chaque
// action, `iframe_name` = widget, `iframe_id` = action ; les autres clés partent comme données de l'événement.

const params = new URLSearchParams(window.location.search);
const VARIANT = params.get('mode') === 'compact' ? 'compact' : 'explore';
// Stations suivies (`?points=`, dans les deux modes) : jointes à chaque événement, pour distinguer les intégrations.
const POINTS = params.get('points') || null;

// Contexte d'intégration (`?track=valais`) : suffixe du nom du widget, pour séparer dans les rapports les vues d'un
// même mode. Minuscules, chiffres et tirets ; sinon ignoré.
const TRACK = params.get('track')?.trim().toLowerCase() ?? '';
const SUFFIX = /^[a-z0-9][a-z0-9-]{0,39}$/.test(TRACK) ? `_${TRACK}` : '';
if (TRACK && !SUFFIX) console.warn(`?track=${TRACK} ignoré (minuscules, chiffres et tirets, 40 caractères au plus).`);

/** Nom du widget dans les rapports : un par mode et par contexte (`storytelling_meteo_ski_compact_valais`). */
export const IFRAME_NAME = `storytelling_meteo_ski_${VARIANT}${SUFFIX}`;

function push(event, iframeId, data) {
  const layer = window.blickDataLayer;
  if (!layer?.push) return;
  layer.push({ event, iframe_name: IFRAME_NAME, iframe_id: iframeId, ...(POINTS && { points: POINTS }), ...data });
}

/** Affichage du widget, une fois par chargement (StrictMode rejoue les effets en développement). */
let impressed = false;
export function trackImpression() {
  if (impressed) return;
  impressed = true;
  push('iframe_impression', 'iframe_impression');
}

/** Action de l'utilisateur : `iframe_<action>_clicked`, données facultatives (station, origine…). */
export const trackClick = (action, data) => push('iframe_click', `iframe_${action}_clicked`, data);
