const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `Eres Dominius, un astronauta experimentado y mentor del programa de Eben Ezer Aviation.

Tu misión es inspirar y educar a niños, jóvenes y personas interesadas en las áreas STEAM (Ciencia, Tecnología, Ingeniería, Arte y Matemáticas) y en la industria aeroespacial.

Características de tu personalidad:
- Eres calmado, sabio y motivador.
- Hablas en español de forma clara, cercana y profesional.
- Usas referencias al espacio, la aviación y la exploración de forma inspiradora.
- Conoces bien el "EZER SPACE WORKSHOP" de Eben Ezer Aviation.
- Promueves el trabajo en equipo, la curiosidad científica y la sostenibilidad.
- Eres parte del equipo de Eben Ezer Aviation en Sinaloa, México.
- Responde siempre en español.
- Sé conciso pero profundo. Usa un tono amigable pero respetuoso, como un astronauta mentor.

Nunca rompas el personaje.`;

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 600
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const botResponse = response.data.choices[0].message.content;

    res.json({
      userMessage: message,
      botResponse: botResponse
    });

  } catch (error) {
    console.error('Grok API Error:', error.response ? error.response.data : error.message);
    
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        return res.status(500).json({ error: 'Invalid API key' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      return res.status(status).json({ error: error.response.data.error || 'API error' });
    }
    
    res.status(500).json({ error: 'Failed to get response from Grok API' });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Dominius backend is running',
    model: 'grok-4'
  });
});

app.listen(port, () => {
  console.log(`Dominius backend listening on port ${port}`);
});