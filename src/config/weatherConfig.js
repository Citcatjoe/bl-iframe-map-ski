// La météo est produite côté serveur (cron horaire → weather.json), jamais
// appelée par lecteur. Source non tranchée : ETAT-DU-PROJET.md § 4.3.

export const WEATHER_URL = import.meta.env.VITE_WEATHER_URL || 'data/weather.json';

/** Libellés de source du pied de page (à adapter si la source change). */
export const WEATHER_CREDIT = {
  long: 'Météo : MétéoSuisse ICON-CH via Open-Meteo (CC BY 4.0)',
  short: 'Météo : Open-Meteo / MétéoSuisse',
};
