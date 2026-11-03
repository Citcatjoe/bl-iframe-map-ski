import { useEffect, useState } from 'react';
import { WEATHER_URL } from '../config/weatherConfig';

/**
 * Charge `weather.json` (relevé horaire du VPS, voir scripts/fetch-weather.mjs et deploy/).
 * `time` = heure du relevé (`generatedAt`), pas l'heure de validité du modèle (`observedAt`).
 * @returns {{ wx: Record<string, object>, status: 'loading'|'ok'|'error', time: string|null }}
 */
export function useWeather() {
  const [state, setState] = useState({ wx: {}, status: 'loading', time: null });

  useEffect(() => {
    const ctrl = new AbortController();
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
        setState({ wx: {}, status: 'error', time: null });
      });
    return () => ctrl.abort();
  }, []);

  return state;
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
