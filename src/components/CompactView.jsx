import { cantonName } from '../data/cantons';
import { filterResorts } from '../lib/resortList';
import { fmtSnow, fmtTemp } from '../lib/weather';
import { WxIcon } from './ResortDetail';

/** Stations listées ; les suivantes sont comptées dans le pied. */
const MAX_ROWS = 6;

const bySnow = (resorts, wx) => filterResorts(resorts, '', 'snow', wx);

/**
 * Mode compact (`?mode=compact` : haut de rubrique, homepage), sur le modèle de bl-iframe-traffic : 6 stations au
 * plus, triées par neige sur 3 jours, en deux colonnes (≥ 480 px, lecture par colonne) ou une ; le reste est compté
 * dans le pied. Lignes non cliquables, ni carte ni fiche : le détail est dans le mode explore (« Tout voir »).
 * `columns` (facultatif, `?points=a,b|c,d`) : une colonne par groupe, chacun trié ; en une colonne, les groupes se
 * suivent.
 */
export function CompactView({ resorts, columns, twoColumns, wx, seeAllUrl }) {
  let colRows;
  let rest;
  if (columns) {
    const perGroup = Math.ceil(MAX_ROWS / columns.length);
    const sorted = columns.map((g) => bySnow(g, wx));
    colRows = sorted.map((g) => g.slice(0, perGroup)).filter((g) => g.length);
    rest = sorted.flatMap((g) => g.slice(perGroup));
  } else {
    const rows = bySnow(resorts, wx);
    const shownRows = rows.slice(0, MAX_ROWS);
    const perColumn = twoColumns ? Math.ceil(shownRows.length / 2) : shownRows.length;
    colRows = [shownRows.slice(0, perColumn), shownRows.slice(perColumn)].filter((g) => g.length);
    rest = rows.slice(MAX_ROWS);
  }
  // Cellules : colonne et ligne dans la grille (deux colonnes), ou à la suite (une colonne).
  const cells = colRows.flatMap((g, c) => g.map((r, j) => ({ r, c, j })));
  const seeAll = (
    <>
      Tout voir
      <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true" />
    </>
  );

  return (
    <>
      <ul
        className="m-0 grid list-none px-4 py-0"
        style={twoColumns ? { gridTemplateColumns: `repeat(${colRows.length}, minmax(0, 1fr))`, columnGap: 28 } : undefined}
      >
        {cells.map(({ r, c, j }, i) => {
          const w = wx[r.id];
          return (
            <li
              key={r.id}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 ${(twoColumns ? j : i) === 0 ? '' : 'border-t border-line'}`}
              style={twoColumns ? { gridColumn: c + 1, gridRow: j + 1 } : undefined}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-display text-base leading-[1.2] font-bold">{r.name}</span>
                <abbr title={cantonName(r.canton)} className="text-[12px] leading-[1.2] font-bold tracking-[0.04em] text-ink-weak no-underline">
                  {r.canton}
                </abbr>
              </span>
              <span className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                <span className="flex items-center gap-1.5 text-[15px] leading-[1.2] font-bold">
                  <WxIcon code={w?.code} />
                  {fmtTemp(w?.t)}
                </span>
                <span className="text-[12px] leading-[1.2] text-ink-weak" title="Neige prévue sur 3 jours">
                  <i className="fa-regular fa-snowflake mr-[3px]" aria-hidden="true" />
                  {fmtSnow(w?.snow3)} / 3 j
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-surface-weak px-4 py-[9px] text-[13px] leading-[1.4] text-ink">
        {rest.length > 0 && (
          <span className="text-ink-weak">
            {rest.length} {rest.length === 1 ? 'autre station' : 'autres stations'}
          </span>
        )}
        {/* Sans `seeAllUrl`, le libellé reste affiché sans lien. */}
        {seeAllUrl ? (
          <a href={seeAllUrl} target="_top" className="ml-auto flex items-center gap-1.5 font-bold text-ink-brand no-underline">
            {seeAll}
          </a>
        ) : (
          <span className="ml-auto flex items-center gap-1.5 font-bold text-ink-brand">{seeAll}</span>
        )}
      </footer>
    </>
  );
}
