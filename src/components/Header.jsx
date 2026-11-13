import { formatWeatherTime, isWeatherStale, useNow } from '../hooks/useWeather';

const DOT = { ok: 'bg-ok', stale: 'bg-warn', error: 'bg-brand', loading: 'bg-line' };

/** Sous ce seuil (largeur du widget), en-tête réduit : heure seule dans l'état du relevé (comme bl-iframe-traffic). */
export const HEADER_NARROW_MAX = 480;

/**
 * En-tête commun aux deux modes : titre et état du relevé sur une ligne, à toutes les largeurs. Fond `fill-weak` et
 * petit retrait intérieur : les bords du widget restent lisibles dans l'article. Titre traité en surtitre dans les
 * deux modes (petit, capitales, rouge Blick ; essai du 13/11/2026 en explore, à la place du titre Blick 19 px).
 * `compact` : sans filet dessous (la liste suit) ; sinon (explore) filet sur la carte.
 */
export function Header({ narrow, wxStatus, wxTime, compact = false, title = 'Jette un œil sur ta station' }) {
  const now = useNow();
  const stale = wxStatus === 'ok' && isWeatherStale(wxTime, now);
  const t = formatWeatherTime(wxTime);
  // Relevé d'un autre jour : la date (seule en étroit, la place manque pour date + heure à 320 px).
  const when = !t ? '' : !t.day ? t.hhmm : narrow ? t.day : `${t.day}, ${t.hhmm}`;
  const stamp =
    wxStatus === 'ok'
      ? narrow
        ? stale
          ? `Ancien${when ? `\u00a0: ${when}` : ''}`
          : when || 'Relevé'
        : `${stale ? 'Relevé ancien' : 'Dernier relevé'}${when ? `\u00a0: ${when}` : ''}`
      : wxStatus === 'error'
        ? 'Météo indisponible'
        : 'Chargement…';

  return (
    <header className={`flex flex-none items-center justify-between gap-3 bg-surface-weak px-3 py-2.5 ${compact ? '' : 'border-b border-line'}`}>
      <h2 className="m-0 min-w-0 truncate font-body text-[13px] leading-none font-bold tracking-[0.04em] whitespace-nowrap text-ink-brand uppercase">
        {title}
      </h2>
      <span className="flex flex-none items-center gap-1.5 text-[12px] leading-none whitespace-nowrap text-ink-weak" aria-live="polite">
        <span className={`size-2 rounded-full ${DOT[stale ? 'stale' : wxStatus]}`} aria-hidden="true" />
        {stamp}
      </span>
    </header>
  );
}
