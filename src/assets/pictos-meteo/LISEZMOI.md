# Pictos météo — essai d'intégration

11 pictos, viewBox 24×24, uniquement des surfaces pleines (aucun stroke), nommés par clé de famille.

## Dossiers
- `mono/` — **un seul tracé**, `fill="currentColor"`, `fill-rule="evenodd"`. À utiliser sur la pastille sélectionnée (blanc sur #E20000) ou partout où le widget impose la couleur.
- `couleur/` — un tracé par rôle (soleil, lune, nuage, nuage chargé, pluie, neige, éclair), pour fond clair.
- `sombre/` — même chose, palette éclaircie pour le mode sombre.
- `meteo-icons.js` — les mêmes données en JS : `MeteoIcons.toSVG(name, 'mono'|'color'|'dark', size)` et `MeteoIcons.drawIcon(ctx, name, x, y, size, colors)` pour le canvas (pill.js). Avec `colors = null`, l'icône est peinte dans le `fillStyle` courant ; sinon passer `MeteoIcons.PALETTES.color` ou `.dark`.

## Familles
| Clé | Libellé | Numéros MétéoSuisse |
|---|---|---|
| `sun` | Ensoleillé | 1 |
| `partly` | En partie ensoleillé | 2, 3, 26 |
| `clear-night` | Ciel dégagé (nuit) | 101 |
| `partly-night` | Peu nuageux (nuit) | 102, 103, 126 |
| `cloud` | Couvert | 4, 5, 35 |
| `fog` | Brouillard | 27, 28 |
| `rain` | Pluie · averses | 6, 9, 29, 32, 33 (averses) · 14, 17, 20 |
| `sleet` | Pluie et neige | 7, 10, 15, 18, 21, 31 |
| `snow` | Chutes de neige | 8, 11, 16, 19, 22, 30, 34 |
| `storm` | Orage | 12, 13, 23–25, 36–42 |
| `none` | Pas de données | — |

**Averses** (6, 9, 29, 32, 33 et +100) utilisent `rain`. Il n'y a pas de fichier `showers` : prévois un alias `showers → rain`.

## Palettes
| Rôle | Couleur | Sombre |
|---|---|---|
| sun | #FFAA00 | #FFC233 |
| moon | #5D6FA3 | #C7D0E6 |
| cloud | #8F8989 | #C8C6C6 |
| cloudDark | #504949 | #A5A1A1 |
| drop | #1F74E8 | #5BA0FF |
| snow | #9ED8F5 | #D2EEFB |
| bolt | #FFAA00 | #FFC233 |
| none | #A5A1A1 | #837C7C |

## Taille
Référence : 11,5 px (pastilles de la carte). Ces pictos remplissent leur carré de 24, alors que `fa-cloud-sun` déborde d'environ 25 % en largeur. Pour un encombrement équivalent à l'actuel, affiche-les à **≈ 14 px** dans les pastilles.
