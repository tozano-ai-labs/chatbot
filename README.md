# chatbot v0.1

Interface graphique (Vue 3) branchée sur l'IA locale `ai-service` (Ollama), entièrement dockerisée.

## Prérequis

Le service `ai-service` doit tourner (réseau Docker `ai-service-net`) :

```bash
cd ../ai-service && docker compose up -d
```

## Déploiement

```bash
cp .env.example .env   # puis ajuster si besoin
docker compose up -d --build
```

L'interface est disponible sur <http://localhost:3000>.

## Configuration (`.env`)

| Variable      | Défaut                 | Description                                  |
| ------------- | ---------------------- | -------------------------------------------- |
| `VERSION`     | `0.1`                  | Version affichée dans l'interface            |
| `OLLAMA_HOST` | `http://ollama:11434`  | Adresse d'Ollama (interne au réseau Docker)  |
| `PORT`        | `3000`                 | Port exposé sur l'hôte                       |

Pour changer de modèle : en sélectionner un autre dans la liste déroulante de l'interface (les modèles disponibles sont ceux installés dans `ai-service`).

## Architecture

```
navigateur → chatbot:3000 (Express: front statique + proxy /api/*)
                     └→ http://ollama:11434 (réseau ai-service-net)
```

- `GET /api/version` — version courante
- `GET /api/models` — modèles installés sur Ollama
- `POST /api/chat` — proxy streamé (NDJSON) vers `/api/chat` d'Ollama

Le proxy backend évite les problèmes CORS : le front appelle uniquement `/api/*` sur la même origine.

## Développement local (sans Docker)

```bash
# terminal 1 — backend (préciser l'adresse d'Ollama sur l'hôte)
cd server && OLLAMA_HOST=http://localhost:11434 npm install && npm run dev

# terminal 2 — frontend (proxy /api → localhost:3000)
cd client && npm install && npm run dev
```

L'interface de dev est servie par Vite sur <http://localhost:5173>.

## Fonctionnalités v0.1

- Chat avec streaming des réponses token par token
- Sélection du modèle
- Historique en mémoire de session (rechargement = remise à zéro)
- Badge de version dans l'en-tête
