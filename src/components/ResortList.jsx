import { cantonName } from '../data/cantons';

const SORTS = [
  ['snow', 'Neige 3 j'],
  ['az', 'A–Z'],
];

export function SortBar({ count, sort, onSort }) {
  return (
    <div className="flex flex-none items-center justify-between gap-2 px-4 pt-1 pb-2">
      <span className="text-[11px] font-bold tracking-[0.04em] whitespace-nowrap text-ink-weak uppercase">
        {count} {count === 1 ? 'station' : 'stations'}
      </span>
      <div className="flex items-center gap-1" role="group" aria-label="Trier">
        {SORTS.map(([key, label]) => {
          const active = sort === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onSort(key)}
              className={`cursor-pointer border-none bg-transparent px-1.5 py-1 font-body text-[12px] font-bold whitespace-nowrap decoration-2 underline-offset-4 ${active ? 'text-ink underline' : 'text-ink-weak no-underline hover:text-ink'}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ResortList({ resorts, sel, onSelect, onHover }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
      {resorts.map((r) => {
        const active = r.id === sel;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            onMouseEnter={onHover && (() => onHover(r.id))}
            onMouseLeave={onHover && (() => onHover(null))}
            aria-current={active || undefined}
            className={`grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-3.5 text-left font-body text-ink transition-colors duration-150 hover:bg-surface-weak ${active ? 'bg-surface-weak' : 'bg-transparent'}`}
          >
            <span className={`truncate font-display text-base leading-[1.2] font-bold ${active ? 'text-ink-brand' : ''}`}>{r.name}</span>
            <abbr title={cantonName(r.canton)} className="text-[12px] leading-[1.2] font-bold tracking-[0.04em] whitespace-nowrap text-ink-weak no-underline">
              {r.canton}
            </abbr>
          </button>
        );
      })}
      {resorts.length === 0 && (
        <p className="m-0 px-4 py-5 text-sm text-ink-weak">Aucune station trouvée. Essaie un autre nom ou un canton.</p>
      )}
    </div>
  );
}
