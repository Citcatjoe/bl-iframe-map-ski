import { ResortDetail } from './ResortDetail';
import { ListCount, ResortList } from './ResortList';
import { SearchBox } from './SearchBox';
import { IconButton } from './ui/IconButton';

// Panneau superposé à la carte (964 et 632 px), replié par défaut, ouvert par « Liste » ou une station choisie.
const PANEL =
  'absolute top-3 bottom-3 left-3 z-[3] flex w-[300px] flex-col overflow-hidden rounded-lg bg-panel shadow-menu transition-transform duration-[220ms] ease-in-out [--scrollbar-thumb:var(--panel-thumb)]';

/**
 * Panneau unique liste ↔ fiche (D21), 964 et 632 px. Deux pages côte à côte ; la fiche entre par la droite.
 * Replié tant que `panelOpen` est faux. Mobile : MobileSheet.
 */
export function SidePanel({ panelOpen, query, onQuery, list, sel, shown, wx, onSelect, onHover, onClose, onBack }) {
  const focused = !!sel;

  return (
    <aside
      className={`${PANEL} ${panelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]'}`}
      inert={!panelOpen}
      aria-label="Stations de ski"
    >
      {/* overflow-clip, pas hidden : un focus dans la page cachée ne doit pas faire défiler la piste. */}
      <div className="relative min-h-0 flex-1 overflow-clip">
        <div
          className="flex h-full w-[200%] transition-transform duration-[340ms] ease-[cubic-bezier(.2,.7,.2,1)]"
          style={{ transform: focused ? 'translateX(-50%)' : 'translateX(0)' }}
        >
          {/* Page liste */}
          <div className="flex h-full min-h-0 w-1/2 flex-col" inert={focused}>
            <div className="flex flex-none items-center justify-between pt-2.5 pr-3 pl-4">
              <span className="font-display text-[19px] font-bold">Toutes les stations</span>
              <IconButton icon="fa-solid fa-xmark" label="Fermer la liste" onClick={onClose} />
            </div>
            <div className="flex flex-none items-center gap-2 px-4 pt-2.5 pb-1">
              <SearchBox value={query} onChange={onQuery} />
            </div>
            <ListCount count={list.length} />
            <ResortList resorts={list} wx={wx} sel={sel} onSelect={onSelect} onHover={onHover} />
          </div>

          {/* Page fiche */}
          <div className="flex h-full min-h-0 w-1/2 flex-col" inert={!focused}>
            {shown && (
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
