#!/usr/bin/env node
// Capture la liste des stations de ski suisses publiée par skiinfo.fr
// (tableau « Toutes les stations de ski de Suisse ») dans data/sources/skiinfo-suisse.json.
//
// Liste de travail, pas le dataset du widget : elle ne contient que le nom et l'URL
// skiinfo de chaque station. Les régions skiinfo (« oberland-bernois », « lac-leman »…)
// ne sont PAS des cantons. Enrichissement prévu : ETAT-DU-PROJET.md § 3.5.
//
// Usage : node scripts/fetch-skiinfo-list.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://www.skiinfo.fr/suisse/stations-de-ski';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../data/sources/skiinfo-suisse.json');

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

async function main() {
  const res = await fetch(SOURCE, { headers: { 'user-agent': 'Mozilla/5.0 (bl-iframe-map-ski)' } });
  if (!res.ok) throw new Error(`skiinfo ${res.status}`);
  const html = await res.text();

  const start = html.indexOf('Toutes les stations de ski de Suisse');
  if (start < 0) throw new Error('Tableau « Toutes les stations » introuvable : la page a changé.');
  const table = html.slice(start, html.indexOf('</table>', start));

  const stations = [];
  const seen = new Set();
  for (const [, path, inner] of table.matchAll(/<a[^>]*href="(\/[^"]+\/station-de-ski)"[^>]*>([\s\S]*?)<\/a>/g)) {
    if (seen.has(path)) continue;
    seen.add(path);
    const [, region, slug] = path.split('/');
    // Le lien contient parfois le nom deux fois (version mobile + desktop), parfois collé (« XX »).
    const raw = decode(inner.replace(/<[^>]+>/g, '|').split('|').map((s) => s.trim()).find(Boolean) ?? '');
    const half = raw.slice(0, raw.length / 2);
    const name = raw.length % 2 === 0 && half + half === raw ? half : raw;
    stations.push({ name, slug, skiinfoRegion: region, url: `https://www.skiinfo.fr${path}` });
  }
  if (stations.length < 100) throw new Error(`Seulement ${stations.length} stations lues : vérifier le parsing.`);

  const json = {
    source: SOURCE,
    retrievedAt: new Date().toISOString().slice(0, 10),
    note: 'Liste brute skiinfo.fr (nom + URL). Régions skiinfo ≠ cantons. Coordonnées, canton, site officiel et niveau à compléter (ETAT-DU-PROJET.md § 3.5).',
    count: stations.length,
    stations,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`${stations.length} stations → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
