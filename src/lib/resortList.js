import { cantonName } from '../data/cantons';

/**
 * Recherche insensible à la casse sur le nom, le nom du canton (« vaud ») et le code exact (« VD »).
 * Tri « snow » : neige 3 j décroissante, puis niveau, puis nom. Tri « az » : nom (fr).
 */
export function filterResorts(resorts, query, sort, wx) {
  const q = query.trim().toLowerCase();
  const list = q
    ? resorts.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          cantonName(r.canton).toLowerCase().includes(q) ||
          r.canton.toLowerCase() === q,
      )
    : resorts.slice();

  if (sort === 'snow') {
    const snow = (r) => wx[r.id]?.snow3 || 0;
    return list.sort((a, b) => snow(b) - snow(a) || (a.level || 3) - (b.level || 3) || a.name.localeCompare(b.name, 'fr'));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/**
 * Sélection de stations (paramètre `?points=`) : identifiants (champ `id` de resorts.json) séparés par des
 * virgules ; `|` sépare des colonnes du mode compact (`verbier,zermatt|davos,laax`). Vide ou absent : toutes les
 * stations, `columns` à null. Identifiants inconnus ignorés et renvoyés dans `unknown`.
 * @returns {{ list: object[], columns: object[][]|null, unknown: string[] }}
 */
export function selectResorts(resorts, param) {
  const groups = (param ?? '').split('|').map((g) => g.split(',').map((s) => s.trim()).filter(Boolean)).filter((g) => g.length);
  if (!groups.length) return { list: resorts, columns: null, unknown: [] };
  const byId = new Map(resorts.map((r) => [r.id, r]));
  const columns = groups.map((g) => [...new Set(g)].map((id) => byId.get(id)).filter(Boolean)).filter((g) => g.length);
  return {
    list: columns.flat(),
    columns: columns.length > 1 ? columns : null,
    unknown: groups.flat().filter((id) => !byId.has(id)),
  };
}
