import {
  HYSTERESIS,
  NAME_MIN_ZOOM,
  NARROW_ZOOM_OFFSET,
  LEVEL_MIN_ZOOM,
} from '../config/mapConfig';
import { drawPill, isPillImageId, PILL_FONTS, pillImageId, pillSize } from '../lib/pill';
import { placePills } from '../lib/placePills';
import { fmtTemp, wmo } from '../lib/weather';

const SOURCE = 'pills';
const LAYER = 'pills';
const MOVE_THROTTLE_MS = 60;
const FADE_MS = 200;
const HIDE_DELAY_MS = 220;
const COLLISION_PAD = 6;

const levelOf = (r) => r.level || 3;
const point = (lng, lat, properties) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties });

/**
 * Couche des pastilles : placement JS (pas la collision native), fondus en rAF.
 * Les entrées (domaines filtrés, météo, sélection, survol, mode) arrivent via `update()`.
 */
export class PillLayer {
  constructor(map) {
    this.map = map;
    this.state = { resorts: [], wx: {}, sel: null, hover: null, mode: 'wide' };
    this.anim = new Map(); // id → { ll, props, o, target, gone }
    this.ready = false;
    this.destroyed = false;
    this.firstPlaced = false;
    this.raf = null;
    this.moveTimer = null;
    this.lastInputs = null;

    this.onImageMissing = (e) => {
      if (!isPillImageId(e.id) || map.hasImage(e.id)) return;
      const { data, pixelRatio } = drawPill(e.id);
      map.addImage(e.id, data, { pixelRatio });
    };
    this.onMove = () => {
      if (this.moveTimer) return;
      this.moveTimer = setTimeout(() => {
        this.moveTimer = null;
        this.place();
      }, MOVE_THROTTLE_MS);
    };
    this.onMoveEnd = () => this.place();
    map.on('styleimagemissing', this.onImageMissing);
  }

  /** Attend les polices (sinon glyphes faux), puis crée la source et la couche. */
  async init() {
    try {
      await Promise.all(PILL_FONTS.map((f) => document.fonts.load(f)));
    } catch {
      // police indisponible : on dessine quand même avec le repli
    }
    if (this.destroyed) return;
    const map = this.map;
    map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: LAYER,
      type: 'symbol',
      source: SOURCE,
      layout: {
        'icon-image': ['get', 'img'],
        'icon-size': ['get', 's'],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'symbol-sort-key': ['get', 'z'],
      },
      paint: { 'icon-opacity': ['get', 'o'] },
    });
    map.on('move', this.onMove);
    map.on('moveend', this.onMoveEnd);
    this.ready = true;
    this.place();
  }

  update(next) {
    const s = { ...this.state, ...next };
    this.state = s;
    const inputs = [s.resorts, s.wx, s.sel, s.hover, s.mode];
    if (this.lastInputs && inputs.every((v, i) => v === this.lastInputs[i])) return;
    this.lastInputs = inputs;
    this.place();
  }

  /** Domaine sous le point (px), la pastille la plus haute l'emporte. */
  pick(pt, tolerance) {
    if (!this.ready) return null;
    const features = this.map.queryRenderedFeatures(
      [
        [pt.x - tolerance, pt.y - tolerance],
        [pt.x + tolerance, pt.y + tolerance],
      ],
      { layers: [LAYER] },
    );
    if (!features.length) return null;
    features.sort((a, b) => (b.properties.z || 0) - (a.properties.z || 0));
    return features[0].properties.id || null;
  }

  place() {
    if (!this.ready || this.destroyed) return;
    const map = this.map;
    const { resorts, wx, sel, hover, mode } = this.state;
    const z = map.getZoom();
    const offset = mode === 'wide' ? 0 : NARROW_ZOOM_OFFSET;
    const withName = mode === 'wide' || z >= NAME_MIN_ZOOM;
    const container = map.getContainer();
    const wasVisible = (id) => this.anim.get(id)?.target === 1;
    const minZoom = (level) => (level === 1 ? LEVEL_MIN_ZOOM[1] : LEVEL_MIN_ZOOM[level] + offset);

    const candidates = [];
    for (const r of resorts) {
      const level = levelOf(r);
      if (z < minZoom(level) - (wasVisible(r.id) ? HYSTERESIS : 0)) continue;
      const w = wx[r.id];
      const icon = wmo(w?.code);
      const temp = fmtTemp(w?.t);
      const name = withName ? r.short || r.name : '';
      const size = pillSize(temp, name);
      const p = map.project([r.lng, r.lat]);
      candidates.push({
        id: r.id,
        level,
        x: p.x,
        y: p.y,
        w: size.w + COLLISION_PAD,
        h: size.h + COLLISION_PAD,
        draw: { glyph: icon.glyph, weight: icon.weight, color: icon.color, temp, name },
      });
    }

    const placed = placePills(candidates, { sel, wasVisible, width: container.clientWidth, height: container.clientHeight });

    const now = performance.now();
    const seen = new Set();
    for (const it of placed) {
      const ll = map.unproject([it.x, it.y]);
      const selected = it.id === sel;
      const hovered = it.id === hover;
      const props = {
        id: it.id,
        z: selected ? 3 : hovered ? 2 : 1,
        img: pillImageId({ ...it.draw, selected, hovered }),
      };
      const e = this.anim.get(it.id);
      if (e) Object.assign(e, { ll: [ll.lng, ll.lat], props, target: 1, gone: null });
      else this.anim.set(it.id, { ll: [ll.lng, ll.lat], props, o: this.firstPlaced ? 0 : 1, target: 1, gone: null });
      seen.add(it.id);
    }
    this.firstPlaced = true;
    this.anim.forEach((e, id) => {
      if (!seen.has(id) && e.gone == null) e.gone = now;
    });
    this.startAnim();
  }

  startAnim() {
    if (this.raf) return;
    let last = performance.now();
    const step = (t) => {
      this.raf = null;
      if (!this.ready || this.destroyed) return;
      const dt = Math.min(64, t - last);
      last = t;
      let busy = false;
      this.anim.forEach((e, id) => {
        if (e.gone != null) {
          if (t - e.gone > HIDE_DELAY_MS) e.target = 0;
          else busy = true;
        }
        if (e.o !== e.target) {
          const d = dt / FADE_MS;
          e.o = e.target > e.o ? Math.min(1, e.o + d) : Math.max(0, e.o - d);
          busy = true;
        }
        if (e.target === 0 && e.o === 0) this.anim.delete(id);
      });
      const features = [];
      this.anim.forEach((e) => {
        const k = 1 - (1 - e.o) ** 3;
        features.push(point(e.ll[0], e.ll[1], { ...e.props, o: k, s: 0.85 + 0.15 * k }));
      });
      this.map.getSource(SOURCE)?.setData({ type: 'FeatureCollection', features });
      if (busy) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  destroy() {
    this.destroyed = true;
    this.ready = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.moveTimer);
  }
}
