import { MAP_CREDITS } from '../config/mapConfig';
import { WEATHER_CREDIT } from '../config/weatherConfig';

/**
 * Sources des données des stations : lieux, cantons, altitudes (swisstopo, « citer la source ») ; domaines,
 * remontées et point en altitude (OpenSkiData, ODbL, dérivé d'OpenStreetMap). Utiles aussi au mode compact : le
 * point en altitude choisit la station de neige SLF.
 */
const STATIONS_CREDITS = [
  { label: 'swisstopo', href: 'https://www.swisstopo.admin.ch' },
  { label: 'OpenSkiData', href: 'https://openskidata.org' },
];

const LINK = 'text-inherit no-underline hover:underline underline-offset-2';

function Credit({ label, href }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={LINK}>
      {label}
    </a>
  );
}

/** Mentions séparées par `sep` (espace dans un groupe de la carte, « , » pour les stations). */
function Credits({ items, sep }) {
  return items.map((c, i) => (
    <span key={c.href}>
      {i > 0 && sep}
      <Credit {...c} />
    </span>
  ));
}

/**
 * Pied de page, seul endroit des crédits (rien en surimpression sur la carte depuis le 05/11/2026). Ils ne doivent
 * jamais être tronqués : sur les largeurs étroites, ils passent à la ligne. Chaque source mène à sa page.
 * `noMap` : mode compact, pas de carte, donc pas de crédits de carte.
 */
export function Footer({ noMap = false }) {
  return (
    <footer className="flex flex-none flex-wrap justify-between gap-x-3 border-t border-line bg-surface-weak px-3 py-1.5 text-[10.5px] leading-[1.4] text-ink-weak">
      <span className="whitespace-nowrap">
        {WEATHER_CREDIT.weather.label}{' '}
        <Credit label={WEATHER_CREDIT.weather.source} href={WEATHER_CREDIT.weather.href} /> ·{' '}
        {/* SLF : référence clairement visible avec un lien vers www.slf.ch (condition de la licence), soulignée. */}
        <a href={WEATHER_CREDIT.snow.href} target="_blank" rel="noopener" className="text-inherit underline underline-offset-2">
          {WEATHER_CREDIT.snow.label}
        </a>
      </span>
      <span>
        {!noMap &&
          MAP_CREDITS.map((group, g) => (
            <span key={g}>
              {g > 0 && ' · '}
              <Credits items={group} sep=" " />
            </span>
          ))}
        {!noMap && ' · '}
        Stations : <Credits items={STATIONS_CREDITS} sep=", " />
      </span>
    </footer>
  );
}
