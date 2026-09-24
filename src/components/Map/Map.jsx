import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Token Mapbox : fourni via l'environnement (voir .env.example), jamais commité en clair.
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

if (import.meta.env.DEV && !mapboxgl.accessToken) {
  console.warn('VITE_MAPBOX_TOKEN est manquant — copiez .env.example vers .env et renseignez un token Mapbox.');
}

const SWITZERLAND_BOUNDS = [5.96, 45.82, 10.49, 47.81];

const resolveCssColor = (varName, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
};

const toFeatureCollection = (resorts) => ({
  type: 'FeatureCollection',
  features: resorts.map((resort) => ({
    type: 'Feature',
    id: resort.id,
    geometry: { type: 'Point', coordinates: resort.coordinates },
    properties: { id: resort.id, name: resort.name, canton: resort.canton },
  })),
});

const Map = ({ resorts, selectedId, filteredIds, onSelectResort }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const hoveredIdRef = useRef(null);
  const popupRef = useRef(null);

  const updateMapColors = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const bgColor = resolveCssColor('--color-fill-weak', '#f5f5f5');
    const landColor = resolveCssColor('--color-fill-default', '#ffffff');
    const borderColor = resolveCssColor('--color-stroke-weak', '#c8c6c6');
    const pinColor = resolveCssColor('--color-fill-brand', '#e20000');

    if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', bgColor);
    if (map.getLayer('switzerland-fill')) map.setPaintProperty('switzerland-fill', 'fill-color', landColor);
    if (map.getLayer('switzerland-border')) map.setPaintProperty('switzerland-border', 'line-color', borderColor);
    if (map.getLayer('cantons-borders')) map.setPaintProperty('cantons-borders', 'line-color', borderColor);
    if (map.getLayer('resorts-points')) {
      map.setPaintProperty('resorts-points', 'circle-color', pinColor);
      map.setPaintProperty('resorts-points', 'circle-stroke-color', bgColor);
    }
  };

  // Initialisation (une seule fois)
  useEffect(() => {
    if (mapRef.current) return;

    const bgColor = resolveCssColor('--color-fill-weak', '#f5f5f5');

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': bgColor } },
        ],
      },
      center: [8.2275, 46.8182],
      zoom: 6.8,
      attributionControl: false,
    });
    mapRef.current = map;
    if (import.meta.env.DEV) window.__map = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, showZoom: true }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    class ResetControl {
      onAdd(mapInstance) {
        this._map = mapInstance;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        const button = document.createElement('button');
        button.type = 'button';
        button.title = 'Recentrer sur la Suisse';
        button.setAttribute('aria-label', 'Recentrer sur la Suisse');
        button.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" style="margin:auto"><path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke-linecap="round"/><circle cx="10" cy="10" r="4.5"/></svg>';
        button.addEventListener('click', () => {
          mapInstance.fitBounds(SWITZERLAND_BOUNDS, { padding: 24, duration: 800 });
        });

        this._container.appendChild(button);
        return this._container;
      }
      onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
      }
    }
    map.addControl(new ResetControl(), 'top-right');

    map.on('load', () => {
      Promise.all([
        fetch('/switzerland-country.json').then((r) => r.json()),
        fetch('/switzerland-cantons.json').then((r) => r.json()),
      ]).then(([countryData, cantonData]) => {
        const landColor = resolveCssColor('--color-fill-default', '#ffffff');
        const borderColor = resolveCssColor('--color-stroke-weak', '#c8c6c6');

        map.addSource('switzerland-hd', { type: 'geojson', data: countryData });
        map.addLayer({
          id: 'switzerland-fill',
          type: 'fill',
          source: 'switzerland-hd',
          paint: { 'fill-color': landColor, 'fill-opacity': 1 },
        });
        map.addLayer({
          id: 'switzerland-border',
          type: 'line',
          source: 'switzerland-hd',
          paint: { 'line-color': borderColor, 'line-width': 1 },
        });

        map.addSource('swiss-cantons', { type: 'geojson', data: cantonData });
        map.addLayer({
          id: 'cantons-borders',
          type: 'line',
          source: 'swiss-cantons',
          paint: { 'line-color': borderColor, 'line-width': 1, 'line-opacity': 0.7 },
        });

        // promoteId: Mapbox n'active le feature-state sur un id textuel que si on lui
        // indique explicitement quelle propriété promouvoir (un id GeoJSON top-level
        // en string est silencieusement ignoré autrement).
        map.addSource('resorts', { type: 'geojson', data: toFeatureCollection(resorts), promoteId: 'id' });

        const pinColor = resolveCssColor('--color-fill-brand', '#e20000');
        map.addLayer({
          id: 'resorts-points',
          type: 'circle',
          source: 'resorts',
          paint: {
            'circle-color': pinColor,
            'circle-stroke-color': bgColor,
            'circle-stroke-width': 2,
            'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 11, 7],
            'circle-opacity': ['case', ['boolean', ['feature-state', 'muted'], false], 0.25, 1],
            'circle-stroke-opacity': ['case', ['boolean', ['feature-state', 'muted'], false], 0.25, 1],
          },
          transition: { 'circle-radius': { duration: 200 }, 'circle-opacity': { duration: 200 } },
        });

        map.fitBounds(SWITZERLAND_BOUNDS, { padding: 24, duration: 0 });

        map.on('mousemove', 'resorts-points', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features?.[0];
          if (!feature) return;

          if (hoveredIdRef.current !== feature.id) {
            hoveredIdRef.current = feature.id;
            popupRef.current?.remove();
            popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 14 })
              .setLngLat(feature.geometry.coordinates)
              .setHTML(
                `<strong>${feature.properties.name}</strong><br/><span>${feature.properties.canton}</span><br/><em>Météo — bientôt disponible</em>`
              )
              .addTo(map);
          }
        });

        map.on('mouseleave', 'resorts-points', () => {
          map.getCanvas().style.cursor = '';
          hoveredIdRef.current = null;
          popupRef.current?.remove();
          popupRef.current = null;
        });

        map.on('click', 'resorts-points', (e) => {
          const feature = e.features?.[0];
          if (feature) onSelectResort(feature.properties.id);
        });

        updateMapColors();
      });
    });

    const onThemeMessage = (event) => {
      if (event.data && event.data.blick_event_type === 'CHANGE_THEME') {
        // Laisse le style de base recalculer les variables CSS avant de relire les couleurs
        requestAnimationFrame(updateMapColors);
      }
    };
    window.addEventListener('message', onThemeMessage);

    return () => {
      window.removeEventListener('message', onThemeMessage);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Etat "muted" (filtré) par résultat de recherche
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('resorts')) return;

    resorts.forEach((resort) => {
      map.setFeatureState({ source: 'resorts', id: resort.id }, { muted: !filteredIds.has(resort.id) });
    });
  }, [resorts, filteredIds]);

  // Sélection active + fly-to
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('resorts')) return;

    resorts.forEach((resort) => {
      map.setFeatureState({ source: 'resorts', id: resort.id }, { selected: resort.id === selectedId });
    });

    const selected = resorts.find((resort) => resort.id === selectedId);
    if (selected) {
      map.flyTo({ center: selected.coordinates, zoom: Math.max(map.getZoom(), 9.5), duration: 700 });
    }
  }, [resorts, selectedId]);

  return <div ref={containerRef} className="h-full w-full" role="img" aria-label="Carte des domaines skiables de Suisse" />;
};

export default Map;
