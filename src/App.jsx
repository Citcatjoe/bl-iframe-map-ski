import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompactView } from './components/CompactView';
import { Footer } from './components/Footer';
import { HEADER_NARROW_MAX, Header } from './components/Header';
import { MapView } from './components/MapView';
import { MobileSheet } from './components/MobileSheet';
import { SidePanel } from './components/SidePanel';
import { RESORTS } from './data/resorts';
import { useWeather } from './hooks/useWeather';
import { MAX_WIDTH, MOBILE_EXTRA_HEIGHT, mapHeight, modeFor, useWidth } from './hooks/useWidth';
import { trackClick, trackImpression } from './lib/analytics';
import { filterResorts, selectResorts } from './lib/resortList';
import { useTheme } from './lib/theme';

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
// Lien « Voir toute la météo » du mode compact (article contenant le mode explore) ; sans paramètre, pas de lien.
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
  // Clair / sombre : l'interface suit seule (variables de base.css) ; la carte a besoin du thème en JS.
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(PRESELECTED);
  // Dernier domaine affiché : la fiche reste remplie pendant le glissement de retour.
  const [shownId, setShownId] = useState(PRESELECTED);
  const [hover, setHover] = useState(null);
  // 964 et 632 px : la fiche présélectionnée s'ouvre dans le panneau superposé, comme après un choix.
  const [panelOpen, setPanelOpen] = useState(() => PRESELECTED !== null && mode !== 'mobile');

  // Liste du mode explore : ordre alphabétique (05/11/2026, plus de tri « Neige 3 j » / « A–Z »).
  const list = useMemo(() => filterResorts(POOL, query, 'az', wx), [query, wx]);

  const select = useCallback(
    (id) => {
      setSel(id);
      setShownId(id);
      setHover(null);
      setPanelOpen(mode !== 'mobile');
      document.activeElement?.blur?.();
    },
    [mode],
  );

  const clearSel = useCallback(() => setSel(null), []);

  // Suivi d'audience : l'affichage, puis les actions de l'utilisateur (pas la présélection ?point=).
  useEffect(() => trackImpression(), []);
  const selectFromList = useCallback(
    (id) => {
      trackClick('resort', { resort: id, source: 'list' });
      select(id);
    },
    [select],
  );
  const selectFromMap = useCallback(
    (id) => {
      trackClick('resort', { resort: id, source: 'map' });
      select(id);
    },
    [select],
  );

  // Bouton « Liste · N » (964 / 632 px) ou bouton liste du panneau bas (mobile).
  const openPanel = useCallback(() => {
    setPanelOpen(true);
    if (mode === 'mobile') setSel(null);
    trackClick('list');
  }, [mode]);

  // Fermeture de la recherche / du panneau. Sans station choisie, la recherche est vidée : sinon la carte, recadrée,
  // ne montrerait que les pastilles filtrées.
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    if (!sel) setQuery('');
    setSel(null);
  }, [sel]);

  // Bouton « maison » de la carte (toutes largeurs) : ferme le panneau (liste, recherche, fiche), revient à toutes les
  // stations (recherche vidée, même avec une station choisie) ; MapView recadre ensuite la Suisse.
  const resetAll = useCallback(() => {
    setPanelOpen(false);
    setSel(null);
    setQuery('');
  }, []);

  const onSearchFocus = useCallback(() => {
    if (mode !== 'mobile') return;
    setPanelOpen(true);
    setSel(null);
  }, [mode]);

  const shown = shownId ? findResort(shownId) : null;
  const selected = sel ? findResort(sel) : null;
  const mobile = mode === 'mobile';
  // Hauteur du panneau bas mobile, tenue à jour par MobileSheet : la carte place la station au-dessus de lui.
  const sheetHeightRef = useRef(0);
  const zoneHeight = mapHeight(width, mode) + (mobile ? MOBILE_EXTRA_HEIGHT : 0);

  // Hauteur selon le contenu : ajustée par iframeHeightAdjustment.js.
  if (COMPACT) {
    return (
      <div
        ref={rootRef}
        className="relative mx-auto flex w-full flex-col overflow-hidden bg-surface font-body text-ink"
        style={{ maxWidth: MAX_WIDTH }}
      >
        <Header narrow={width < HEADER_NARROW_MAX} wxStatus={wxStatus} wxTime={wxTime} compact title="La météo du week-end en station" />
        <CompactView
          resorts={COMPACT_RESORTS}
          total={POOL.length}
          columns={SELECTION.columns}
          twoColumns={width >= COMPACT_TWO_COLUMNS_MIN}
          wx={wx}
          seeAllUrl={SEE_ALL_URL}
        />
        <Footer noMap />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative mx-auto flex w-full flex-col overflow-hidden bg-surface font-body text-ink"
      style={{ maxWidth: MAX_WIDTH }}
    >
      <Header narrow={width < HEADER_NARROW_MAX} wxStatus={wxStatus} wxTime={wxTime} />
      {/* Zone carte au format 4:3 (+ 61 px en mobile) : hauteur fixe à l'usage, voir mapHeight. En mobile, la carte
          occupe toute la zone et le panneau bas (recherche, liste, fiche) se pose dessus. */}
      <div className={`relative flex flex-none ${mobile ? 'flex-col overflow-hidden' : 'flex-row'}`} style={{ height: zoneHeight }}>
        {!mobile && (
          <SidePanel
            panelOpen={panelOpen}
            query={query}
            onQuery={setQuery}
            list={list}
            sel={sel}
            shown={shown}
            wx={wx}
            onSelect={selectFromList}
            onHover={setHover}
            onClose={closePanel}
            onBack={clearSel}
          />
        )}
        <MapView
          resorts={list}
          wx={wx}
          sel={sel}
          hover={hover}
          mode={mode}
          width={width}
          theme={theme}
          findResort={findResort}
          sheetHeightRef={sheetHeightRef}
          onHover={setHover}
          onSelect={selectFromMap}
          onShowAll={resetAll}
          listToggle={!mobile && !panelOpen ? { label: `Liste · ${list.length}`, onClick: openPanel } : null}
        />
        {mobile && (
          <MobileSheet
            zoneHeight={zoneHeight}
            panelOpen={panelOpen}
            selected={selected}
            query={query}
            onQuery={setQuery}
            onSearchFocus={onSearchFocus}
            list={list}
            wx={wx}
            onSelect={selectFromList}
            onOpen={openPanel}
            onCloseSearch={closePanel}
            onCloseDetail={clearSel}
            heightRef={sheetHeightRef}
          />
        )}
      </div>
      <Footer mobile={mobile} />
    </div>
  );
}
