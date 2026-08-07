set -e
cd /data/coolify/applications/tvxcsezs2ypd8tjuj6ic9gih
git pull origin main
docker build --progress=plain --build-arg NEXT_PUBLIC_API_BASE_URL= -t tvxcsezs2ypd8tjuj6ic9gih:latest .
sed -i "s|image: .*|image: 'tvxcsezs2ypd8tjuj6ic9gih:latest'|" docker-compose.yaml
docker compose -f docker-compose.yaml up -d --force-recreate
