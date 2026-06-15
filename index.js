/**
 * Dominius - Astronauta Virtual
 * Backend en Node.js + Express con Grok API (xAI)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE GROK API (xAI)
// ============================================
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';
const GROK_MODEL = 'grok-4-mini';   // Modelo más rápido y económico

if (!XAI_API_KEY) {
  console.error('❌ ERROR: XAI_API_KEY no está definida en las variables de entorno.');
  console.error('Agrega la variable XAI_API_KEY en Render.');
  process.exit(1);
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ============================================
// SYSTEM PROMPT - Personalidad de Dominius
// ============================================
const SYSTEM_PROMPT = `Eres Dominius, un astronauta experimentado y mentor del programa de Eben Ezer Aviation.
Tu misión es inspirar y educar a niños, jóvenes y personas interesadas en las áreas STEAM y en la industria aeroespacial.
Habla siempre en español, sé motivador, sabio y cercano.`;

// ============================================
// ENDPOINT PRINCIPAL
// ============================================
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "message" es requerido.' });
    }

    console.log(`📨 Mensaje recibido: "${message.substring(0, 80)}..."`);

    const response = await axios.post(
      `${XAI_BASE_URL}/chat/completions`,
      {
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.75,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const botResponse = response.data.choices[0]?.message?.content?.trim();

    res.json({
      userMessage: message,
      botResponse: botResponse || "Lo siento, no pude generar una respuesta en este momento."
    });

  } catch (error) {
    console.error('❌ Error en /chat:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Error de autenticación con Grok API. Verifica tu XAI_API_KEY.' });
    }
    
    res.status(500).json({
      error: 'Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo.',
      details: error.message
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dominius Backend - Grok API',
    model: GROK_MODEL
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    model: GROK_MODEL,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('\n🚀 Dominius Backend iniciado correctamente');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🧠 Modelo: ${GROK_MODEL}`);
  console.log('✅ Listo para recibir mensajes\n');
});
