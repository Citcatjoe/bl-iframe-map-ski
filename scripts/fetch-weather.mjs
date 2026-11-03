#!/usr/bin/env node
// Produit weather.json pour tous les domaines. En production : relevé horaire sur le VPS pegasus
// (deploy/bl-iframe-map-ski.timer), servi par https://ski.citcatlab.ch/weather.json.
// Le navigateur ne lit que ce fichier : ~24 relevés par jour au lieu d'un appel par lecteur.
//
// Usage : node scripts/fetch-weather.mjs [chemin/de/sortie.json]
//   Sortie par défaut : public/data/weather.json
//   Domaines : src/data/resorts.json
//
// Conditions en altitude (D51) : chaque station est interrogée à son `weatherPoint`
// (gare d'arrivée la plus haute des remontées de la station), avec son altitude exacte
// (paramètre `elevation`). Sans `weatherPoint`, on prend le lieu de la station et son altitude.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, process.argv[2] || 'public/data/weather.json');
const RESORTS = resolve(ROOT, 'src/data/resorts.json');

const API = 'https://api.open-meteo.com/v1/forecast';
const BATCH = 80;
const SOURCE = 'MeteoSwiss ICON-CH via Open-Meteo (CC BY 4.0)';

const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

// Nouvelles tentatives : l'API gratuite répond régulièrement 503 « The service is overloaded », puis accepte la même
// requête quelques secondes plus tard. Délais entre les essais (4 essais au plus), délai maximal d'une requête.
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000];
const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET JSON avec nouvelles tentatives sur erreur passagère (5xx, 429, réseau, délai dépassé) ; 4xx : échec direct. */
async function getJson(url) {
  for (let attempt = 0; ; attempt++) {
    let error;
    let res = null;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (res.ok) return await res.json();
      error = new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
    } catch (err) {
      error = err; // réseau, délai dépassé, corps illisible
    }
    if (res && !res.ok && !RETRY_STATUS.has(res.status)) throw error;
    if (attempt >= RETRY_DELAYS_MS.length) throw error;
    console.warn(`essai ${attempt + 1} échoué (${error.message.slice(0, 120)}), nouvel essai dans ${RETRY_DELAYS_MS[attempt] / 1000} s`);
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

/** Point interrogé : le haut du domaine, à défaut le lieu de la station. Toujours avec une altitude. */
function pointOf(r) {
  return r.weatherPoint ?? { lat: r.lat, lng: r.lng, elevation: r.elevation };
}

async function fetchBatch(resorts) {
  const pts = resorts.map(pointOf);
  const params = new URLSearchParams({
    latitude: pts.map((p) => p.lat).join(','),
    longitude: pts.map((p) => p.lng).join(','),
    current: 'temperature_2m,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum',
    forecast_days: '3',
    timezone: 'Europe/Zurich',
    elevation: pts.map((p) => p.elevation).join(','),
  });

  const body = await getJson(`${API}?${params}`);
  const arr = Array.isArray(body) ? body : [body];
  if (arr.length !== resorts.length) throw new Error(`Open-Meteo : ${arr.length} réponses pour ${resorts.length} points`);

  return arr.map((x, i) => {
    const days = x.daily.time.map((date, j) => ({
      date,
      code: x.daily.weather_code[j],
      max: round1(x.daily.temperature_2m_max[j]),
      min: round1(x.daily.temperature_2m_min[j]),
      snow: round1(x.daily.snowfall_sum[j]),
    }));
    return {
      id: resorts[i].id,
      time: x.current.time,
      data: {
        t: round1(x.current.temperature_2m),
        code: x.current.weather_code,
        wind: round1(x.current.wind_speed_10m),
        elevation: Math.round(x.elevation), // altitude réellement utilisée par Open-Meteo (m)
        snow3: round1(days.reduce((sum, d) => sum + (d.snow || 0), 0)),
        days,
      },
    };
  });
}

async function main() {
  const resorts = JSON.parse(await readFile(RESORTS, 'utf8'));

  const out = {};
  let observedAt = null;
  for (let i = 0; i < resorts.length; i += BATCH) {
    for (const { id, time, data } of await fetchBatch(resorts.slice(i, i + BATCH))) {
      out[id] = data;
      observedAt ??= time;
    }
  }

  const json = {
    generatedAt: new Date().toISOString(),
    observedAt, // heure locale Europe/Zurich renvoyée par Open-Meteo (AAAA-MM-JJTHH:MM)
    source: SOURCE,
    resorts: out,
  };

  // Écriture atomique : un lecteur ne voit jamais un fichier à moitié écrit.
  await mkdir(dirname(OUT), { recursive: true });
  const tmp = `${OUT}.tmp`;
  await writeFile(tmp, `${JSON.stringify(json)}\n`);
  await rename(tmp, OUT);
  console.log(`weather.json : ${Object.keys(out).length} stations → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
