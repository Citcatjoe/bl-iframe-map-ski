import { MAP_ATTRIBUTION } from '../config/mapConfig';
import { WEATHER_CREDIT } from '../config/weatherConfig';

/** Sources des données des stations (coordonnées swisstopo, domaines OpenSkiData / OpenStreetMap). */
const STATIONS_CREDIT = 'Stations : swisstopo, OpenSkiData';

/**
 * Pied de page. Les crédits ne doivent jamais être tronqués : sur mobile, ils passent sur deux lignes.
 * Sous 964 px, l'attribution de la carte est en surimpression sur la carte (MapView).
 * `noMap` : mode compact, pas de carte, donc pas d'attribution de carte.
 */
export function Footer({ mode, noMap = false }) {
  const wide = mode === 'wide';
  return (
    <footer className="flex flex-none flex-wrap justify-between gap-x-3 border-t border-line px-4 py-1.5 text-[10.5px] leading-[1.4] whitespace-nowrap text-ink-weak">
      <span>{wide ? WEATHER_CREDIT.long : WEATHER_CREDIT.short}</span>
      <span>{wide && !noMap ? `${MAP_ATTRIBUTION} · ${STATIONS_CREDIT}` : STATIONS_CREDIT}</span>
    </footer>
  );
}
