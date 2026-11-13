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

function Credit({ label, href }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="text-inherit underline">
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
 * Style des crédits de bl-iframe-traffic (13/11/2026), dans les deux modes et à toutes les largeurs : 10,5 px / 1,4,
 * graisse normale, `text-weak`, filet haut, padding 7px 0 8px, sans fond ni retrait latéral ; liens de la couleur du
 * texte, soulignés. Texte continu ; `mobile` (mode explore, maquette « Meteo mobile » 8a) : crédits météo puis
 * crédits de carte sur deux blocs.
 * `noMap` : mode compact, pas de carte, donc pas de crédits de carte.
 */
export function Footer({ noMap = false, mobile = false }) {
  return (
    <footer
      className={`flex-none border-t border-line pt-[7px] pb-2 text-[10.5px] leading-[1.4] font-normal text-ink-weak normal-case ${
        mobile ? 'flex flex-col' : ''
      }`}
    >
      <span className={mobile ? 'whitespace-nowrap' : ''}>
        {WEATHER_CREDIT.weather.label} <Credit label={WEATHER_CREDIT.weather.source} href={WEATHER_CREDIT.weather.href} /> ·{' '}
        {/* SLF : référence clairement visible avec un lien vers www.slf.ch (condition de la licence), soulignée. */}
        <Credit label={WEATHER_CREDIT.snow.label} href={WEATHER_CREDIT.snow.href} />
      </span>
      {!mobile && ' · '}
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
