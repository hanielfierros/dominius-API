# Dominius Backend

Backend para Dominius usando la API de Grok de xAI.

## Requisitos

- Node.js 18+
- Clave de API de xAI (obtén en https://console.x.ai/)

## Configuración local

1. Copia `.env.example` a `.env`
2. Edita `.env` y agrega tu `XAI_API_KEY`
3. `npm install`
4. `npm start`

El servidor corre en http://localhost:3000

## Endpoints

- `POST /chat` - Envía `{ "message": "tu pregunta" }` y recibe `{ "userMessage", "botResponse" }`
- `GET /` - Health check

## Despliegue en Render.com

1. Crea un nuevo Web Service en Render.
2. Conecta tu repositorio.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. En Environment Variables, agrega:
   - Key: `XAI_API_KEY`
   - Value: tu clave de xAI

Render detectará automáticamente el `package.json` y usará Node.

El servicio gratuito funciona perfectamente con este código simple.

## Notas

- El modelo usado es "grok-4"
- CORS está habilitado para cualquier origen (incluyendo GitHub Pages)
- Manejo de errores incluye rate limits y auth errors
- Timeout de 30 segundos en llamadas a la API

Mantén tu API key segura y no la subas a GitHub.