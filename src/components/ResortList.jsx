import { fmtAltitude, fmtSnow, skyOf } from '../lib/weather';
import { WxIcon } from './ResortDetail';

// Lignes reprises de bl-iframe-traffic (PointRow.jsx) : marqueur dans une colonne de 24 px, nom, ligne d'état.
const ROW_GRID = 'grid grid-cols-[24px_minmax(0,1fr)] items-center gap-4';
export const CAP_TRIM = '[text-box:trim-both_cap_alphabetic]';

/**
 * « ❄ 7 cm au sol à 2 953 m » : neige au sol mesurée à la station SLF retenue, en altitude
 * (docs/METEO.md) ; pas une prévision. Commune à la liste du mode explore et au mode compact.
 * `small` : liste du panneau mobile (8d), 12,5 px / 1,3, flocon 13 px, sans rognage au cap.
 */
export function SnowNowLine({ snow, small = false }) {
  return (
    <span
      className={`text-ink-weak ${small ? 'text-[12.5px] leading-[1.3]' : `text-[13px] leading-[1.4] ${CAP_TRIM}`}`}
      title={snow ? `Station ${snow.station}` : undefined}
    >
      <i className={`fa-regular fa-snowflake mr-1.5 ${small ? 'text-[13px]' : ''}`} aria-hidden="true" />
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
export function ListCount({ count, mobile = false }) {
  return (
    <div className={`flex flex-none items-center px-4 pb-2 ${mobile ? '' : 'pt-1'}`}>
      <span className={`text-[11px] font-bold tracking-[0.04em] whitespace-nowrap text-ink-weak uppercase ${mobile ? 'leading-[1.2]' : ''}`}>
        {count} {count === 1 ? 'station' : 'stations'}
      </span>
    </div>
  );
}

/**
 * Liste du mode explore, cliquable : conditions du moment par station (05/11/2026), comme une ligne du trafic.
 * Picto du temps au village à gauche, centré sur les deux lignes ; nom ; neige au sol mesurée.
 * `mobile` : lignes du panneau bas (maquette 8d), sur fond blanc, filet haut `fill-strong` (grey-200), plus serrées.
 */
export function ResortList({ resorts, wx, sel, onSelect, onHover, mobile = false }) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${mobile ? '' : 'border-t border-panel-line'}`}>
      {resorts.map((r) => {
        const active = r.id === sel;
        const w = wx[r.id];
        if (mobile) {
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className="flex w-full cursor-pointer items-center gap-3 border-t border-surface-strong bg-transparent px-4 py-2.5 text-left font-body text-ink transition-colors duration-150 hover:bg-surface-weak"
            >
              {/* 26 px de haut (WxIcon : 1,2 em). */}
              <span className="flex flex-none" title={`${skyOf(w?.sky).desc}, au village`}>
                <WxIcon sky={w?.sky} className="text-[21.5px]" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-display text-[16px] leading-[1.2] font-bold">{r.name}</span>
                <span className="mt-0.5 text-[12.5px] leading-[1.3]">
                  <SnowNowLine snow={w?.snow} small />
                </span>
              </span>
            </button>
          );
        }
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
