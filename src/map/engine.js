import { MAP_ENGINE, MAPBOX_TOKEN } from '../config/mapConfig';

// MapLibre GL et Mapbox GL ont une API compatible : seul le chargement diffère.
// Le moteur non utilisé n'est jamais téléchargé (import dynamique).

let enginePromise = null;

export function loadMapEngine() {
  enginePromise ??= (async () => {
    if (MAP_ENGINE === 'mapbox') {
      const [{ default: mapboxgl }] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')]);
      if (!MAPBOX_TOKEN) console.warn('VITE_MAPBOX_TOKEN manquant : la carte Mapbox ne se chargera pas.');
      mapboxgl.accessToken = MAPBOX_TOKEN;
      return mapboxgl;
    }
    const [mod] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
    return mod.default ?? mod;
  })();
  return enginePromise;
}

/** Textes de l'interface de la carte, en français (clés MapLibre et Mapbox). */
export const MAP_LOCALE = {
  // MapLibre
  'CooperativeGesturesHandler.WindowsHelpText': 'Utilise Ctrl + molette pour zoomer',
  'CooperativeGesturesHandler.MacHelpText': 'Utilise ⌘ + molette pour zoomer',
  'CooperativeGesturesHandler.MobileHelpText': 'Utilise deux doigts pour déplacer la carte',
  // Mapbox
  'ScrollZoomBlocker.CtrlMessage': 'Utilise Ctrl + molette pour zoomer',
  'ScrollZoomBlocker.CmdMessage': 'Utilise ⌘ + molette pour zoomer',
  'TouchPanBlocker.Message': 'Utilise deux doigts pour déplacer la carte',
};
