# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + Tailwind CSS v4, embedded via iframe. Reuses Blick's shared tooling: `public/css/base.css` (theme tokens, light/dark mode) and `public/js/iframeHeightAdjustment.js` (auto-resize + theme sync with the parent page), both loaded from `https://utils.blick.ch` / `https://www.blick.ch` with local fallbacks in `index.html`.

## Users

Blick readers browsing an article or the homepage who want to see what it looks like up in the Swiss ski resorts right now — the conditions at altitude and, above all, the resorts' webcams.

## Product Purpose

An interactive map widget, embedded as an iframe on blick.ch, that is first and foremost **a gateway to the webcams of Swiss ski resorts**. The map shows each resort with its weather **at altitude** (top of the lifts, not the village); selecting a resort opens a card with the conditions up there and a **« Voir les webcams »** button to the resort's webcam page. Goal: let readers check the conditions up the mountain and jump to the webcams without leaving the article/homepage.

## Positioning

A lightweight, embeddable map of Swiss ski resorts that surfaces conditions at altitude and a direct link to each resort's webcams, inline in editorial content, instead of sending readers to an external ski-resort directory.

## Operating Context

Embedded as an `<iframe>` on blick.ch in three known width contexts that the layout must handle:
- 964px — full-width placement (fewer resorts visible/legible at once)
- 632px — classic column width of an article, or a slot on the homepage / a section page
- mobile — under 400px (full width of the phone screen)

Because point-and-click on the map alone gets messy at these widths/resort counts, exploration must also support a non-map interaction: a single panel for searching/browsing/reading resort info. Its design was settled in the design handoff (decisions D21–D27 in `ETAT-DU-PROJET.md`, spec in `docs/SPEC.md`).

## Capabilities and Constraints

Confirmed:
- Map displays Swiss ski resorts (domaines skiables); each has at minimum a name, canton, weather at altitude, and a link to its webcam page.
- Map markers are weather pills (short name, weather icon, temperature); hovering highlights, clicking opens the resort's card in the panel. A search/browse panel keeps the widget usable without the map (D1–D11, D21–D27).
- Must render usably at 964px, 632px, and mobile-screen iframe widths.

Undecided (do not invent):
- Exact resort dataset/fields beyond name, canton, weather, webcam link (e.g. prices, open lifts) — not yet defined.
- Weather data source for production: there is no budget for now; remaining free candidates in `ETAT-DU-PROJET.md` § 4.7 (self-hosted Open-Meteo, which is allowed for commercial use — D56 —, MeteoSwiss open data, SLF measured snow as a complement). Open-Meteo's public API (free for non-commercial use only) runs in development meanwhile.
- Self-hosting the map tiles: left open (D54). Settled since: map provider (MapLibre + OpenFreeMap, D39), level 1 stations (D40, editable in `src/data/stations-niveau-1.json`, D52), resort list (skiinfo.fr, D42), weather at altitude (D51), webcam links (D50, D53).

## Evidence on Hand

`src/data/resorts.json` holds the 154 real Swiss ski stations shown on the map: the skiinfo.fr list (duplicates removed, no grouping), with coordinates, canton and commune from the official swisstopo gazetteer, a point at altitude (highest lift top station, OpenSkiData lifts + swisstopo elevation), the resort's webcam page (118 official pages, 36 aggregator pages to replace; one page may be shared by several resorts of the same connected area or destination, D55), and ski-area data from OpenSkiData. Built by `scripts/build-resorts.mjs` from `data/sources/`. Weather is real Open-Meteo data at altitude written to `weather.json` by `scripts/fetch-weather.mjs`, pending the production source decision. Do not fabricate specific resort names, cantons, weather figures, or links.

## Product Principles

- Practical over exhaustive: surface the few facts (name, canton, weather, link) that help a reader decide, not a full resort database.
- Fit the iframe, not the other way around: every interaction must work within 632px and mobile widths first; 964px is the spacious case, not the baseline.
- Don't rely on hover/click alone: pair map interaction with a search/browse panel so dense or small layouts stay usable.
- Real data only: never invent resort facts, weather figures, or links; keep placeholders explicit until the real dataset and weather source are confirmed.
