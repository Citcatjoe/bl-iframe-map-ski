import { useEffect, useState } from 'react';
import { WEATHER_REFRESH_MS, WEATHER_STALE_AFTER_MS, WEATHER_URL } from '../config/weatherConfig';

/**
 * Charge `weather.json` (relevé horaire du VPS, voir scripts/fetch-weather.mjs et deploy/), puis le relit tous les
 * quarts d'heure. Une relecture en échec garde les données déjà affichées (leur âge le dira).
 * `time` = heure du relevé (`generatedAt`). Contenu par station : docs/METEO.md.
 * @returns {{ wx: Record<string, object>, status: 'loading'|'ok'|'error', time: string|null }}
 */
export function useWeather() {
  const [state, setState] = useState({ wx: {}, status: 'loading', time: null });

  useEffect(() => {
    let ctrl = null;
    const load = () => {
      ctrl = new AbortController();
      fetch(WEATHER_URL, { signal: ctrl.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`weather ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (!data || typeof data.resorts !== 'object') throw new Error('weather: format invalide');
          setState({ wx: data.resorts, status: 'ok', time: data.generatedAt || null });
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.warn(err);
          setState((prev) => (prev.status === 'ok' ? prev : { wx: {}, status: 'error', time: null }));
        });
    };
    load();
    const timer = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      clearInterval(timer);
      ctrl?.abort();
    };
  }, []);

  return state;
}

/** Heure courante, rafraîchie chaque minute (âge du relevé dans l'en-tête). */
export function useNow(everyMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}

/** Relevé de plus de 2 h (au moins un relevé horaire manqué) : à signaler comme ancien. */
export function isWeatherStale(time, now) {
  const t = time ? new Date(time).getTime() : NaN;
  return !Number.isNaN(t) && now - t > WEATHER_STALE_AFTER_MS;
}

const TZ = 'Europe/Zurich';
const dayKey = (d) => d.toLocaleDateString('sv-SE', { timeZone: TZ }); // AAAA-MM-JJ à l'heure suisse

/**
 * Heure du relevé à l'heure suisse : `hhmm` (« 14:30 ») et `day` (« 5 oct. ») si ce n'est pas aujourd'hui,
 * pour qu'un fichier ancien ne passe pas pour celui du jour.
 * @returns {{ hhmm: string, day: string|null }|null}
 */
export function formatWeatherTime(time) {
  if (!time) return null;
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return null;
  const hhmm = d.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  if (dayKey(d) === dayKey(new Date())) return { hhmm, day: null };
  return { hhmm, day: d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', timeZone: TZ }) };
}
