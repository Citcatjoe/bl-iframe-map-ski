const PLACEHOLDER = 'Quelle station veux-tu voir ?';

/**
 * Champ de recherche des stations.
 * - Panneau 964 / 632 px : 44 px, fond du survol du panneau, blanc au focus.
 * - `sheet` (panneau bas mobile, maquettes 8c / 8d) : 44 px, fond `fill-default`, loupe 16 px à 14 px du bord, texte
 *   15 px ; `active` (recherche ouverte, 8d) : bordure 1,5 px `stroke-strong`.
 */
export function SearchBox({ value, onChange, onFocus, sheet = false, active = false }) {
  return (
    <div className="relative min-w-0 flex-1">
      <i
        className={`fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3.5 z-[1] -translate-y-1/2 text-glyph-weak ${sheet ? 'text-[16px]' : 'text-[14px]'}`}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={PLACEHOLDER}
        aria-label={PLACEHOLDER}
        autoComplete="off"
        className={
          sheet
            ? `h-11 w-full rounded-pill bg-surface pr-3.5 pl-[38px] font-body text-[15px] text-ink outline-none placeholder:text-ink-weak ${
                active ? 'border-[1.5px] border-line-strong' : 'border border-line'
              }`
            : 'h-11 w-full rounded-pill border border-line bg-panel-hover pr-3.5 pl-[38px] font-body text-base text-ink outline-none placeholder:text-ink-weak focus:border-line-strong focus:bg-surface'
        }
      />
    </div>
  );
}
