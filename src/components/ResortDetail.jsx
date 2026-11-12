import { cantonLabel } from '../data/cantons';
import { formatWeatherTime, useNow } from '../hooks/useWeather';
import { dayLabel, fmtAltitude, fmtSnow, fmtTemp, fmtWind, hostOf, skyOf, todayKey, weekDayLabels } from '../lib/weather';
import { WX_ICONS } from '../lib/weatherIcons';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

const EMPTY_DAYS = [null, null, null];

/**
 * Picto météo en SVG, 1,2 em de haut (taille de police de `className`, `text-[Npx]`), l'encombrement des anciens
 * pictos Font Awesome. Recadré en largeur sur le dessin (`ink`) : l'espace autour du picto est celui de la mise en
 * page, pas les marges de son carré de 24. Couleurs par rôle : variables --wx-* (index.css, clair / sombre).
 */
export function WxIcon({ sky, className = '' }) {
  const icon = WX_ICONS[skyOf(sky).icon];
  const [inkLeft, inkWidth] = icon.ink;
  return (
    <svg
      viewBox={`${inkLeft} 0 ${inkWidth} 24`}
      width={`${(1.2 * inkWidth) / 24}em`}
      height="1.2em"
      className={`inline-block flex-none align-[-0.25em] ${className}`}
      aria-hidden="true"
    >
      {icon.layers.map(([role, d]) => (
        <path key={role} d={d} fill={`var(--wx-${role})`} fillRule="evenodd" />
      ))}
    </svg>
  );
}

/** « 14:00 » le jour même, « 2 nov., 14:00 » sinon (heure suisse). */
function measuredAt(iso) {
  const t = formatWeatherTime(iso);
  return t ? (t.day ? `${t.day}, ${t.hhmm}` : t.hhmm) : null;
}

/**
 * Enneigement SLF à la station IMIS la plus proche du haut du domaine (D59, D61, docs/METEO.md), donc en altitude, à
 * l'altitude de la station de mesure. Deux grandeurs différentes, nommées comme telles : la neige au sol (mesurée par
 * le capteur, dernière mesure) et la neige tombée en 3 jours (estimée par le modèle du SLF). Elles peuvent se
 * contredire en apparence : neige tombée puis fondue. `snow` null : aucune station à moins de 25 km.
 */
function SnowBlock({ snow }) {
  const at = snow && measuredAt(snow.hsAt);
  return (
    <div className="flex flex-none flex-col gap-1.5 rounded-md bg-panel-hover px-3 py-2.5 text-[13px] leading-[1.35]">
      <span className="text-[11px] font-bold tracking-[0.04em] text-ink-weak uppercase">
        Enneigement en altitude{snow ? ` · ${fmtAltitude(snow.elevation)}` : ''}
      </span>
      {snow ? (
        <>
          <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5">
            <dt>Neige au sol</dt>
            <dd className="m-0 text-right font-bold">{fmtSnow(snow.hs)}</dd>
            <dt>
              Neige tombée en 3 jours <span className="text-ink-weak">(estimation)</span>
            </dt>
            <dd className="m-0 text-right font-bold">{fmtSnow(snow.hn3)}</dd>
          </dl>
          {/* Sans nom de source : les crédits (MétéoSuisse, SLF) sont dans le pied de page du widget. */}
          <span className="text-[11.5px] text-ink-weak">
            Station {snow.station}
            {at ? `, mesure de ${at}` : ''}
          </span>
        </>
      ) : (
        <span className="text-ink-weak">Pas de station de mesure à proximité</span>
      )}
    </div>
  );
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

/** Altitude de la prévision affichée (village, D61) : celle du point MétéoSuisse retenu, à défaut celle du lieu. */
const conditionsAltitude = (resort, w) => w?.elevation ?? resort.elevation;

/**
 * Bandeau des 7 prochains jours (maquette « Meteo 7 jours », 7b, 05/11/2026) : une colonne par jour à partir
 * d'aujourd'hui (jour, picto, max, min, précipitations arrondies). Moins de 7 jours dans le fichier : seuls ceux qui
 * existent, la grille garde 7 colonnes. Conteneur : 3 lettres au-dessus de 400 px utiles ; les 7 colonnes tiennent
 * toujours dans la largeur (632 px : ≈ 250 px utiles, colonnes de ≈ 36 px), sans défilement.
 */
function SevenDays({ days }) {
  const today = todayKey(useNow());
  const shown = (days ?? []).filter((d) => d.date >= today).slice(0, 7);
  return (
    <section className="@container flex flex-none flex-col">
      <div className="flex items-baseline justify-between border-t border-panel-line pt-3 pb-2.5">
        <h4 className="m-0 text-[15px] font-bold">7 prochains jours</h4>
        <span className="text-[12px] text-ink-weak">max / min</span>
      </div>
      <ol className="m-0 grid list-none grid-cols-[repeat(7,minmax(0,1fr))] p-0">
        {shown.map((d) => {
          const isToday = d.date === today;
          const label = weekDayLabels(d.date, today);
          const mm = d.precip == null ? 0 : Math.round(d.precip);
          return (
            <li
              key={d.date}
              className={`flex flex-col items-center gap-2 rounded-[6px] py-2.5 ${isToday ? 'bg-panel-hover' : ''}`}
              title={`${label.full} : ${skyOf(d.sky).desc}`}
            >
              <span aria-label={label.full} className={`text-[12px] leading-none font-bold ${isToday ? 'text-ink-brand' : ''}`}>
                <span className="@min-[400px]:hidden">{label.initial}</span>
                <span className="hidden @min-[400px]:inline">{label.short}</span>
              </span>
              <WxIcon sky={d.sky} className="text-[17px]" />
              <span className="flex flex-col items-center gap-[3px] leading-none">
                {/* Étroit (632 px : colonnes de ≈ 36 px) : un cran plus petit, pour que « −12° » tienne. */}
                <span className="font-display text-[15px] font-bold @max-[280px]:text-[14px]">{fmtTemp(d.max)}</span>
                <span className="text-[13px] text-ink-weak @max-[280px]:text-[12px]">{fmtTemp(d.min)}</span>
              </span>
              <span className="h-[11px] text-[11px] leading-[11px] font-bold text-[var(--wx-drop)]">
                {mm > 0 && (
                  <>
                    {mm}
                    <span className="hidden @min-[400px]:inline">&nbsp;mm</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 mt-2 text-[12px] leading-[1.4] text-ink-weak">Météo, températures et précipitations</p>
    </section>
  );
}

/** Fiche complète (page droite du panneau, 964 / 632 px). */
export function ResortDetail({ resort, w }) {
  const now = skyOf(w?.sky);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-4 pt-[18px] pb-4">
      <h3 className="m-0 font-display text-[28px] leading-[1.1] font-bold text-balance">{resort.name}</h3>
      <div className="flex items-center gap-3">
        <WxIcon sky={w?.sky} className="text-[28px]" />
        <span className="font-display text-[40px] leading-none font-bold">{fmtTemp(w?.t)}</span>
        <span className="flex flex-col gap-0.5 text-[13px] leading-[1.35]">
          <strong>{now.desc}</strong>
          <span className="text-ink-weak">Vent {fmtWind(w?.wind)}</span>
          <span className="text-ink-weak">Au village, à {fmtAltitude(conditionsAltitude(resort, w))}</span>
        </span>
      </div>
      <SevenDays days={w?.days} />
      <SnowBlock snow={w?.snow} />
      <WebcamsLink url={resort.webcams} className="flex-wrap" />
    </div>
  );
}

/** Fiche compacte sous la carte (mobile, 168 px). */
export function ResortDock({ resort, w, onClose }) {
  const now = skyOf(w?.sky);
  const days = w?.days?.slice(0, 3) ?? EMPTY_DAYS;
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
          <WxIcon sky={w?.sky} className="text-[20px]" />
          <span className="font-display text-[28px] leading-none font-bold">{fmtTemp(w?.t)}</span>
          <span className="flex min-w-0 flex-col text-[11.5px] leading-[1.3]">
            <strong className="whitespace-nowrap">{now.desc}</strong>
            <span className="whitespace-nowrap text-ink-weak" title={w?.point ? `Prévision au village, point ${w.point.name}` : undefined}>
              Village, {fmtAltitude(conditionsAltitude(resort, w))}
            </span>
            <span
              className="whitespace-nowrap text-ink-weak"
              title={
                w?.snow ? `Neige au sol, dernière mesure de la station ${w.snow.station} (${fmtAltitude(w.snow.elevation)})` : undefined
              }
            >
              Neige {w?.snow ? `${fmtSnow(w.snow.hs)} à ${fmtAltitude(w.snow.elevation)}` : '–'}
            </span>
          </span>
        </div>
        <div className="flex flex-none gap-2.5">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-[3px]">
              <span className="text-[10px] font-bold tracking-[0.04em] text-ink-weak uppercase">{d ? dayLabel(d.date, i, true) : '–'}</span>
              <WxIcon sky={d?.sky} className="text-[13px]" />
              <span className="text-[11px] font-bold whitespace-nowrap">{d ? fmtTemp(d.max) : '–'}</span>
            </div>
          ))}
        </div>
      </div>
      <WebcamsLink url={resort.webcams} className="mt-auto" />
    </section>
  );
}
