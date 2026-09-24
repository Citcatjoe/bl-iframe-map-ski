import { useEffect, useRef } from 'react';

const SearchIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...props}>
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="M16.5 16.5 13 13" />
  </svg>
);

const CloseIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...props}>
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);

const ChevronIcon = ({ open, ...props }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    {...props}
  >
    <path d="M7.5 4.5 13 10l-5.5 5.5" />
  </svg>
);

const ExternalIcon = (props) => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12" />
    <path d="M11 4h5v5M15.5 4.5l-7 7" />
  </svg>
);

const Panel = ({ resorts, filteredResorts, selectedId, searchQuery, onSearchChange, onSelectResort, isOpen, onToggleOpen }) => {
  const searchInputRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedId]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') onToggleOpen(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => onToggleOpen(true)}
          aria-expanded={false}
          aria-controls="resort-panel"
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-[var(--color-stroke-weak)] bg-[var(--color-fill-default)] py-2 pl-3 pr-4 text-sm font-medium text-[var(--color-text-default)] shadow-md outline-none transition-colors hover:bg-[var(--color-fill-weak)] focus-visible:ring-2 focus-visible:ring-[var(--color-stroke-brand)]"
        >
          <SearchIcon className="text-[var(--color-icon-weak)]" />
          Rechercher une station
        </button>
      )}

      <div
        id="resort-panel"
        onKeyDown={handleKeyDown}
        style={{ width: 'min(320px, 88vw)' }}
        className={`absolute inset-y-0 left-0 z-30 flex h-full flex-col border-r border-[var(--color-stroke-weak)] bg-[var(--color-fill-default)] shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-stroke-weak)] p-3">
          <SearchIcon className="shrink-0 text-[var(--color-icon-weak)]" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nom ou canton"
            aria-label="Rechercher une station par nom ou canton"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-default)] outline-none placeholder:text-[var(--color-text-weak)]"
          />
          <button
            type="button"
            onClick={() => onToggleOpen(false)}
            aria-label="Fermer la recherche"
            className="shrink-0 rounded-full p-1 text-[var(--color-icon-weak)] outline-none transition-colors hover:bg-[var(--color-fill-weak)] focus-visible:ring-2 focus-visible:ring-[var(--color-stroke-brand)]"
          >
            <CloseIcon />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {filteredResorts.length === 0 && (
            <li className="p-4 text-sm text-[var(--color-text-weak)]">
              Aucune station ne correspond à « {searchQuery} ».
            </li>
          )}
          {filteredResorts.map((resort) => {
            const isSelected = resort.id === selectedId;
            return (
              <li key={resort.id} ref={(el) => { itemRefs.current[resort.id] = el; }} className="border-b border-[var(--color-stroke-weak)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelectResort(isSelected ? null : resort.id)}
                  aria-expanded={isSelected}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left outline-none transition-colors hover:bg-[var(--color-fill-weak)] focus-visible:bg-[var(--color-fill-weak)]"
                >
                  <span>
                    <span className="block text-sm font-medium text-[var(--color-text-default)]">{resort.name}</span>
                    <span className="block text-xs text-[var(--color-text-weak)]">
                      {resort.canton} · {resort.cantonCode}
                    </span>
                  </span>
                  <ChevronIcon open={isSelected} className="text-[var(--color-icon-weak)]" />
                </button>
                {isSelected && (
                  <div className="px-4 pb-4 text-sm text-[var(--color-text-weak)]">
                    <p>Météo — bientôt disponible</p>
                    <a
                      href={resort.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-medium text-[var(--color-text-brand)] outline-none hover:text-[var(--color-text-brand_hover)] focus-visible:underline"
                    >
                      Voir le site officiel
                      <ExternalIcon />
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="border-t border-[var(--color-stroke-weak)] px-4 py-2 text-xs text-[var(--color-text-weak)]">
          {filteredResorts.length} / {resorts.length} stations
        </p>
      </div>
    </>
  );
};

export default Panel;
