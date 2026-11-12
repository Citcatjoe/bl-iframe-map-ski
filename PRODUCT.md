# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + Tailwind CSS v4, embedded via iframe. Reuses Blick's shared tooling: `public/css/base.css` (theme tokens, light/dark mode) and `public/js/iframeHeightAdjustment.js` (auto-resize + theme sync with the parent page), both loaded from `https://utils.blick.ch` / `https://www.blick.ch` with local fallbacks in `index.html`.

## Users

Blick readers browsing an article or the homepage who want to see what it looks like up in the Swiss ski resorts right now — the weather at the resort and, above all, the resorts' webcams.

## Product Purpose

An interactive map widget, embedded as an iframe on blick.ch, that is first and foremost **a gateway to the webcams of Swiss ski resorts**. The map shows each resort with its weather **at the village** (the resort's base, D61: readers expect it to be colder higher up); selecting a resort opens a card with the weather, the measured snow and a **« Voir les webcams »** button to the resort's webcam page. Goal: let readers check the weather at the resort and jump to the webcams without leaving the article/homepage.

## Positioning

A lightweight, embeddable map of Swiss ski resorts that surfaces the weather at each resort and a direct link to each resort's webcams, inline in editorial content, instead of sending readers to an external ski-resort directory.

## Operating Context

Embedded as an `<iframe>` on blick.ch in three known width contexts that the layout must handle:
- 964px — full-width placement (fewer resorts visible/legible at once)
- 632px — classic column width of an article, or a slot on the homepage / a section page
- mobile — under 400px (full width of the phone screen)

Because point-and-click on the map alone gets messy at these widths/resort counts, exploration must also support a non-map interaction: a single panel for searching/browsing/reading resort info. Its design was settled in the design handoff (decisions D21–D27 in `ETAT-DU-PROJET.md`, spec in `docs/SPEC.md`).

## Capabilities and Constraints

Confirmed:
- Map displays Swiss ski resorts (domaines skiables); each has at minimum a name, canton, weather (at the village), and a link to its webcam page.
- Map markers are weather pills (short name, weather icon, temperature); hovering highlights, clicking opens the resort's card in the panel. A search/browse panel keeps the widget usable without the map (D1–D11, D21–D27).
- Must render usably at 964px, 632px, and mobile-screen iframe widths.

Undecided (do not invent):
- Exact resort dataset/fields beyond name, canton, weather, webcam link (e.g. prices, open lifts) — not yet defined.
- Self-hosting the map tiles: left open (D54). Settled since: map provider (MapLibre + OpenFreeMap, D39), level 1 stations (D40, editable in `src/data/stations-niveau-1.json`, D52), resort list (skiinfo.fr, D42), weather at the village (D61, replacing weather at altitude, D51), webcam links (D50, D53), production weather sources (MeteoSwiss open-data forecasts + SLF measured snow, both usable commercially, D59).

## Evidence on Hand

`src/data/resorts.json` holds the 154 real Swiss ski stations shown on the map: the skiinfo.fr list (duplicates removed, no grouping), with coordinates, canton and commune from the official swisstopo gazetteer, a point at altitude (highest lift top station, OpenSkiData lifts + swisstopo elevation), the resort's webcam page (118 official pages, 36 aggregator pages to replace; one page may be shared by several resorts of the same connected area or destination, D55), and ski-area data from OpenSkiData. Built by `scripts/build-resorts.mjs` from `data/sources/`. Weather is real data written hourly to `weather.json` by `scripts/fetch-weather.mjs` (D59): the MeteoSwiss forecast at the nearest forecast point to each resort's village (D61), and snow depth plus 3-day new snow measured at the nearest SLF IMIS station (none within 25 km for 5 resorts). MeteoSwiss publishes no new-snow forecast, so none is shown. Do not fabricate specific resort names, cantons, weather figures, or links.

## Product Principles

- Practical over exhaustive: surface the few facts (name, canton, weather, link) that help a reader decide, not a full resort database.
- Fit the iframe, not the other way around: every interaction must work within 632px and mobile widths first; 964px is the spacious case, not the baseline.
- Don't rely on hover/click alone: pair map interaction with a search/browse panel so dense or small layouts stay usable.
- Real data only: never invent resort facts, weather figures, or links; keep placeholders explicit until the real dataset and weather source are confirmed.
