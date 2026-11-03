import { formatWeatherTime } from '../hooks/useWeather';

const DOT = { ok: 'bg-ok', error: 'bg-brand', loading: 'bg-line' };
const TITLE_SIZE = { wide: 'text-[26px]', mid: 'text-[22px]', mobile: 'text-[18px]' };

export function Header({ mode, wxStatus, wxTime }) {
  const mobile = mode === 'mobile';
  const t = formatWeatherTime(wxTime);
  // Mobile, relevé d'un autre jour : la date seule (la place manque pour date + heure à 320 px).
  const when = !t ? '' : !t.day ? t.hhmm : mobile ? t.day : `${t.day}, ${t.hhmm}`;
  const stamp =
    wxStatus === 'ok'
      ? `${mobile ? 'Relevé' : 'Dernier relevé'}${when ? `\u00a0: ${when}` : ''}`
      : wxStatus === 'error'
        ? 'Météo indisponible'
        : 'Chargement météo…';

  return (
    <header className={`flex flex-none flex-col gap-[5px] border-b border-line ${mobile ? 'px-3.5 pt-[9px] pb-2' : 'px-4 pt-3 pb-[11px]'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] leading-none font-bold tracking-[0.04em] whitespace-nowrap text-ink-brand uppercase">
          Webcams · Stations de ski
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] leading-none font-medium whitespace-nowrap text-ink-weak" aria-live="polite">
          <span className={`size-[7px] rounded-full ${DOT[wxStatus]}`} aria-hidden="true" />
          {stamp}
        </span>
      </div>
      <h2 className={`m-0 truncate font-display leading-[1.1] font-bold ${TITLE_SIZE[mode]}`}>Jette un œil sur ta station</h2>
    </header>
  );
}
