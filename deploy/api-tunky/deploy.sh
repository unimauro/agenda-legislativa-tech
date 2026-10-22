#!/bin/bash
# Despliega el módulo de participación (agenda.js) en api.tunky.net (VPS /opt/api-tunky).
# Respaldo de server.js, chequeo de sintaxis ANTES de reconstruir, y prueba de salud al final.
# Uso (desde la raíz del repo):  bash deploy/api-tunky/deploy.sh
set -euo pipefail
VPS=root@217.15.168.100
DIR="$(cd "$(dirname "$0")" && pwd)"
scp -q "$DIR/agenda.js" "$DIR/patch.py" "$VPS:/tmp/"
ssh "$VPS" 'set -e; cd /opt/api-tunky
  cp src/server.js "src/server.js.bak.agenda.$(date +%s)"
  cp /tmp/agenda.js src/agenda.js
  python3 /tmp/patch.py
  docker run --rm -v /opt/api-tunky/src:/s:ro node:20-alpine sh -c "node -c /s/server.js && node -c /s/agenda.js"
  docker compose up -d --build api-tunky
  sleep 6; docker logs --tail 6 api-tunky'
echo "--- pruebas ---"
curl -s https://api.tunky.net/health; echo
curl -s -H "Origin: https://unimauro.github.io" https://api.tunky.net/agenda/resumen; echo
