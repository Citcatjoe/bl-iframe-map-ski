import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CH_BOUNDS,
  COOPERATIVE_GESTURES,
  FIT_PADDING,
  FRAME_MS,
  FOCUS_ZOOM,
  MAP_THEMES,
  MAX_BOUNDS,
  PANEL_FLY_OFFSET,
} from '../config/mapConfig';
import { customizeBasemap } from '../map/basemap';
import { loadMapEngine, MAP_LOCALE } from '../map/engine';
import { PillLayer } from '../map/PillLayer';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

/** Durée d'un mouvement de la carte : FRAME_MS, ou aucune si l'utilisateur préfère réduire les animations. */
const frameDuration = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : FRAME_MS);

/**
 * Retour à la vue Suisse, même mouvement dans tous les cas (fermeture de la fiche ou du panneau, « Afficher toute la
 * Suisse ») : `fitBounds` en FRAME_MS, comme bl-iframe-traffic, avec les marges données (panneau bas compris en mobile).
 */
function frameOverview(map, padding) {
  map?.fitBounds(CH_BOUNDS, { padding, duration: frameDuration(), essential: true });
}

/**
 * Carte + pastilles. Vole vers `sel` quand il change ; revient à la vue Suisse quand il redevient null (D26, D27).
 * Initialisée seulement quand elle approche de l'écran (chargements facturés selon le fournisseur).
 * `theme` (« light » | « dark ») : fond, relief et pastilles ; un changement remplace le style de la carte.
 * `sheetHeightRef` : hauteur du panneau bas mobile ; `onShowAll` : le bouton « maison » (Afficher toute la Suisse)
 * ferme aussi les panneaux ouverts et vide la recherche.
 */
export function MapView({ resorts, wx, sel, hover, mode, width, theme, findResort, sheetHeightRef, onHover, onSelect, onShowAll, listToggle }) {
  const containerRef = useRef(null);
  const instance = useRef(null); // { map, pills, loaded }
  const [generation, setGeneration] = useState(0); // incrémenté à chaque carte prête
  const live = useRef(null);
  useLayoutEffect(() => {
    live.current = { resorts, wx, sel, hover, mode, theme, findResort, sheetHeightRef, onHover, onSelect };
  });
  /**
   * Décalage du vol vers une station : hors du panneau superposé (964 / 632 px) ; en mobile, au milieu de la zone libre
   * au-dessus du panneau bas (moitié de sa hauteur, tenue à jour avant les effets).
   */
  const flyOffset = () => {
    const { mode: m, sheetHeightRef: sheet } = live.current;
    return m !== 'mobile' ? PANEL_FLY_OFFSET : [0, -(sheet?.current ?? 0) / 2];
  };
  /**
   * Marges de la vue Suisse ; en mobile, la hauteur du panneau bas s'ajoute en bas : la Suisse se centre dans la carte
   * visible au-dessus de lui, pas dans toute la zone.
   */
  const overviewPadding = () => {
    const { mode: m, sheetHeightRef: sheet } = live.current;
    const p = FIT_PADDING[m];
    return m === 'mobile' ? { ...p, bottom: p.bottom + (sheet?.current ?? 0) } : p;
  };

  // Création / destruction de la carte
  useEffect(() => {
    const el = containerRef.current;
    let cancelled = false;
    let started = false;
    let retryTimer = null;

    const destroy = () => {
      const cur = instance.current;
      if (!cur) return;
      instance.current = null;
      cur.pills.destroy();
      try {
        cur.map.remove();
      } catch {
        // contexte déjà perdu
      }
    };

    const create = async () => {
      const gl = await loadMapEngine();
      if (cancelled) return;
      const map = new gl.Map({
        container: el,
        style: MAP_THEMES[live.current.theme].style,
        bounds: CH_BOUNDS,
        fitBoundsOptions: { padding: FIT_PADDING[live.current.mode] },
        maxBounds: MAX_BOUNDS,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        cooperativeGestures: COOPERATIVE_GESTURES,
        locale: MAP_LOCALE,
      });
      map.touchZoomRotate.disableRotation();
      const pills = new PillLayer(map);
      const self = { map, pills, loaded: false, styleToken: 0 };
      instance.current = self;
      const isCurrent = () => !cancelled && instance.current === self;

      // Perte du contexte WebGL : on recrée la carte
      map.on('webglcontextlost', () => {
        destroy();
        retryTimer = setTimeout(() => !cancelled && create(), 300);
      });

      // Chaque style chargé (au départ, puis à chaque changement de thème, qui remplace le style et retire nos
      // couches) : ajustements du fond et pastilles, aux couleurs du thème.
      map.on('style.load', () => {
        if (!isCurrent()) return;
        const token = ++self.styleToken;
        try {
          customizeBasemap(map, live.current.theme, () => isCurrent() && self.styleToken === token);
        } catch (err) {
          console.warn('Fond de carte : ajustements partiels', err);
        }
        if (self.loaded) pills.attach();
      });

      map.on('load', () => {
        if (!isCurrent()) return;
        map.resize();
        // Station présélectionnée (`?point=`) avant que la carte soit prête : cadrage direct sur elle.
        const { sel: s0, findResort: find0 } = live.current;
        const r0 = s0 ? find0(s0) : null;
        if (r0) {
          map.easeTo({ center: [r0.lng, r0.lat], zoom: FOCUS_ZOOM[r0.level || 3], offset: flyOffset(), duration: 0 });
        } else {
          map.fitBounds(CH_BOUNDS, { padding: overviewPadding(), duration: 0 });
        }
        self.loaded = true;
        const { resorts: r, wx: w, sel: s, hover: h, mode: m, theme: t } = live.current;
        pills.update({ resorts: r, wx: w, sel: s, hover: h, mode: m, theme: t });
        pills.init().then(() => isCurrent() && setGeneration((g) => g + 1));
      });

      map.on('mousemove', (e) => {
        const id = pills.pick(e.point, 2);
        map.getCanvas().style.cursor = id ? 'pointer' : '';
        if (id !== live.current.hover) live.current.onHover(id);
      });
      map.on('mouseout', () => {
        if (live.current.hover) live.current.onHover(null);
      });
      map.on('click', (e) => {
        const id = pills.pick(e.point, live.current.mode === 'mobile' ? 8 : 3);
        if (id) live.current.onSelect(id);
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (started || !entry.isIntersecting || !el.clientWidth || !el.clientHeight) return;
        started = true;
        io.disconnect();
        create();
      },
      { rootMargin: '200px' },
    );
    io.observe(el);

    const ro = new ResizeObserver(() => instance.current?.map.resize());
    ro.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      ro.disconnect();
      clearTimeout(retryTimer);
      destroy();
    };
  }, []);

  // Entrées des pastilles
  useEffect(() => {
    instance.current?.pills.update({ resorts, wx, sel, hover, mode, theme });
  }, [resorts, wx, sel, hover, mode, theme, generation]);

  // Changement de thème (CHANGE_THEME de la page parente) : autre fond, nos couches sont rajoutées sur `style.load`.
  const lastTheme = useRef(theme);
  useEffect(() => {
    if (lastTheme.current === theme) return;
    lastTheme.current = theme;
    instance.current?.map.setStyle(MAP_THEMES[theme].style, { diff: false });
  }, [theme]);

  // Changement de largeur : recadrage sur la Suisse
  const lastWidth = useRef(width);
  useEffect(() => {
    if (lastWidth.current === width) return;
    lastWidth.current = width;
    const map = instance.current?.map;
    if (!map) return;
    requestAnimationFrame(() => {
      map.resize();
      map.fitBounds(CH_BOUNDS, { padding: overviewPadding(), duration: 0 });
    });
  }, [width, mode]);

  // Vol vers la sélection, retour à la Suisse quand elle est levée
  const lastSel = useRef(sel);
  useEffect(() => {
    const prev = lastSel.current;
    lastSel.current = sel;
    if (prev === sel) return;
    const map = instance.current?.map;
    if (!map) return;
    map.resize();
    const { findResort: find } = live.current;
    if (sel) {
      const r = find(sel);
      if (!r) return;
      map.easeTo({
        center: [r.lng, r.lat],
        zoom: Math.max(map.getZoom(), FOCUS_ZOOM[r.level || 3]),
        offset: flyOffset(),
        duration: frameDuration(),
        essential: true,
      });
    } else {
      frameOverview(map, overviewPadding());
    }
  }, [sel]);

  // Retour à la vue Suisse depuis le bouton, même vol que ci-dessus. Lu à l'image suivante : la fermeture des panneaux
  // (onShowAll) est alors rendue et la hauteur du panneau bas mobile à jour (recherche ouverte → 68 px). Calculé dans le
  // clic, le cadrage visait encore l'ancienne hauteur.
  const resetView = () => requestAnimationFrame(() => frameOverview(instance.current?.map, overviewPadding()));

  const zoomBy = (fn) => instance.current && instance.current.map[fn]();
  // « Afficher toute la Suisse » : ferme les panneaux ouverts (et vide la recherche sans station choisie). Station
  // choisie : sa levée déclenche le retour (effet ci-dessus) ; sinon, retour par resetView.
  const showAll = () => {
    onShowAll?.();
    if (!sel) resetView();
  };

  return (
    <div className="relative order-1 min-h-0 min-w-0 flex-1">
      {/* Taille explicite : la CSS du moteur force `position: relative` sur le conteneur, un `absolute inset-0` s'effondrerait. */}
      <div ref={containerRef} className="size-full bg-map" />
      {/* Au-dessus de la bande qui referme la recherche mobile (MobileSheet, z 5) : le bouton reste utilisable. */}
      <div className="absolute top-2.5 right-2.5 z-[6] flex flex-col gap-1.5">
        {mode !== 'mobile' && (
          <>
            <IconButton icon="fa-solid fa-plus" color="map" label="Zoom avant" onClick={() => zoomBy('zoomIn')} />
            <IconButton icon="fa-solid fa-minus" color="map" label="Zoom arrière" onClick={() => zoomBy('zoomOut')} />
          </>
        )}
        {/* Maison en 13 px (au lieu de 15) et opacité 75 % : pleine en noir, elle pesait plus que le + et le −. */}
        <IconButton icon="fa-solid fa-house text-[13px] opacity-75" color="map" label="Afficher toute la Suisse" onClick={showAll} />
      </div>
      {listToggle && (
        <div className="absolute top-3 left-3 z-[2]">
          <Button color="black" iconLeft="fa-solid fa-list" onClick={listToggle.onClick}>
            {listToggle.label}
          </Button>
        </div>
      )}
    </div>
  );
}
