# Dominius Backend - Astronauta Virtual

Backend en **Node.js + Express** para el chat interactivo de **Dominius**, el astronauta virtual de **Eben Ezer Aviation**.

Este servidor se conecta a la **DeepSeek API** para generar respuestas inteligentes y en personaje.

## Características

- Endpoint `POST /chat`
- Integración completa con DeepSeek (`deepseek-chat`)
- System prompt optimizado para el personaje de Dominius (astronauta mentor de Eben Ezer Aviation)
- Soporte para voz (el frontend usa SpeechRecognition/Synthesis)
- CORS habilitado para GitHub Pages
- Manejo profesional de errores
- Listo para despliegue gratuito en **Render.com**

## Estructura del proyecto

```
dominius-backend/
├── index.js              # Servidor Express principal
├── package.json
├── .env.example
└── README.md
```

## Configuración local

1. **Clona o descarga** esta carpeta.

2. **Instala dependencias**:
   ```bash
   cd dominus-backend
   npm install
   ```

3. **Configura las variables de entorno**:
   ```bash
   cp .env.example .env
   ```

4. Edita el archivo `.env` y agrega tu clave de DeepSeek:
   ```env
   DEEPSEEK_API_KEY=sk-tu_clave_real_aqui
   PORT=3000
   ```

5. **Inicia el servidor**:
   ```bash
   npm start
   ```

El servidor estará disponible en `http://localhost:3000`

### Probar el endpoint

Usa curl o Postman:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Qué es el EZER SPACE WORKSHOP?"}'
```

## Despliegue en Render.com (Recomendado)

Render ofrece un plan gratuito ideal para este backend.

### Pasos para desplegar:

1. **Crea una cuenta** en [Render.com](https://render.com) (si no tienes).

2. **Crea un nuevo Web Service**:
   - Ve a Dashboard → **New +** → **Web Service**
   - Conecta tu repositorio de GitHub (recomendado) o usa "Public Git repository"

3. **Configuración del servicio**:

   | Campo                  | Valor recomendado                     |
   |------------------------|---------------------------------------|
   | **Name**               | `dominius-backend`                    |
   | **Environment**        | `Node`                                |
   | **Build Command**      | `npm install`                         |
   | **Start Command**      | `npm start`                           |
   | **Plan**               | Free (suficiente)                     |

4. **Variables de entorno** (importante):
   - Ve a la sección **Environment** del servicio
   - Agrega la siguiente variable:
     - **Key**: `DEEPSEEK_API_KEY`
     - **Value**: `sk-tu_clave_real_de_deepseek`

5. **Despliega**:
   - Haz clic en **Create Web Service**
   - Espera que Render construya e inicie el servicio.

6. **Obtén la URL**:
   - Una vez desplegado, Render te dará una URL como:
     `https://dominius-backend.onrender.com`

## Conectar el Frontend (Dominius)

En el frontend (el archivo `index.html` de Dominius), reemplaza la lógica simulada por una llamada real a este backend.

Ejemplo de integración (en `app.js` del frontend):

```js
async function sendToDominius(message) {
  const response = await fetch('https://TU-URL-DE-RENDER.onrender.com/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await response.json();
  return data.botResponse;
}
```

> **Nota**: Cambia `https://TU-URL-DE-RENDER.onrender.com` por la URL real que te dé Render.

## Notas importantes

- La API Key de DeepSeek **nunca** debe estar en el código frontend.
- Render reinicia los servicios gratuitos después de inactividad (puede tardar ~30-60 segundos la primera petición).
- DeepSeek tiene límites de uso según tu plan (verifica en su dashboard).
- El modelo por defecto es `deepseek-chat`. Puedes cambiarlo a `deepseek-reasoner` si quieres respuestas más profundas (edita la constante en `index.js`).

## Variables de entorno

| Variable            | Descripción                          | Requerida |
|---------------------|--------------------------------------|---------|
| `DEEPSEEK_API_KEY`  | Clave de la API de DeepSeek          | Sí      |
| `PORT`              | Puerto del servidor (Render lo asigna) | No    |

## Soporte

Este backend fue creado específicamente para el módulo **Dominius - Astronauta Virtual** de **Eben Ezer Aviation**.

Para obtener tu clave de DeepSeek:
→ [https://platform.deepseek.com/](https://platform.deepseek.com/)

---

**Listo para producción en Render.** 🚀