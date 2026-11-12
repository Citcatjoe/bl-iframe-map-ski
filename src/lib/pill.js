// Rendu canvas des pastilles (README § Pastille). Chaque variante est une image
// de style générée à la demande ; son id encode tout ce qu'il faut pour la dessiner.

import { MAP_THEMES } from '../config/mapConfig';
import { WX_ICONS, WX_PALETTES } from './weatherIcons';

const FONT_NAME = '700 12.5px BlickVariable, InterVariable, sans-serif';
const FONT_TEMP = '700 10.5px InterVariable, sans-serif';

/** Polices à charger avant le premier rendu, sinon les glyphes sont faux. */
export const PILL_FONTS = [FONT_NAME, FONT_TEMP];

const PIXEL_RATIO = 2;
const MARGIN = 16; // marge du canvas pour l'ombre portée
const SEP = '§';

const paths = new Map();
const path2d = (d) => {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  return paths.get(d);
};

/** Picto `name` (src/lib/weatherIcons.js) dans le carré (left, top, size) : aux couleurs `palette`, ou blanc (sélection). */
function drawIcon(x, name, left, top, size, palette) {
  const icon = WX_ICONS[name] ?? WX_ICONS.none;
  x.save();
  x.translate(left, top);
  x.scale(size / 24, size / 24);
  if (!palette) {
    x.fillStyle = '#FFFFFF';
    x.fill(path2d(icon.mono), 'evenodd');
  } else {
    for (const [role, d] of icon.layers) {
      x.fillStyle = palette[role];
      x.fill(path2d(d), 'evenodd');
    }
  }
  x.restore();
}

let measureCtx = null;
function textWidth(text, font) {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx.font = font;
  return measureCtx.measureText(String(text)).width;
}

// Mise en page (D63, 05/11/2026 ; essai `?pill=minmax` du 03/11 devenu la pastille par défaut) : picto à gauche,
// centré sur les deux lignes ; ligne 1 le nom, ligne 2 « min / max » du jour (PillLayer). En px depuis le bord gauche
// de la pastille. L'espace se mesure sur le dessin du picto (`ink` de weatherIcons.js), pas sur son carré de 24 : les
// dessins étroits (pluie, lune) ne laissent pas de vide autour. `inkX` : début du dessin ; `gap` : du dessin au texte
// (assez pour que le signe moins ne colle pas). Marges réduites de 2 px essayées le 03/11/2026, rejetées ; réduites de
// 1 à 2 px le 05/11/2026 (hauteur 36 au lieu de 38, compacte 22 au lieu de 24), avec la température en 10,5 px.
// Compacte (mobile) : 3 px du dessin au texte au lieu de 4,5 (05/11/2026).
const LAYOUT = {
  full: { h: 36, icon: 22, inkX: 11, gap: 6, right: 12, nameY: 11.5, tempY: 25.5 },
  compact: { h: 22, icon: 16, inkX: 6, gap: 3, right: 9 },
};

function layoutOf(icon, name) {
  const L = name ? LAYOUT.full : LAYOUT.compact;
  const [inkLeft, inkWidth] = (WX_ICONS[icon] ?? WX_ICONS.none).ink;
  const k = L.icon / 24;
  const iconX = L.inkX - inkLeft * k; // bord gauche du carré du picto
  const textX = L.inkX + inkWidth * k + L.gap; // texte qui suit le picto
  return { ...L, iconX, textX };
}

/** Taille de la pastille, hors marge d'ombre. Sans nom : pastille compacte (1 ligne). */
export function pillSize(icon, temp, name) {
  const L = layoutOf(icon, name);
  const text = name ? Math.max(textWidth(name, FONT_NAME), textWidth(temp, FONT_TEMP)) : textWidth(temp, FONT_TEMP);
  return { w: L.textX + text + L.right, h: L.h };
}

/** @param {{ icon: string, temp: string, name: string, selected: boolean, hovered: boolean, theme: string }} p */
export function pillImageId(p) {
  return ['pill', p.icon, p.temp, p.selected ? 1 : 0, p.hovered ? 1 : 0, p.theme, p.name].join(SEP);
}

export const isPillImageId = (id) => id.startsWith(`pill${SEP}`);

/** Dessine la pastille encodée dans `id`. Retourne l'ImageData et son pixelRatio. */
export function drawPill(id) {
  const [, icon, temp, selS, hovS, theme, name] = id.split(SEP);
  const sel = selS === '1';
  const hov = hovS === '1';
  const t = MAP_THEMES[theme] ? theme : 'light';
  const c = MAP_THEMES[t].pill;
  const size = pillSize(icon, temp, name);
  const L = layoutOf(icon, name);
  const W = Math.ceil(size.w);
  const H = size.h;
  const R = H / 2;
  const k = PIXEL_RATIO;

  const canvas = document.createElement('canvas');
  canvas.width = (W + MARGIN * 2) * k;
  canvas.height = (H + MARGIN * 2) * k;
  const x = canvas.getContext('2d');
  x.scale(k, k);
  x.textBaseline = 'middle';
  const X = MARGIN;
  const Y = MARGIN;

  // Fond + ombre de contact
  x.save();
  x.shadowColor = 'rgba(18,16,16,0.12)';
  x.shadowBlur = 1.5;
  x.shadowOffsetY = 0.5;
  x.beginPath();
  x.roundRect(X, Y, W, H, R);
  x.fillStyle = sel ? '#E20000' : hov ? c.hover : c.bg;
  x.fill();
  x.restore();

  // Ombre portée diffuse, dessinée sous le fond
  x.save();
  x.globalCompositeOperation = 'destination-over';
  x.shadowColor = c.shadow;
  x.shadowBlur = 20;
  x.shadowOffsetY = 4;
  x.beginPath();
  x.roundRect(X, Y, W, H, R);
  x.fillStyle = sel ? '#E20000' : c.bg;
  x.fill();
  x.restore();

  const tx = X + L.textX;
  drawIcon(x, icon, X + L.iconX, Y + (H - L.icon) / 2, L.icon, sel ? null : WX_PALETTES[t]);
  if (name) {
    x.font = FONT_NAME;
    x.fillStyle = sel ? '#FFFFFF' : c.name;
    x.fillText(name, tx, Y + L.nameY);
  }
  x.font = FONT_TEMP;
  x.fillStyle = sel ? '#FFFFFF' : c.temp;
  x.fillText(temp, tx, name ? Y + L.tempY : Y + H / 2 + 0.5);

  return { data: x.getImageData(0, 0, canvas.width, canvas.height), pixelRatio: k };
}
