import { cantonLabel } from '../data/cantons';
import { dayLabel, fmtAltitude, fmtSnow, fmtTemp, fmtWind, hostOf, uiIconColor, wmo } from '../lib/weather';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

const EMPTY_DAYS = [null, null, null];

export function WxIcon({ code, className = '' }) {
  const w = wmo(code);
  return <i className={`${w.icon} ${className}`} style={{ color: uiIconColor(w) }} aria-hidden="true" />;
}

/** « Voir les webcams » + hôte de la page. Rien si aucune page webcams n'est connue. */
function WebcamsLink({ url, className = '' }) {
  if (!url) return null;
  return (
    <div className={`flex items-center justify-between gap-x-3 gap-y-2 ${className}`}>
      <Button color="red" iconLeft="fa-solid fa-video" iconRight="fa-solid fa-arrow-up-right-from-square" href={url}>
        Voir les webcams
      </Button>
      <span className="truncate text-[11px] text-ink-weak">{hostOf(url)}</span>
    </div>
  );
}

/** Altitude des conditions affichées : celle utilisée par la météo, à défaut le point en altitude de la station. */
const conditionsAltitude = (resort, w) => w?.elevation ?? resort.weatherPoint?.elevation ?? resort.elevation;

/** Fiche complète (page droite du panneau, 964 / 632 px). */
export function ResortDetail({ resort, w }) {
  const now = wmo(w?.code);
  const days = w?.days ?? EMPTY_DAYS;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-4 pt-[18px] pb-4">
      <div className="flex flex-col gap-[5px]">
        <span className="text-[11px] font-bold tracking-[0.04em] text-ink-brand uppercase">{cantonLabel(resort.canton)}</span>
        <h3 className="m-0 font-display text-[28px] leading-[1.1] font-bold text-balance">{resort.name}</h3>
      </div>
      <div className="flex items-center gap-3">
        <WxIcon code={w?.code} className="w-[34px] text-center text-[28px]" />
        <span className="font-display text-[40px] leading-none font-bold">{fmtTemp(w?.t)}</span>
        <span className="flex flex-col gap-0.5 text-[13px] leading-[1.35]">
          <strong>{now.desc}</strong>
          <span className="text-ink-weak">Vent {fmtWind(w?.wind)}</span>
          <span className="text-ink-weak">à {fmtAltitude(conditionsAltitude(resort, w))}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 overflow-hidden rounded-md border border-line">
        {days.map((d, i) => (
          <div key={i} className="-mr-px flex flex-col items-center gap-[5px] border-r border-line px-1 py-2.5">
            <span className="text-[11px] font-bold tracking-[0.04em] text-ink-weak uppercase">{d ? dayLabel(d.date, i) : '–'}</span>
            <WxIcon code={d?.code} className="text-[16px]" />
            <span className="text-[13px] font-bold">{d ? `${fmtTemp(d.max)} / ${fmtTemp(d.min)}` : '–'}</span>
            <span className="text-[12px] whitespace-nowrap text-ink-weak">
              <i className="fa-regular fa-snowflake mr-[3px]" aria-hidden="true" />
              {fmtSnow(d?.snow)}
            </span>
          </div>
        ))}
      </div>
      <WebcamsLink url={resort.webcams} className="flex-wrap" />
    </div>
  );
}

/** Fiche compacte sous la carte (mobile, 168 px). */
export function ResortDock({ resort, w, onClose }) {
  const now = wmo(w?.code);
  const days = w?.days ?? EMPTY_DAYS;
  return (
    <section
      aria-label={`Fiche ${resort.name}`}
      className="order-3 flex h-[168px] flex-none flex-col gap-2.5 border-t border-line bg-surface px-4 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[10.5px] font-bold tracking-[0.04em] text-ink-brand uppercase">{cantonLabel(resort.canton)}</span>
          <h3 className="m-0 truncate font-display text-[20px] leading-[1.1] font-bold">{resort.name}</h3>
        </div>
        <IconButton icon="fa-solid fa-xmark" color="grey" label="Fermer" onClick={onClose} />
      </div>
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <WxIcon code={w?.code} className="w-6 text-center text-[20px]" />
          <span className="font-display text-[28px] leading-none font-bold">{fmtTemp(w?.t)}</span>
          <span className="flex min-w-0 flex-col text-[11.5px] leading-[1.3]">
            <strong className="whitespace-nowrap">{now.desc}</strong>
            <span className="whitespace-nowrap text-ink-weak">Vent {fmtWind(w?.wind)}</span>
            <span className="whitespace-nowrap text-ink-weak">à {fmtAltitude(conditionsAltitude(resort, w))}</span>
          </span>
        </div>
        <div className="flex flex-none gap-2.5">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-[3px]">
              <span className="text-[10px] font-bold tracking-[0.04em] text-ink-weak uppercase">{d ? dayLabel(d.date, i, true) : '–'}</span>
              <WxIcon code={d?.code} className="text-[13px]" />
              <span className="text-[11px] font-bold whitespace-nowrap">{fmtSnow(d?.snow)}</span>
            </div>
          ))}
        </div>
      </div>
      <WebcamsLink url={resort.webcams} className="mt-auto" />
    </section>
  );
}
