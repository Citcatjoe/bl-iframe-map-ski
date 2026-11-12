import { fmtAltitude, fmtSnow, skyOf } from '../lib/weather';
import { WxIcon } from './ResortDetail';

// Lignes reprises de bl-iframe-traffic (PointRow.jsx) : marqueur dans une colonne de 24 px, nom, ligne d'état.
const ROW_GRID = 'grid grid-cols-[24px_minmax(0,1fr)] items-center gap-4';
export const CAP_TRIM = '[text-box:trim-both_cap_alphabetic]';

/**
 * « ❄ 7 cm au sol à 2 953 m » : neige au sol mesurée à la station SLF retenue, en altitude
 * (docs/METEO.md) ; pas une prévision. Commune à la liste du mode explore et au mode compact.
 */
export function SnowNowLine({ snow }) {
  return (
    <span className={`text-[13px] leading-[1.4] text-ink-weak ${CAP_TRIM}`} title={snow ? `Station ${snow.station}` : undefined}>
      <i className="fa-regular fa-snowflake mr-1.5" aria-hidden="true" />
      {snow ? (
        <>
          <strong className="text-ink">{fmtSnow(snow.hs)}</strong> au sol{' '}
          {/* Altitude d'un bloc : si la ligne passe à la ligne, « à 1 852 m » part entier, jamais « 1 852 » / « m ». */}
          <span className="whitespace-nowrap">à {fmtAltitude(snow.elevation)}</span>
        </>
      ) : (
        'Pas de mesure de neige'
      )}
    </span>
  );
}

/** Nombre de stations au-dessus de la liste (ordre alphabétique, sans choix de tri depuis le 05/11/2026). */
export function ListCount({ count }) {
  return (
    <div className="flex flex-none items-center px-4 pt-1 pb-2">
      <span className="text-[11px] font-bold tracking-[0.04em] whitespace-nowrap text-ink-weak uppercase">
        {count} {count === 1 ? 'station' : 'stations'}
      </span>
    </div>
  );
}

/**
 * Liste du mode explore, cliquable : conditions du moment par station (05/11/2026), comme une ligne du trafic.
 * Picto du temps au village à gauche, centré sur les deux lignes ; nom ; neige au sol mesurée.
 */
export function ResortList({ resorts, wx, sel, onSelect, onHover }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto border-t border-panel-line">
      {resorts.map((r) => {
        const active = r.id === sel;
        const w = wx[r.id];
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            onMouseEnter={onHover && (() => onHover(r.id))}
            onMouseLeave={onHover && (() => onHover(null))}
            aria-current={active || undefined}
            className={`${ROW_GRID} w-full cursor-pointer border-b border-panel-line px-4 py-4 text-left font-body text-ink transition-colors duration-150 hover:bg-panel-hover ${active ? 'bg-panel-hover' : 'bg-transparent'}`}
          >
            <span className="flex justify-center" title={`${skyOf(w?.sky).desc}, au village`}>
              <WxIcon sky={w?.sky} className="text-[24px]" />
            </span>
            <span className="flex min-w-0 flex-col gap-2">
              {/* `truncate` coupe à la boîte, rognée au cap et à la ligne de base (CAP_TRIM) : sans la marge interne
                  compensée (py / -my), les jambages (p de Belalp) et les accents des capitales seraient coupés. */}
              <span className={`truncate py-[0.25em] -my-[0.25em] font-display text-[16px] leading-[1.2] font-bold ${CAP_TRIM} ${active ? 'text-ink-brand' : ''}`}>
                {r.name}
              </span>
              <SnowNowLine snow={w?.snow} />
            </span>
          </button>
        );
      })}
      {resorts.length === 0 && (
        <p className="m-0 px-4 py-5 text-sm text-ink-weak">Aucune station trouvée. Essaie un autre nom ou un canton.</p>
      )}
    </div>
  );
}
