// Configuration centrale de la carte. Le fournisseur n'est pas tranché
// (ETAT-DU-PROJET.md § 4.3) : tout ce qui dépend de lui passe par ici.

const env = import.meta.env;

/** 'maplibre' (défaut, sans token) | 'mapbox' (style Studio Blick + token). */
export const MAP_ENGINE = env.VITE_MAP_ENGINE === 'mapbox' ? 'mapbox' : 'maplibre';

export const MAP_STYLE_URL = env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';

export const MAPBOX_TOKEN = env.VITE_MAPBOX_TOKEN || '';

/**
 * Attribution affichée dans le pied de page (contrôle d'attribution natif désactivé).
 * OpenFreeMap exige « OpenFreeMap © OpenMapTiles © OpenStreetMap » ; le relief (tuiles Terrarium) exige Mapzen.
 */
export const MAP_ATTRIBUTION =
  MAP_ENGINE === 'mapbox'
    ? 'Carte © Mapbox © OpenStreetMap · Relief Mapzen'
    : 'Carte OpenFreeMap © OpenMapTiles © OpenStreetMap · Relief Mapzen';

/** Relief ombré (AWS Terrarium, dataset public sans SLA). */
export const HILLSHADE = {
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  maxzoom: 12,
  paint: {
    'hillshade-shadow-color': '#6A6262',
    'hillshade-highlight-color': '#FFFFFF',
    'hillshade-accent-color': '#A5A1A1',
    'hillshade-exaggeration': 0.3,
    'hillshade-illumination-direction': 315,
  },
};

/** Contours CH (non officiels, à remplacer par swissBOUNDARIES3D). Relatifs à la racine du build. */
export const CH_OUTLINE_URL = 'data/ch.geojson'; // filtre `within` des localités
export const CH_PRECISE_URL = 'data/ch-precise.geojson'; // trame extérieure

export const CH_BOUNDS = [[5.95, 45.82], [10.49, 47.81]];
export const MAX_BOUNDS = [[4.5, 45.2], [11.8, 48.4]];

/** Couches de localités du style Positron (ignorées si absentes du style). */
export const PLACE_LAYERS = ['label_city_capital', 'label_city', 'label_town', 'label_village', 'label_other', 'label_state'];

export const FIT_PADDING = {
  wide: { top: 40, bottom: 30, left: 30, right: 60 },
  mid: { top: 56, bottom: 24, left: 24, right: 56 },
  mobile: { top: 24, bottom: 16, left: 16, right: 50 },
};

/** Gestes coopératifs (Ctrl/⌘ + molette, 2 doigts) : la carte ne capture pas le scroll de l'article. */
export const COOPERATIVE_GESTURES = true;

export const FLY = { speed: 1.1, curve: 1.5 };
/** Zoom minimal d'un vol vers un domaine, selon son niveau. */
export const FOCUS_ZOOM = { 1: 9.2, 2: 9.2, 3: 9.8 };
/** Décalage du vol en 632 px pour ne pas passer sous le panneau. */
export const MID_FLY_OFFSET = [156, 0];

/** Seuils de révélation par niveau (D3) ; les « stations de niveau 1 » sont toujours visibles. */
export const LEVEL_MIN_ZOOM = { 1: 0, 2: 7.6, 3: 8.6 };
export const NARROW_ZOOM_OFFSET = 0.6; // 632 px et mobile
export const HYSTERESIS = 0.15;
/** En dessous de ce zoom, hors 964 px : pastille compacte sans nom (D10). */
export const NAME_MIN_ZOOM = 7.4;
