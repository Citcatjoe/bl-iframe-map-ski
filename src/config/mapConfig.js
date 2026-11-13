// Configuration centrale de la carte. Le fournisseur n'est pas tranché
// (ETAT-DU-PROJET.md § 4.3) : tout ce qui dépend de lui passe par ici.

const env = import.meta.env;

/** 'maplibre' (défaut, sans token) | 'mapbox' (style Studio Blick + token). */
export const MAP_ENGINE = env.VITE_MAP_ENGINE === 'mapbox' ? 'mapbox' : 'maplibre';

export const MAPBOX_TOKEN = env.VITE_MAPBOX_TOKEN || '';

/**
 * Crédits de la carte, affichés dans le pied de page (contrôle d'attribution natif désactivé). Groupes séparés par
 * « · », chaque mention liée à sa page de droits :
 * - OpenFreeMap exige « OpenFreeMap © OpenMapTiles © OpenStreetMap » ; OSM demande, sur une carte interactive, un
 *   lien vers sa page de copyright ;
 * - le relief (AWS Terrain Tiles, Mapzen / Tilezen) exige de citer Mapzen et les sources des modèles de terrain
 *   (EU-DEM Copernicus, SRTM / GMTED de l'USGS, ETOPO1 de la NOAA pour la Suisse et ses abords) : lien vers la page
 *   d'attribution officielle, faute de place pour le texte complet (vérifié le 05/11/2026).
 */
const RELIEF = { label: 'Relief Mapzen', href: 'https://github.com/tilezen/joerd/blob/master/docs/attribution.md' };
const OSM = { label: '© OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' };
export const MAP_CREDITS =
  MAP_ENGINE === 'mapbox'
    ? [[{ label: 'Carte © Mapbox', href: 'https://www.mapbox.com/about/maps' }, OSM], [RELIEF]]
    : [
        [
          { label: 'Carte OpenFreeMap', href: 'https://openfreemap.org' },
          { label: '© OpenMapTiles', href: 'https://www.openmaptiles.org' },
          OSM,
        ],
        [RELIEF],
      ];

/** Relief ombré (AWS Terrarium, dataset public sans SLA) ; teintes par thème dans MAP_THEMES. */
export const HILLSHADE = {
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  maxzoom: 12,
};

/**
 * Couleurs de la carte par thème, comme bl-iframe-traffic (le moteur et le canvas des pastilles ne lisent pas les
 * variables CSS). Fond OpenFreeMap : Positron en clair, Dark en sombre, remplaçables via .env (style Studio Blick en
 * mode mapbox). Teintes reprises de base.css.
 */
export const MAP_THEMES = {
  light: {
    style: env.VITE_MAP_STYLE_LIGHT || 'https://tiles.openfreemap.org/styles/positron',
    hillshade: {
      'hillshade-shadow-color': '#6A6262',
      'hillshade-highlight-color': '#FFFFFF',
      'hillshade-accent-color': '#A5A1A1',
      'hillshade-exaggeration': 0.3,
      'hillshade-illumination-direction': 315,
    },
    place: { color: '#A5A1A1', halo: 'rgba(255,255,255,0.9)' }, // localités
    places: ['label_city_capital', 'label_city', 'label_town', 'label_village', 'label_other', 'label_state'],
    hidden: [], // couches du style masquées
    outside: { color: '#121010', opacity: 0.13 }, // trame hors de Suisse
    pill: { bg: '#FFFFFF', hover: '#F0EFEF', name: '#121010', temp: '#504949', shadow: 'rgba(18,16,16,0.2)' },
  },
  dark: {
    style: env.VITE_MAP_STYLE_DARK || 'https://tiles.openfreemap.org/styles/dark',
    hillshade: {
      'hillshade-shadow-color': '#000000',
      'hillshade-highlight-color': '#504949',
      'hillshade-accent-color': '#1E1A1A',
      'hillshade-exaggeration': 0.4,
      'hillshade-illumination-direction': 315,
    },
    place: { color: '#837C7C', halo: 'rgba(18,16,16,0.9)' },
    places: ['place_city_large', 'place_city', 'place_town', 'place_village', 'place_suburb', 'place_other', 'place_state'],
    // Noms et sens uniques des routes : absents de Positron aux zooms du widget, masqués pour un rendu identique.
    hidden: ['highway_name_motorway', 'highway_name_other', 'road_oneway', 'road_oneway_opposite'],
    outside: { color: '#000000', opacity: 0.35 },
    // Fond des pastilles = celui du panneau liste / fiche (`fill-strong`, grey-800), survol un cran au-dessus (grey-700) :
    // plus sombres, elles se confondaient avec le fond de carte.
    pill: { bg: '#3B3535', hover: '#504949', name: '#F5F5F5', temp: '#C8C6C6', shadow: 'rgba(0,0,0,0.55)' },
  },
};

/** Contours CH (non officiels, à remplacer par swissBOUNDARIES3D). Relatifs à la racine du build. */
export const CH_OUTLINE_URL = 'data/ch.geojson'; // filtre `within` des localités
export const CH_PRECISE_URL = 'data/ch-precise.geojson'; // trame extérieure

export const CH_BOUNDS = [[5.96, 45.82], [10.49, 47.81]];
/**
 * Limite de déplacement de la carte. Elle s'applique à toute la carte, y compris sous les panneaux posés dessus : marge
 * élargie au sud (panneau bas mobile, jusqu'à ≈ 240 px) et à l'ouest (panneau de 300 px en 964 / 632 px), sinon la
 * Suisse ne peut pas être remontée ou décalée au-dessus d'eux (13/11/2026 ; avant : [[4.5, 45.2], [11.8, 48.4]]).
 */
export const MAX_BOUNDS = [[3.3, 43.8], [11.8, 48.4]];

/**
 * Vue d'ensemble : la Suisse entière. MapView ajoute en bas, en mobile, la hauteur du panneau bas posé sur la carte.
 * 632 px (13/11/2026) : marges resserrées et égales à gauche et à droite, la Suisse un peu plus grande et centrée
 * (avant 56 / 24 / 24 / 56 : décalée vers le bas et la gauche) ; la carte y est limitée par sa hauteur, le bouton
 * « Liste » et les boutons de zoom ne recouvrent que des coins hors de Suisse.
 * Mobile : 12 px sur les côtés et en haut (comme bl-iframe-traffic) ; 32 px en bas (13/11/2026, 12 avant) : les
 * pastilles des stations du sud (Zermatt, Saas-Fee), centrées sur leur point, touchaient presque le panneau.
 */
export const FIT_PADDING = {
  wide: { top: 56, bottom: 30, left: 30, right: 60 },
  mid: { top: 30, bottom: 30, left: 24, right: 24 },
  mobile: { top: 12, bottom: 32, left: 12, right: 12 },
};

/** Gestes coopératifs (Ctrl/⌘ + molette, 2 doigts) : la carte ne capture pas le scroll de l'article. */
export const COOPERATIVE_GESTURES = true;

/**
 * Durée des mouvements de la carte (vol vers une station, retour à la vue Suisse), en ms, comme bl-iframe-traffic
 * (13/11/2026 ; avant `flyTo` à speed 1,1 / curve 1,5, durée selon la distance, plus lent) ; aucune si l'utilisateur
 * préfère réduire les animations.
 */
export const FRAME_MS = 600;
/** Zoom minimal d'un vol vers un domaine, selon son niveau. */
export const FOCUS_ZOOM = { 1: 9.2, 2: 9.2, 3: 9.8 };
/** Décalage du vol en 964 et 632 px pour que la station ne passe pas sous le panneau superposé. */
export const PANEL_FLY_OFFSET = [156, 0];

/** Seuils de révélation par niveau (D3) ; les « stations de niveau 1 » sont toujours visibles. */
export const LEVEL_MIN_ZOOM = { 1: 0, 2: 7.6, 3: 8.6 };
export const NARROW_ZOOM_OFFSET = 0.6; // 632 px et mobile
export const HYSTERESIS = 0.15;
/** En dessous de ce zoom, hors 964 px : pastille compacte sans nom (D10). */
export const NAME_MIN_ZOOM = 7.4;
