#!/usr/bin/env bash
# Met en ligne le relevé météo de bl-iframe-map-ski sur le VPS pegasus depuis ce Mac (voir docs/VPS.md).
# Le widget n'y est pas : il est compilé (npm run build, adresse de weather.json dans .env.production) et publié
# sur le FTP de l'entreprise.
#
#   deploy/deploy.sh [hôte-ssh]     défaut : vps (alias de ~/.ssh/config)
#
# Envoie par SSH le script de relevé et la liste des stations, installe le service et le timer systemd, lance un
# relevé (échec = arrêt du déploiement), puis installe le site Caddy (retiré si la configuration est refusée).
# Aucune dépendance npm, aucun secret. Sur le serveur, data/ (weather.json) n'est jamais effacé.
# Idempotent : relançable à volonté, notamment après `npm run resorts` (la liste des stations du serveur doit
# rester celle du widget publié).
set -euo pipefail
cd "$(dirname "$0")/.."
hote=${1:-vps}
dest=/srv/bl-iframe-map-ski
paquet=/tmp/bl-iframe-map-ski.tgz

# COPYFILE_DISABLE / --no-xattrs : pas de fichiers ._* ni d'attributs macOS dans l'archive.
COPYFILE_DISABLE=1 tar -czf - --no-xattrs scripts/fetch-weather.mjs src/data/resorts.json deploy |
  ssh "$hote" "cat > $paquet"

ssh "$hote" sudo bash -s -- "$dest" "$paquet" <<'EOF'
set -euo pipefail
dest=$1
paquet=$2
arrivee=$(mktemp -d)
trap 'rm -rf "$arrivee" "$paquet"' EXIT
tar -xzf "$paquet" -C "$arrivee" --no-same-owner

id skimap &>/dev/null || useradd --system --home "$dest" --shell /usr/sbin/nologin skimap
install -d -o root -g root -m 755 "$dest" "$dest/scripts" "$dest/src" "$dest/src/data"
install -d -o skimap -g skimap -m 755 "$dest/data"
install -o root -g root -m 644 "$arrivee/scripts/fetch-weather.mjs" "$dest/scripts/"
install -o root -g root -m 644 "$arrivee/src/data/resorts.json" "$dest/src/data/"

install -m 644 "$arrivee/deploy/bl-iframe-map-ski.service" "$arrivee/deploy/bl-iframe-map-ski.timer" /etc/systemd/system/
systemctl daemon-reload
# Relevé immédiat avec le code reçu (oneshot : attend la fin, code de sortie du script). Source en panne : on
# continue si un weather.json est déjà servi (systemd relance le relevé toutes les 10 min) ; sinon, arrêt.
# reset-failed d'abord : chaque déploiement compte comme un départ, et 5 départs en 55 min (StartLimitBurst) bloquent
# l'unité en « start-limit-hit », vue en échec par pegasus-monitor (arrivé le 03/11/2026 après plusieurs déploiements).
systemctl reset-failed bl-iframe-map-ski.service 2>/dev/null || true
if ! systemctl start bl-iframe-map-ski.service; then
  [[ -s $dest/data/weather.json ]] || { echo "Premier relevé en échec et aucun weather.json : arrêt" >&2; exit 1; }
  echo "Relevé en échec (source indisponible ?) : l'ancien weather.json reste servi, nouvel essai dans 10 min" >&2
  journalctl -u bl-iframe-map-ski -n 6 --no-pager -o cat >&2
fi
systemctl enable --now --quiet bl-iframe-map-ski.timer

# Le Caddyfile principal (dépôt pegasus) importe /etc/caddy/sites/*.caddy. Un site refusé est retiré (ou l'ancienne
# version remise), sinon il bloquerait le prochain rechargement de Caddy par n'importe quel projet.
site=/etc/caddy/sites/bl-iframe-map-ski.caddy
ancien=$(mktemp)
if [[ -f $site ]]; then cp "$site" "$ancien"; else : > "$ancien"; fi
install -D -m 644 "$arrivee/deploy/bl-iframe-map-ski.caddy" "$site"
# Sous l'utilisateur caddy : la validation ouvre les journaux ; en root, elle les créerait en root (illisibles par Caddy).
if ! sortie=$(sudo -u caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1); then
  if [[ -s $ancien ]]; then install -m 644 "$ancien" "$site"; else rm -f "$site"; fi
  rm -f "$ancien"
  echo "$sortie" | grep -iE 'error|Error' >&2 || echo "$sortie" >&2
  echo "Configuration Caddy refusée : site non modifié" >&2
  exit 1
fi
rm -f "$ancien"
systemctl reload caddy

ls -l "$dest/data/weather.json"
systemctl list-timers bl-iframe-map-ski.timer --no-pager
EOF
