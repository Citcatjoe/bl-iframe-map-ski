import resorts from './resorts.json';
import level1Ids from './stations-niveau-1.json';

/*
 * Stations de niveau 1 : la liste d'identifiants de `stations-niveau-1.json` fait foi (D52).
 * Pour changer la sélection, éditer ce fichier (identifiants = champ `id` de resorts.json) ;
 * aucun script à relancer. Les autres stations gardent le niveau 2 ou 3 calculé (D46).
 */
const LEVEL_1 = new Set(level1Ids);

if (import.meta.env.DEV) {
  const known = new Set(resorts.map((r) => r.id));
  const unknown = level1Ids.filter((id) => !known.has(id));
  if (unknown.length) console.warn(`stations-niveau-1.json : identifiants inconnus : ${unknown.join(', ')}`);
}

/**
 * Les 154 stations du widget, générées par `npm run resorts` (scripts/build-resorts.mjs)
 * depuis la liste skiinfo.fr, swisstopo et OpenSkiData. Schéma : ETAT-DU-PROJET.md § 3.2.
 */
export const RESORTS = resorts.map((r) => (LEVEL_1.has(r.id) ? { ...r, level: 1 } : r));
