import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CH_BOUNDS,
  COOPERATIVE_GESTURES,
  FIT_PADDING,
  FLY,
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

/**
 * Carte + pastilles. Vole vers `sel` quand il change ; revient à la vue Suisse quand il redevient null (D26, D27).
 * Initialisée seulement quand elle approche de l'écran (chargements facturés selon le fournisseur).
 * `theme` (« light » | « dark ») : fond, relief et pastilles ; un changement remplace le style de la carte.
 */
export function MapView({ resorts, wx, sel, hover, mode, width, theme, findResort, onHover, onSelect, listToggle }) {
  const containerRef = useRef(null);
  const instance = useRef(null); // { map, pills, loaded }
  const [generation, setGeneration] = useState(0); // incrémenté à chaque carte prête
  const live = useRef(null);
  useLayoutEffect(() => {
    live.current = { resorts, wx, sel, hover, mode, theme, findResort, onHover, onSelect };
  });

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
        const { sel: s0, findResort: find0, mode: m0 } = live.current;
        const r0 = s0 ? find0(s0) : null;
        if (r0) {
          map.easeTo({ center: [r0.lng, r0.lat], zoom: FOCUS_ZOOM[r0.level || 3], offset: m0 !== 'mobile' ? PANEL_FLY_OFFSET : [0, 0], duration: 0 });
        } else {
          map.fitBounds(CH_BOUNDS, { padding: FIT_PADDING[m0], duration: 0 });
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
      map.fitBounds(CH_BOUNDS, { padding: FIT_PADDING[mode], duration: 0 });
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
    // En mobile, la fiche (168 px) s'ouvre ou se ferme sous la carte dans le même rendu : on prend la nouvelle taille
    // avant de calculer le cadrage, sinon il vise l'ancienne (retour à la Suisse trop dézoomé, 5,2 au lieu de 5,7).
    map.resize();
    const { mode: m, findResort: find } = live.current;
    if (sel) {
      const r = find(sel);
      if (!r) return;
      map.flyTo({
        center: [r.lng, r.lat],
        zoom: Math.max(map.getZoom(), FOCUS_ZOOM[r.level || 3]),
        offset: m !== 'mobile' ? PANEL_FLY_OFFSET : [0, 0],
        ...FLY,
        essential: true,
      });
    } else {
      const cam = map.cameraForBounds(CH_BOUNDS, { padding: FIT_PADDING[m] });
      if (cam) map.flyTo({ ...cam, ...FLY, essential: true });
    }
  }, [sel]);

  const zoomBy = (fn) => instance.current && instance.current.map[fn]();
  const showAll = () => instance.current?.map.fitBounds(CH_BOUNDS, { padding: FIT_PADDING[mode], duration: 600 });

  return (
    <div className="relative order-1 min-h-0 min-w-0 flex-1">
      {/* Taille explicite : la CSS du moteur force `position: relative` sur le conteneur, un `absolute inset-0` s'effondrerait. */}
      <div ref={containerRef} className="size-full bg-map" />
      <div className="absolute top-2.5 right-2.5 z-[2] flex flex-col gap-1.5">
        {mode !== 'mobile' && (
          <>
            <IconButton icon="fa-solid fa-plus" color="map" label="Zoom avant" onClick={() => zoomBy('zoomIn')} />
            <IconButton icon="fa-solid fa-minus" color="map" label="Zoom arrière" onClick={() => zoomBy('zoomOut')} />
          </>
        )}
        <IconButton icon="fa-solid fa-expand" color="map" label="Afficher toute la Suisse" onClick={showAll} />
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
