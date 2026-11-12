export function SearchBox({ value, onChange, onFocus, compact }) {
  return (
    <div className="relative min-w-0 flex-1">
      <i
        className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3.5 z-[1] -translate-y-1/2 text-[14px] text-glyph-weak"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Quelle station veux-tu voir ?"
        aria-label="Quelle station veux-tu voir ?"
        autoComplete="off"
        className={`w-full rounded-pill border border-line bg-panel-hover pr-3.5 pl-[38px] font-body text-base text-ink outline-none placeholder:text-ink-weak focus:border-line-strong focus:bg-surface ${compact ? 'h-10' : 'h-11'}`}
      />
    </div>
  );
}
