set -e
APP=/data/coolify/applications/tvxcsezs2ypd8tjuj6ic9gih
cd $APP
git fetch origin main
git reset --hard origin/main
COMMIT=$(git rev-parse HEAD)
echo "Deploying commit $COMMIT"

OLLAMA_WAS_RUNNING=0
if docker ps --format '{{.Names}}' | grep -qx 'veklom-ollama'; then
  OLLAMA_WAS_RUNNING=1
  docker stop veklom-ollama
fi
cleanup() {
  if [ "$OLLAMA_WAS_RUNNING" = "1" ]; then
    docker start veklom-ollama || true
  fi
}
trap cleanup EXIT

if grep -q '^SOURCE_COMMIT=' .env; then
  sed -i "s/^SOURCE_COMMIT=.*/SOURCE_COMMIT=$COMMIT/" .env
else
  printf '\nSOURCE_COMMIT=%s\n' "$COMMIT" >> .env
fi

docker builder prune -af --filter until=24h || true
docker build --progress=plain --build-arg NEXT_PUBLIC_API_BASE_URL= -t tvxcsezs2ypd8tjuj6ic9gih:latest .
cleanup
trap - EXIT

sed -i "s/image: .*/image: 'tvxcsezs2ypd8tjuj6ic9gih:latest'/" docker-compose.yaml

python3 -c 'import re; from pathlib import Path; p=Path("docker-compose.yaml"); s=p.read_text(); t=chr(96); control=f"Host({t}control.veklom.com{t}) && PathPrefix({t}/{t})"; expanded=f"(Host({t}control.veklom.com{t}) || Host({t}veklom.dev{t}) || Host({t}www.veklom.dev{t})) && PathPrefix({t}/{t})"; s=s.replace(control, expanded); s=re.sub(r"caddy_0=https://control\.veklom\.com(?:, https://veklom\.dev, https://www\.veklom\.dev)*", "caddy_0=https://control.veklom.com, https://veklom.dev, https://www.veklom.dev", s); p.write_text(s)'

docker ps -aq --filter 'name=tvxcsezs2ypd8tjuj6ic9gih' | xargs -r docker rm -f
docker compose -f docker-compose.yaml up -d --force-recreate
echo "Frontend deployment complete"
