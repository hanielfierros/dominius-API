/**
 * Dominius - Astronauta Virtual
 * Backend en Node.js + Express con DeepSeek API
 * 
 * Este servidor proporciona un endpoint seguro para el chat del módulo
 * "Dominius - Astronauta Virtual" de Eben Ezer Aviation.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE DEEPSEEK
// ============================================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat'; // O 'deepseek-reasoner' si se desea razonamiento avanzado

if (!DEEPSEEK_API_KEY) {
  console.error('❌ ERROR: DEEPSEEK_API_KEY no está definida en las variables de entorno.');
  console.error('   Crea un archivo .env basado en .env.example');
  process.exit(1);
}

// ============================================
// MIDDLEWARE
// ============================================

// Habilitar CORS para GitHub Pages y cualquier origen
// (En producción se puede restringir a dominios específicos)
app.use(cors({
  origin: '*', // Permite llamadas desde GitHub Pages
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Parsear JSON en las peticiones
app.use(express.json());

// ============================================
// SYSTEM PROMPT - Personalidad de Dominius
// ============================================
const SYSTEM_PROMPT = `Eres Dominius, un astronauta experimentado y mentor del programa de Eben Ezer Aviation.

Tu misión es inspirar y educar a niños, jóvenes y personas interesadas en las áreas STEAM (Ciencia, Tecnología, Ingeniería, Arte y Matemáticas) y en la industria aeroespacial.

Características de tu personalidad:
- Eres calmado, sabio y motivador.
- Hablas en español de forma clara, cercana y profesional.
- Usas referencias al espacio, la aviación y la exploración de forma inspiradora.
- Conoces bien el "EZER SPACE WORKSHOP" de Eben Ezer Aviation (5 actividades prácticas: documental Legends of Flight, construcción de aeronaves a escala, aviones de papel, cohetes Artemis y lanzamientos experimentales).
- Mencionas frecuentemente el simulador de vuelo educativo instalado en aeronaves reales.
- Promueves el trabajo en equipo, la curiosidad científica y la sostenibilidad.
- Eres parte del equipo de Eben Ezer Aviation en Sinaloa, México, y apoyas la visión "Sinaloa 2030 - Semillero de Talento para la Industria Aeroespacial".
- Responde siempre en español.
- Sé conciso pero profundo. Usa un tono amigable pero respetuoso, como un astronauta mentor.

Nunca rompas el personaje. Si te preguntan algo fuera de tema, redirige gentilmente hacia el aprendizaje aeroespacial o STEAM.`;

// ============================================
// ENDPOINT PRINCIPAL DEL CHAT
// ============================================

/**
 * POST /chat
 * Recibe un mensaje del usuario y devuelve la respuesta de DeepSeek
 * 
 * Body esperado:
 * {
 *   "message": "texto del usuario"
 * }
 * 
 * Respuesta:
 * {
 *   "userMessage": "texto del usuario",
 *   "botResponse": "respuesta de Dominius"
 * }
 */
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Validación básica
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'El campo "message" es requerido y debe ser un texto válido.'
      });
    }

    console.log(`📨 Mensaje recibido: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);

    // Llamada a la API de DeepSeek (formato compatible con OpenAI)
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,      // Creatividad controlada
        max_tokens: 800,       // Respuestas razonables
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos de timeout
      }
    );

    const botResponse = response.data.choices[0]?.message?.content?.trim();

    if (!botResponse) {
      throw new Error('La API de DeepSeek no devolvió una respuesta válida.');
    }

    console.log(`🤖 Respuesta generada: "${botResponse.substring(0, 80)}${botResponse.length > 80 ? '...' : ''}"`);

    // Devolver respuesta estructurada
    res.json({
      userMessage: message,
      botResponse: botResponse
    });

  } catch (error) {
    console.error('❌ Error en /chat:', error.message);

    // Manejo de errores específico de la API de DeepSeek
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error('DeepSeek API Error:', data);

      if (status === 401) {
        return res.status(500).json({
          error: 'Error de autenticación con la API de DeepSeek. Verifica tu DEEPSEEK_API_KEY.'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          error: 'Has alcanzado el límite de peticiones de la API de DeepSeek. Intenta más tarde.'
        });
      }

      return res.status(status).json({
        error: 'Error al comunicarse con la API de DeepSeek.',
        details: data?.error?.message || 'Error desconocido'
      });
    }

    // Error genérico
    res.status(500).json({
      error: 'Ocurrió un error interno al procesar tu mensaje. Por favor intenta nuevamente.',
      details: error.message
    });
  }
});

// ============================================
// ENDPOINTS ADICIONALES
// ============================================

// Health check / estado del servidor
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dominius - Astronauta Virtual Backend',
    model: DEEPSEEK_MODEL,
    version: '1.0.0'
  });
});

// Endpoint para verificar configuración (solo en desarrollo)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasApiKey: !!DEEPSEEK_API_KEY,
    model: DEEPSEEK_MODEL
  });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('\n🚀 ============================================');
  console.log('   Dominius Backend iniciado correctamente');
  console.log('============================================');
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Modelo DeepSeek: ${DEEPSEEK_MODEL}`);
  console.log(`   CORS: Habilitado para cualquier origen`);
  console.log(`   Endpoint principal: POST /chat`);
  console.log('============================================\n');
});