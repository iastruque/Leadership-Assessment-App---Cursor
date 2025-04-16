const express = require('express');
const cors = require('cors');
const winston = require('winston');
const path = require('path');
const db = require('./config/db-selector');

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/app.log') 
    })
  ]
});

// Imprimir los valores de las variables de entorno (sin mostrar contraseñas)
logger.info(`DB_TYPE: ${process.env.DB_TYPE || 'postgres'}`);
logger.info(`POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'postgres'}`);
logger.info(`POSTGRES_PORT: ${process.env.POSTGRES_PORT || '5432'}`);
logger.info(`POSTGRES_DB: ${process.env.POSTGRES_DB || 'leadership'}`);
logger.info(`POSTGRES_USER: ${process.env.POSTGRES_USER || 'postgres'}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'API de Leadership Assessment App' });
});

// Ruta para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const query = 'SELECT * FROM users';
    const result = await db.executeQuery(query);
    res.json(result.rows || result);
  } catch (error) {
    logger.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Ruta para obtener todos los assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.user_id, a.date, a.average_score, u.name, u.email
      FROM assessments a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.date DESC
    `;
    const result = await db.executeQuery(query);
    
    // Asegurarse de que todos los puntajes estén en formato de porcentaje (0-100%)
    const assessments = (result.rows || result).map(assessment => {
      // Si el puntaje es menor a 20, probablemente está en escala 1-5 y necesita conversión
      if (assessment.average_score < 20) {
        // Convertir de escala 1-5 a porcentaje (0-100%)
        const maxScore = 5;
        const score = assessment.average_score;
        // Solo convertir si parece estar en escala 1-5
        if (score <= maxScore) {
          assessment.average_score = Math.round((score / maxScore) * 100);
        }
      }
      return assessment;
    });
    
    res.json(assessments);
  } catch (error) {
    logger.error('Error al obtener assessments:', error);
    res.status(500).json({ error: 'Error al obtener assessments' });
  }
});

// Ruta para crear un nuevo assessment
app.post('/api/assessment', async (req, res) => {
  const { userId, answers, dimensionScores } = req.body;
  
  try {
    // Si no se proporciona un userId, crear un usuario anónimo
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      const userQuery = 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id';
      const userParams = ['Anonymous', `anonymous_${Date.now()}@example.com`];
      const userResult = await db.executeQuery(userQuery, userParams);
      userIdToUse = userResult.rows ? userResult.rows[0].id : userResult[0].id;
    }
    
    // Calcular puntuación promedio como porcentaje (0-100%)
    let averageScore = 0;
    
    if (dimensionScores && Object.keys(dimensionScores).length > 0) {
      // Si se proporcionan dimensionScores, usar esos valores para calcular el promedio
      const scores = Object.values(dimensionScores);
      averageScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
        : 0;
    } else if (answers && Object.keys(answers).length > 0) {
      // Si no hay dimensionScores pero sí hay respuestas, calcular el promedio
      // basado en las respuestas directamente (escala 1-5 convertida a porcentaje)
      const rawScores = Object.values(answers);
      averageScore = rawScores.length > 0 
        ? Math.round((rawScores.reduce((sum, score) => sum + score, 0) / (rawScores.length * 5)) * 100) 
        : 0;
    }
    
    logger.info(`Guardando assessment con puntuación promedio: ${averageScore}%`);
    
    // Crear el assessment
    const assessmentQuery = 'INSERT INTO assessments (user_id, average_score) VALUES ($1, $2) RETURNING id';
    const assessmentParams = [userIdToUse, averageScore];
    const assessmentResult = await db.executeQuery(assessmentQuery, assessmentParams);
    
    const assessmentId = assessmentResult.rows ? assessmentResult.rows[0].id : assessmentResult[0].id;
    
    // Procesar cada respuesta individual
    for (const [questionId, score] of Object.entries(answers)) {
      // Determinar la dimensión de la pregunta basada en su ID
      // Extraer el ID de dimensión del ID de la pregunta - este formato sigue la convención q{dimensionIndex}_{preguntaIndex}
      // Por ejemplo: q1_2 se refiere a la dimensión 1, pregunta 2
      const dimension = questionId.startsWith('q') ? questionId.split('_')[0].substring(1) : '0';
      const dimensionMap = {
        '1': 'raising_expectations',
        '2': 'increasing_urgency',
        '3': 'intensifying_commitment',
        '4': 'transforming_conversations',
        '5': 'data_driven_leadership'
      };
      const dimensionId = dimensionMap[dimension] || 'unknown';
      
      // Guardar la respuesta individual
      const answerQuery = 'INSERT INTO question_answers (assessment_id, question_id, dimension, answer) VALUES ($1, $2, $3, $4)';
      const answerParams = [assessmentId, questionId, dimensionId, score];
      await db.executeQuery(answerQuery, answerParams);
    }
    
    // Guardar puntuaciones por dimensión
    if (dimensionScores) {
      for (const [dimensionId, score] of Object.entries(dimensionScores)) {
        const dimensionQuery = 'INSERT INTO dimension_scores (assessment_id, dimension, score) VALUES ($1, $2, $3)';
        const dimensionParams = [assessmentId, dimensionId, score];
        await db.executeQuery(dimensionQuery, dimensionParams);
      }
    }
    
    res.status(201).json({
      assessmentId,
      userId: userIdToUse,
      averageScore,
      dimensionScores: dimensionScores || {}
    });
    
  } catch (error) {
    logger.error('Error al crear assessment:', error);
    res.status(500).json({ error: 'Error al procesar la evaluación' });
  }
});

// Ruta para obtener un assessment específico
app.get('/api/assessment/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Obtener detalles del assessment
    const assessmentQuery = 'SELECT * FROM assessments WHERE id = $1';
    const assessmentParams = [id];
    const assessmentResult = await db.executeQuery(assessmentQuery, assessmentParams);
    
    if (!assessmentResult.rows || assessmentResult.rows.length === 0 || !assessmentResult.length) {
      return res.status(404).json({ error: 'Assessment no encontrado' });
    }
    
    const assessment = assessmentResult.rows ? assessmentResult.rows[0] : assessmentResult[0];
    
    // Convertir puntuación promedio a porcentaje si está en escala 1-5
    if (assessment.average_score < 20) {
      const maxScore = 5;
      const score = assessment.average_score;
      if (score <= maxScore) {
        assessment.average_score = Math.round((score / maxScore) * 100);
      }
    }
    
    // Obtener puntuaciones por dimensión
    const dimensionQuery = 'SELECT dimension, score FROM dimension_scores WHERE assessment_id = $1';
    const dimensionParams = [id];
    const dimensionScoresResult = await db.executeQuery(dimensionQuery, dimensionParams);
    const dimensionRows = dimensionScoresResult.rows || dimensionScoresResult;
    
    // Convertir puntuaciones por dimensión a porcentaje si están en escala 1-5
    const dimensionScores = dimensionRows.reduce((acc, row) => {
      let score = row.score;
      // Si el score está en escala 1-5, convertirlo a porcentaje
      if (score < 20 && score <= 5) {
        score = Math.round((score / 5) * 100);
      }
      acc[row.dimension] = score;
      return acc;
    }, {});
    
    // Obtener respuestas a preguntas
    const answersQuery = 'SELECT question_id, dimension, answer FROM question_answers WHERE assessment_id = $1';
    const answersParams = [id];
    const answersResult = await db.executeQuery(answersQuery, answersParams);
    const answerRows = answersResult.rows || answersResult;
    
    res.json({
      id: assessment.id,
      userId: assessment.user_id,
      date: assessment.date,
      averageScore: assessment.average_score,
      dimensionScores,
      answers: answerRows.reduce((acc, row) => {
        acc[row.question_id] = row.answer;
        return acc;
      }, {})
    });
    
  } catch (error) {
    logger.error('Error al obtener assessment:', error);
    res.status(500).json({ error: 'Error al obtener la evaluación' });
  }
});

// Inicializar la base de datos al iniciar el servidor
(async () => {
  try {
    await db.initializeDatabase();
    app.listen(PORT, () => {
      logger.info(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
  }
})();

// Manejar eventos de cierre
process.on('SIGINT', async () => {
  logger.info('Cerrando la aplicación...');
  process.exit(0);
}); 