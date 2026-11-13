import { useLayoutEffect, useRef, useState } from 'react';
import { MobileResortDetail } from './ResortDetail';
import { ListCount, ResortList } from './ResortList';
import { SearchBox } from './SearchBox';

/** Recherche en attente (8c) : padding 12 + champ de 44 + padding 12. */
const SEARCH_HEIGHT = 68;
/**
 * Recherche ouverte (8d) : même hauteur que la fiche (dernière fiche mesurée ; avant toute fiche, la hauteur courante
 * d'une fiche à 360 px), sans dépasser la zone carte moins une bande de 44 px.
 */
const DETAIL_HEIGHT_DEFAULT = 238;
const LIST_TOP_MIN = 44;

/** Bouton rond de 40 px du panneau (liste, fermer la recherche). */
function RoundButton({ icon, iconSize, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-10 flex-none cursor-pointer items-center justify-center rounded-pill bg-surface-weak p-0 text-ink transition-colors duration-150 hover:bg-surface-strong"
    >
      <i className={`${icon} ${iconSize}`} aria-hidden="true" />
    </button>
  );
}

/**
 * Panneau bas du mode explore en mobile (maquette « Meteo mobile », 8a, 8c, 8d, 13/11/2026) : un seul panneau posé
 * en bas de la carte, trois contenus.
 * - recherche en attente (8c) : champ + bouton liste, 68 px ;
 * - recherche ouverte (8d, `panelOpen`) : le panneau monte à la hauteur de la fiche ; champ actif + fermer, compteur,
 *   liste. Toucher la carte au-dessus referme la recherche ;
 * - fiche station (8a, `selected`) : hauteur de son contenu.
 * Le passage de l'un à l'autre anime la hauteur (200 ms). `heightRef` reçoit la hauteur visée avant les effets de la
 * carte : le vol vers une station la place au milieu de la zone libre au-dessus du panneau.
 */
export function MobileSheet({
  zoneHeight,
  panelOpen,
  selected,
  query,
  onQuery,
  onSearchFocus,
  list,
  wx,
  onSelect,
  onOpen,
  onCloseSearch,
  onCloseDetail,
  heightRef,
}) {
  const state = selected ? 'detail' : panelOpen ? 'list' : 'search';
  const detailRef = useRef(null);
  const [detailHeight, setDetailHeight] = useState(0);

  // Hauteur de la fiche : mesurée avant l'affichage (et à chaque changement de contenu, relevé météo compris).
  useLayoutEffect(() => {
    const el = detailRef.current;
    if (!el) return undefined;
    const measure = () => {
      setDetailHeight(el.offsetHeight);
      heightRef.current = el.offsetHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selected, heightRef]);

  const listHeight = Math.min(detailHeight || DETAIL_HEIGHT_DEFAULT, zoneHeight - LIST_TOP_MIN);
  const height = state === 'detail' ? detailHeight : state === 'list' ? listHeight : SEARCH_HEIGHT;
  useLayoutEffect(() => {
    if (state !== 'detail') heightRef.current = height;
  });

  return (
    <>
      {state === 'list' && (
        // Carte au-dessus de la recherche ouverte : la toucher referme la recherche (doublon du bouton fermer, hors de
        // l'arbre d'accessibilité).
        <div aria-hidden="true" onClick={onCloseSearch} className="absolute inset-x-0 top-0 z-[5]" style={{ height: zoneHeight - listHeight }} />
      )}
      <section
        aria-label={selected ? `Fiche ${selected.name}` : 'Recherche de stations'}
        className="absolute inset-x-0 bottom-0 z-[5] flex flex-col overflow-hidden rounded-t-[14px] bg-surface shadow-[0_-6px_20px_rgba(18,16,16,.14)] transition-[height] duration-200 ease-out"
        style={{ height }}
      >
        {selected ? (
          <MobileResortDetail ref={detailRef} resort={selected} w={wx[selected.id]} onClose={onCloseDetail} />
        ) : (
          <>
            {/* Même champ en 8c et 8d : il garde le focus quand la recherche s'ouvre. */}
            <div className={`flex flex-none items-center gap-2.5 px-4 ${panelOpen ? 'pt-3 pb-2.5' : 'py-3'}`}>
              <SearchBox value={query} onChange={onQuery} onFocus={onSearchFocus} sheet active={panelOpen} />
              {panelOpen ? (
                <RoundButton icon="fa-solid fa-xmark" iconSize="text-[14px]" label="Fermer la recherche" onClick={onCloseSearch} />
              ) : (
                <RoundButton icon="fa-solid fa-list" iconSize="text-[18px]" label="Voir la liste des stations" onClick={onOpen} />
              )}
            </div>
            {panelOpen && (
              <>
                <ListCount count={list.length} mobile />
                <ResortList resorts={list} wx={wx} onSelect={onSelect} mobile />
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
