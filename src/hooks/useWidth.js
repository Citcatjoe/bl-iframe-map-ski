import { useLayoutEffect, useState } from 'react';

// Trois largeurs d'iframe cibles : 964 px (largeur max), 632 px (colonne d'article,
// slot de homepage ou de page de rubrique) et mobile (< 400 px en pratique).
// Seuils à mi-chemin entre les cibles, pour tolérer les écarts réels
// (téléphones de 412 à 440 px, iframe un peu plus étroite que sa colonne…).

/** Largeur maximale du widget : au-delà, il reste à 964 px, centré. */
export const MAX_WIDTH = 964;

/** Largeur → mode de layout : wide ≥ 860 (cible 964), mid ≥ 520 (cible 632), sinon mobile. */
export const modeFor = (w) => (w >= 860 ? 'wide' : w >= 520 ? 'mid' : 'mobile');

/**
 * Hauteur de la zone de carte : format 4:3 de la largeur du widget (13/11/2026 ; avant, hauteur fixe de l'iframe par
 * mode, 600 / 540 / 393 px). 964 px → 723 px de carte, 632 → 474, 360 → 270. Le widget prend la hauteur de son
 * contenu (iframeHeightAdjustment.js suit), mais elle ne bouge pas à l'usage : en mobile, la fiche compacte (168 px)
 * remplace la barre de recherche dans la même zone, et la carte rétrécit d'autant.
 */
export const mapHeight = (width) => Math.round((width * 3) / 4);

/** Mobile : barre de recherche sous la carte (padding 10 px × 2, champ de 40 px, filet haut de 1 px). */
export const MOBILE_BAR_HEIGHT = 61;

/** Largeur observée d'un élément (celle de l'iframe, plafonnée à MAX_WIDTH). */
export function useWidth(ref) {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? Math.min(window.innerWidth, MAX_WIDTH) : MAX_WIDTH));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}
