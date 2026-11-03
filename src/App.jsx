import { useCallback, useMemo, useRef, useState } from 'react';
import { CompactView } from './components/CompactView';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ResortDock } from './components/ResortDetail';
import { SidePanel } from './components/SidePanel';
import { RESORTS } from './data/resorts';
import { useWeather } from './hooks/useWeather';
import { HEIGHT, MAX_WIDTH, modeFor, useWidth } from './hooks/useWidth';
import { filterResorts, selectResorts } from './lib/resortList';

// Paramètres d'URL, sur le modèle de bl-iframe-traffic (README § Paramètres d'URL).
const params = new URLSearchParams(window.location.search);
// ?mode=compact : quelques lignes sans carte (haut de rubrique, homepage) ; ?mode=explore (défaut) : carte + panneau
// (dans un article). Ne pas confondre avec `mode` dans le code : la mise en page (wide / mid / mobile) selon la largeur.
const COMPACT = params.get('mode') === 'compact';
if (params.has('mode') && !['compact', 'explore'].includes(params.get('mode'))) {
  console.warn(`?mode=${params.get('mode')} inconnu (valeurs : explore, compact) : mode explore.`);
}
// Mode explore : fiche d'une station ouverte d'emblée (`?point=verbier`).
const POINT = params.get('point');
// Lien « Tout voir » du mode compact (article contenant le mode explore) ; sans paramètre, pas de lien.
const SEE_ALL_URL = params.get('seeAllUrl');
// Stations suivies : `?points=verbier,zermatt` (`|` entre colonnes du mode compact). Dans les deux modes, le widget
// se limite à ces stations ; en explore, elles sont toujours visibles sur la carte (niveau 1, quel que soit le zoom).
const SELECTION = selectResorts(RESORTS, params.get('points'));
if (SELECTION.unknown.length) {
  console.warn(`?points= : ${SELECTION.unknown.join(', ')} inconnu(s) (identifiants : champ id de src/data/resorts.json)`);
}
const LIMITED = SELECTION.list !== RESORTS; // `?points=` présent et non vide
if (LIMITED && !SELECTION.list.length) console.warn('?points= : aucune station connue, toutes les stations sont affichées.');
const POOL = SELECTION.list.length && LIMITED ? SELECTION.list.map((r) => ({ ...r, level: 1 })) : RESORTS;
// Mode compact sans `?points=` : les stations de niveau 1.
const COMPACT_RESORTS = POOL === RESORTS ? RESORTS.filter((r) => r.level === 1) : POOL;

const byId = new Map(POOL.map((r) => [r.id, r]));
const findResort = (id) => byId.get(id);

const PRESELECTED = !COMPACT && POINT && byId.has(POINT) ? POINT : null;
if (!COMPACT && POINT && !PRESELECTED) {
  console.warn(`?point=${POINT} inconnu${LIMITED ? ' ou hors de ?points=' : ''} (identifiants : champ id de src/data/resorts.json)`);
}

/** Mode compact : deux colonnes à partir de cette largeur, une en dessous. */
const COMPACT_TWO_COLUMNS_MIN = 480;

export default function App() {
  const rootRef = useRef(null);
  const width = useWidth(rootRef);
  const mode = modeFor(width);
  const { wx, status: wxStatus, time: wxTime } = useWeather();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('snow');
  const [sel, setSel] = useState(PRESELECTED);
  // Dernier domaine affiché : la fiche reste remplie pendant le glissement de retour.
  const [shownId, setShownId] = useState(PRESELECTED);
  const [hover, setHover] = useState(null);
  // 632 px : la fiche présélectionnée s'ouvre dans le panneau superposé, comme après un choix.
  const [panelOpen, setPanelOpen] = useState(() => PRESELECTED !== null && mode === 'mid');

  const list = useMemo(() => filterResorts(POOL, query, sort, wx), [query, sort, wx]);

  const select = useCallback(
    (id) => {
      setSel(id);
      setShownId(id);
      setHover(null);
      setPanelOpen(mode === 'mid');
      document.activeElement?.blur?.();
    },
    [mode],
  );

  const clearSel = useCallback(() => setSel(null), []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    if (mode === 'mobile') setSel(null);
  }, [mode]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSel(null);
  }, []);

  const onSearchFocus = useCallback(() => {
    if (mode !== 'mobile') return;
    setPanelOpen(true);
    setSel(null);
  }, [mode]);

  const shown = shownId ? findResort(shownId) : null;
  const selected = sel ? findResort(sel) : null;
  const mobile = mode === 'mobile';

  // Hauteur selon le contenu : ajustée par iframeHeightAdjustment.js.
  if (COMPACT) {
    return (
      <div
        ref={rootRef}
        className="relative mx-auto flex w-full flex-col overflow-hidden rounded-md border border-line bg-surface font-body text-ink"
        style={{ maxWidth: MAX_WIDTH }}
      >
        <Header mode={mode} wxStatus={wxStatus} wxTime={wxTime} />
        <CompactView
          resorts={COMPACT_RESORTS}
          columns={SELECTION.columns}
          twoColumns={width >= COMPACT_TWO_COLUMNS_MIN}
          wx={wx}
          seeAllUrl={SEE_ALL_URL}
        />
        <Footer mode={mode} noMap />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative mx-auto flex w-full flex-col overflow-hidden bg-surface font-body text-ink"
      style={{ height: HEIGHT[mode], maxWidth: MAX_WIDTH }}
    >
      <Header mode={mode} wxStatus={wxStatus} wxTime={wxTime} />
      <div className={`relative flex min-h-0 flex-1 ${mobile ? 'flex-col' : 'flex-row'}`}>
        <SidePanel
          mode={mode}
          panelOpen={panelOpen}
          query={query}
          onQuery={setQuery}
          onSearchFocus={onSearchFocus}
          sort={sort}
          onSort={setSort}
          list={list}
          sel={sel}
          shown={shown}
          shownWx={shown ? wx[shown.id] : undefined}
          onSelect={select}
          onHover={setHover}
          onOpen={openPanel}
          onClose={closePanel}
          onBack={clearSel}
        />
        <MapView
          resorts={list}
          wx={wx}
          sel={sel}
          hover={hover}
          mode={mode}
          width={width}
          findResort={findResort}
          onHover={setHover}
          onSelect={select}
          listToggle={mode === 'mid' && !panelOpen ? { label: `Liste · ${list.length}`, onClick: openPanel } : null}
        />
        {mobile && selected && <ResortDock resort={selected} w={wx[selected.id]} onClose={clearSel} />}
      </div>
      <Footer mode={mode} />
    </div>
  );
}
