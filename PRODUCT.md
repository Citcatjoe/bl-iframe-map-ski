# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + Tailwind CSS v4, embedded via iframe. Reuses Blick's shared tooling: `public/css/base.css` (theme tokens, light/dark mode) and `public/js/iframeHeightAdjustment.js` (auto-resize + theme sync with the parent page), both loaded from `https://utils.blick.ch` / `https://www.blick.ch` with local fallbacks in `index.html`.

## Users

Blick readers browsing an article or the homepage who want quick, practical information about Swiss ski resorts (domaines skiables) — e.g. deciding where to ski based on weather and location.

## Product Purpose

An interactive map widget, embedded as an iframe on blick.ch, showing Swiss ski resorts. Hovering (or otherwise selecting) a resort surfaces its name, canton, a brief weather snippet, and a link to the resort's own utility site. Goal: let readers scan and compare ski domains without leaving the article/homepage.

## Positioning

A lightweight, embeddable reference map for Swiss ski domains that surfaces practical info (location, weather, official link) directly inline in editorial content, instead of sending readers to an external ski-resort directory.

## Operating Context

Embedded as an `<iframe>` on blick.ch in three known width contexts that the layout must handle:
- 964px — full-width placement (fewer resorts visible/legible at once)
- 632px — standard placement (home and/or article)
- mobile — full width of the device screen

Because point-and-click on the map alone gets messy at these widths/resort counts, exploration must also support a non-map interaction: a sliding panel ("drawer") for searching/browsing/reading resort info. Exact panel design is not yet finalized.

## Capabilities and Constraints

Confirmed:
- Map displays Swiss ski resorts (domaines skiables); each has at minimum a name, canton, weather snippet, and link to its official/utility site.
- Tooltip-on-hover shows that info (desktop); an additional sliding panel is needed for search/browse so the widget isn't click-only.
- Must render usably at 964px, 632px, and mobile-screen iframe widths.

Undecided (do not invent):
- Exact resort dataset/fields beyond name, canton, weather, link (e.g. altitude, prices, trail info) — not yet defined.
- Weather data source: intended to be open data or a public API, pending confirmation from the user's editorial lead ("chefferie"). May be dissociated from the static resort data if needed.
- Exact sliding-panel/drawer UX (what it contains, how it's triggered) — "to be defined more precisely."

## Evidence on Hand

No ski resort dataset exists yet in the project (no JSON file, no real resort list, no weather integration). Do not fabricate specific resort names, cantons, weather figures, or links — treat the eventual static list as intended to live in a local JSON file (similar in spirit to `data_police.json` in the sibling `bl-tool-timeline-r` project), populated with real data once confirmed.

## Product Principles

- Practical over exhaustive: surface the few facts (name, canton, weather, link) that help a reader decide, not a full resort database.
- Fit the iframe, not the other way around: every interaction must work within 632px and mobile widths first; 964px is the spacious case, not the baseline.
- Don't rely on hover/click alone: pair map interaction with a search/browse panel so dense or small layouts stay usable.
- Real data only: never invent resort facts, weather figures, or links; keep placeholders explicit until the real dataset and weather source are confirmed.
