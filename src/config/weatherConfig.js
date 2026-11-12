// La météo est produite côté serveur (relevé horaire → weather.json, scripts/fetch-weather.mjs), jamais appelée par
// lecteur. Sources (D59) : MétéoSuisse (prévisions locales) et SLF (enneigement mesuré).

export const WEATHER_URL = import.meta.env.VITE_WEATHER_URL || 'data/weather.json';

// Le VPS publie un relevé par heure (hh:15) ; un fichier de plus de 2 h veut dire qu'au moins un relevé a manqué.
// L'en-tête l'affiche alors comme ancien (point jaune, « Relevé ancien »).
export const WEATHER_STALE_AFTER_MS = 2 * 60 * 60 * 1000;
// Le widget relit le fichier tous les quarts d'heure : un onglet resté ouvert suit les relevés au lieu de vieillir.
export const WEATHER_REFRESH_MS = 15 * 60 * 1000;

/**
 * Crédits du pied de page, exigés par les sources : MétéoSuisse, citer la source (« Source : MétéoSuisse », CC BY 4.0 ;
 * sans laisser croire à un soutien), lien vers son site ; SLF (CC BY 4.0), une référence
 * clairement visible avec un lien vers www.slf.ch. Vérifié le 05/11/2026.
 */
export const WEATHER_CREDIT = {
  weather: { label: 'Météo :', source: 'MétéoSuisse', href: 'https://www.meteosuisse.admin.ch' },
  snow: { label: 'Neige : SLF', href: 'https://www.slf.ch' },
};
