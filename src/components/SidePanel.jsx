import { ResortDetail } from './ResortDetail';
import { ListCount, ResortList } from './ResortList';
import { SearchBox } from './SearchBox';
import { IconButton } from './ui/IconButton';

const BASE = 'z-[3] flex flex-col overflow-hidden bg-panel [--scrollbar-thumb:var(--panel-thumb)]';

function panelClass(mode, panelOpen, hidden) {
  // 964 et 632 px : panneau superposé à la carte, replié par défaut, ouvert par « Liste » ou une station choisie.
  if (mode !== 'mobile') {
    return `${BASE} absolute top-3 bottom-3 left-3 w-[300px] rounded-lg shadow-menu transition-transform duration-[220ms] ease-in-out ${panelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]'}`;
  }
  // Mobile : fond `fill-weak` (classe panel-mobile, index.css), pour détacher la barre et la liste des crédits.
  if (panelOpen) return `${BASE} panel-mobile absolute inset-0 z-[6]`;
  return `${BASE} panel-mobile relative order-2 flex-none border-t border-panel-line ${hidden ? 'hidden' : ''}`;
}

/**
 * Panneau unique liste ↔ fiche (D21). Deux pages côte à côte ; la fiche entre par la droite.
 * 964 et 632 px : superposé à la carte, replié tant que `panelOpen` est faux.
 * Mobile : zone basse réduite (recherche + bouton liste), ou liste plein cadre quand `panelOpen`.
 */
export function SidePanel({
  mode,
  panelOpen,
  query,
  onQuery,
  onSearchFocus,
  list,
  sel,
  shown,
  wx,
  onSelect,
  onHover,
  onOpen,
  onClose,
  onBack,
}) {
  const mobile = mode === 'mobile';
  const mobileList = mobile && panelOpen;
  const reduced = mobile && !panelOpen;
  const focused = !!sel && !mobile;
  const searchPad = mobile ? 'px-3.5 py-2.5' : 'px-4 pt-2.5 pb-1';

  return (
    <aside className={panelClass(mode, panelOpen, !!sel)} inert={!mobile && !panelOpen} aria-label="Stations de ski">
      {/* overflow-clip, pas hidden : un focus dans la page cachée ne doit pas faire défiler la piste. */}
      <div className="relative min-h-0 flex-1 overflow-clip">
        <div
          className="flex h-full w-[200%] transition-transform duration-[340ms] ease-[cubic-bezier(.2,.7,.2,1)]"
          style={{ transform: focused ? 'translateX(-50%)' : 'translateX(0)' }}
        >
          {/* Page liste */}
          <div className="flex h-full min-h-0 w-1/2 flex-col" inert={focused}>
            {/* 964 / 632 px : titre et croix. Mobile : pas de titre, la barre garde sa disposition ouverte ou fermée
                (recherche + bouton rond : « liste » fermée, croix ouverte). */}
            {!mobile && (
              <div className="flex flex-none items-center justify-between pt-2.5 pr-3 pl-4">
                <span className="font-display text-[19px] font-bold">Toutes les stations</span>
                <IconButton icon="fa-solid fa-xmark" label="Fermer la liste" onClick={onClose} />
              </div>
            )}
            <div className={`flex flex-none items-center gap-2 ${searchPad}`}>
              <SearchBox value={query} onChange={onQuery} onFocus={onSearchFocus} compact={mobile} />
              {reduced && <IconButton icon="fa-solid fa-list" color="grey" label="Voir toutes les stations" onClick={onOpen} />}
              {mobileList && <IconButton icon="fa-solid fa-xmark" color="grey" label="Fermer la liste" onClick={onClose} />}
            </div>
            {!reduced && (
              <>
                <ListCount count={list.length} />
                <ResortList resorts={list} wx={wx} sel={sel} onSelect={onSelect} onHover={mobile ? undefined : onHover} />
              </>
            )}
          </div>

          {/* Page fiche */}
          <div className="flex h-full min-h-0 w-1/2 flex-col" inert={!focused}>
            {shown && !mobile && (
              <>
                <div className="flex h-[52px] flex-none items-center justify-between gap-2 border-b border-panel-line pr-2 pl-1.5">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-pill bg-transparent px-2.5 font-body text-sm font-bold text-ink transition-colors duration-150 hover:bg-panel-hover"
                  >
                    <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                    Toutes les stations
                  </button>
                  <IconButton icon="fa-solid fa-xmark" label="Fermer le panneau" onClick={onClose} />
                </div>
                <ResortDetail resort={shown} w={wx[shown.id]} />
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
