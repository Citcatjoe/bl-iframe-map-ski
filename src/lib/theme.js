import { useEffect, useState } from 'react';

// Thème clair / sombre Blick, comme bl-iframe-traffic : entièrement géré par iframeHeightAdjustment.js. Le script lit
// #theme=dark|light dans l'URL posée par le CMS, pose la paire --is-light-theme / --is-dark-theme dont base.css dérive
// chaque couleur sémantique, et suit les changements de thème de la page parente (CHANGE_THEME). L'interface suit donc
// seule via les variables CSS ; ce hook ne sert qu'à la carte (fond, relief, pastilles canvas), que le moteur dessine
// sans lire var().

const hashTheme = () => (new URLSearchParams(window.location.hash.slice(1)).get('theme') === 'dark' ? 'dark' : 'light');

const currentTheme = () => (window.blickIframeUtils?.currentTheme === 'dark' ? 'dark' : window.blickIframeUtils ? 'light' : hashTheme());

const CALLBACK_ID = 'bl-iframe-map-ski';

/** Thème courant (« light » | « dark »), tenu à jour par iframeHeightAdjustment.js. */
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    let utils = null;
    const register = () => {
      utils = window.blickIframeUtils;
      if (!utils?.registerThemeChangeCallback) return false;
      utils.registerThemeChangeCallback(CALLBACK_ID, (t) => setTheme(t === 'dark' ? 'dark' : 'light'));
      setTheme(currentTheme());
      return true;
    };
    // Le script est chargé après le bundle (et en repli local si le CDN échoue) : on attend `load`.
    const onLoad = () => register();
    if (!register()) window.addEventListener('load', onLoad, { once: true });
    return () => {
      window.removeEventListener('load', onLoad);
      utils?.deregisterThemeChangeCallback?.(CALLBACK_ID);
    };
  }, []);

  return theme;
}
