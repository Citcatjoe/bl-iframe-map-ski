import { useNow } from '../hooks/useWeather';
import { trackClick } from '../lib/analytics';
import { filterResorts } from '../lib/resortList';
import { fmtTemp, skyOf, weekendDates, weekendLabel } from '../lib/weather';
import { WxIcon } from './ResortDetail';
import { CAP_TRIM, SnowNowLine } from './ResortList';

// Ligne reprise de bl-iframe-traffic (PointRow.jsx) pour le nom et la ligne d'état ; à droite, la prévision du
// week-end à la place du marqueur d'état (le temps du moment ne répond pas à « quel temps ce week-end ? »).
// Lignes de 62 px en deux colonnes, 56 px en une (mobile, 05/11/2026 : boîtes des jours resserrées pour y tenir).
const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4';

/** Stations listées ; les suivantes sont comptées dans le pied. */
const MAX_ROWS = 6;

const bySnow = (resorts, wx) => filterResorts(resorts, '', 'snow', wx);

/**
 * Un jour du week-end, en boîte : « SAM. 8 » et le picto du jour MétéoSuisse (libellé du temps et max / min en
 * infobulle). `d` absent (fichier sans ce jour, relevé d'avant le 05/11/2026 ou trop ancien) : picto « pas de données ».
 */
function WeekendDay({ date, d, tight }) {
  return (
    <span
      className={`flex flex-col items-center gap-1 px-1.5 ${tight ? 'py-[2px]' : 'py-[5px]'}`}
      title={d ? `${skyOf(d.sky).desc}, ${fmtTemp(d.max)} / ${fmtTemp(d.min)}` : 'Pas de prévision'}
    >
      <span className="text-[10px] leading-none font-bold whitespace-nowrap text-ink-weak uppercase">{weekendLabel(date)}</span>
      <WxIcon sky={d?.sky} className="text-[18px]" />
    </span>
  );
}

/**
 * Mode compact (`?mode=compact` : haut de rubrique, homepage), sur le modèle de bl-iframe-traffic : répond à « quel
 * temps ce week-end ? ». 6 stations au plus, triées par neige sur 3 jours, en deux colonnes (≥ 480 px, lecture par
 * colonne) ou une ; le reste est compté dans le pied. Par station : la neige au sol mesurée aujourd'hui, puis la
 * prévision du samedi et du dimanche (`weekendDates` ; le dimanche, ce dimanche seul). Lignes non cliquables, ni
 * carte ni fiche : le détail est dans le mode explore (« Voir toute la météo »).
 * `columns` (facultatif, `?points=a,b|c,d`) : une colonne par groupe, chacun trié ; en une colonne, les groupes se
 * suivent.
 */
export function CompactView({ resorts, total, columns, twoColumns, wx, seeAllUrl }) {
  const weekend = weekendDates(useNow());
  let colRows;
  if (columns) {
    const perGroup = Math.ceil(MAX_ROWS / columns.length);
    colRows = columns.map((g) => bySnow(g, wx).slice(0, perGroup)).filter((g) => g.length);
  } else {
    const shownRows = bySnow(resorts, wx).slice(0, MAX_ROWS);
    const perColumn = twoColumns ? Math.ceil(shownRows.length / 2) : shownRows.length;
    colRows = [shownRows.slice(0, perColumn), shownRows.slice(perColumn)].filter((g) => g.length);
  }
  // Cellules : colonne et ligne dans la grille (deux colonnes), ou à la suite (une colonne).
  const cells = colRows.flatMap((g, c) => g.map((r, j) => ({ r, c, j })));
  // Pied : toutes les stations du mode explore (`total` : les 154, ou la sélection `?points=`) moins celles listées.
  const others = Math.max(0, total - cells.length);
  const seeAll = (
    <>
      Voir toute la météo
      <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true" />
    </>
  );

  return (
    <>
      <ul
        className="m-0 grid list-none bg-surface-weak px-3 py-0"
        style={twoColumns ? { gridTemplateColumns: `repeat(${colRows.length}, minmax(0, 1fr))`, columnGap: 28 } : undefined}
      >
        {cells.map(({ r, c, j }, i) => {
          const w = wx[r.id];
          return (
            <li
              key={r.id}
              className={`${ROW_GRID} ${twoColumns ? 'min-h-[62px]' : 'min-h-[56px]'} py-[5px] ${(twoColumns ? j : i) === 0 ? '' : 'border-t border-line'}`}
              style={twoColumns ? { gridColumn: c + 1, gridRow: j + 1 } : undefined}
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className={`font-display text-[16px] leading-[1.2] font-bold ${CAP_TRIM}`}>{r.name}</span>
                <SnowNowLine snow={w?.snow} />
              </span>
              <span className="flex gap-1.5">
                {weekend.map((date) => (
                  <WeekendDay key={date} date={date} d={w?.days?.find((d) => d.date === date)} tight={!twoColumns} />
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <footer className={`flex flex-wrap items-center gap-y-1 bg-surface-strong px-4 py-[9px] text-[13px] leading-[1.4] text-ink ${twoColumns ? 'gap-x-4' : 'gap-x-3'}`}>
        {others > 0 && (
          <span className="text-ink-weak">
            {others} {others === 1 ? 'autre station' : 'autres stations'}
          </span>
        )}
        {/* Sans `seeAllUrl`, le libellé reste affiché sans lien. */}
        {seeAllUrl ? (
          <a href={seeAllUrl} target="_top" onClick={() => trackClick('see_all')} className="ml-auto flex items-center gap-1.5 font-bold text-ink-brand no-underline">
            {seeAll}
          </a>
        ) : (
          <span className="ml-auto flex items-center gap-1.5 font-bold text-ink-brand">{seeAll}</span>
        )}
      </footer>
    </>
  );
}
