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
    const assessmentQuery = 'SELECT a.*, u.name, u.email FROM assessments a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = $1';
    const assessmentParams = [id];
    const assessmentResult = await db.executeQuery(assessmentQuery, assessmentParams);
    
    if (!assessmentResult.rows || assessmentResult.rows.length === 0 || !assessmentResult.length) {
      logger.warn(`Assessment no encontrado con ID: ${id}`);
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
    let dimensionScores = {};
    
    try {
      const dimensionScoresResult = await db.executeQuery(dimensionQuery, dimensionParams);
      const dimensionRows = dimensionScoresResult && (dimensionScoresResult.rows || dimensionScoresResult) || [];
    
    // Convertir puntuaciones por dimensión a porcentaje si están en escala 1-5
      dimensionScores = dimensionRows.reduce((acc, row) => {
        if (!row || !row.dimension) return acc;
        
      let score = row.score;
      // Si el score está en escala 1-5, convertirlo a porcentaje
      if (score < 20 && score <= 5) {
        score = Math.round((score / 5) * 100);
      }
      acc[row.dimension] = score;
      return acc;
    }, {});
    } catch (dimensionError) {
      logger.warn(`Error al obtener dimensiones para assessment ${id}:`, dimensionError);
      // No devolvemos error, continuamos con dimensionScores vacío
    }
    
    // Obtener respuestas a preguntas
    const answersQuery = 'SELECT question_id, dimension, answer FROM question_answers WHERE assessment_id = $1';
    const answersParams = [id];
    let answers = {};
    
    try {
    const answersResult = await db.executeQuery(answersQuery, answersParams);
      const answerRows = answersResult && (answersResult.rows || answersResult) || [];
      
      answers = answerRows.reduce((acc, row) => {
        if (row && row.question_id) {
          acc[row.question_id] = row.answer;
        }
        return acc;
      }, {});
    } catch (answersError) {
      logger.warn(`Error al obtener respuestas para assessment ${id}:`, answersError);
      // No devolvemos error, continuamos con answers vacío
    }
    
    // Construir el objeto de respuesta
    const responseObj = {
      id: assessment.id,
      userId: assessment.user_id,
      date: assessment.date,
      averageScore: assessment.average_score || 0,
      name: assessment.name || 'Anónimo',
      email: assessment.email || 'anónimo@example.com',
      dimensionScores,
      answers
    };
    
    logger.info(`Detalles de assessment ${id} enviados correctamente`);
    res.json(responseObj);
    
  } catch (error) {
    logger.error(`Error al obtener assessment ${id}:`, error);
    res.status(500).json({ error: `Error al obtener la evaluación: ${error.message}` });
  }
});

// Ruta para obtener un assessment específico (versión alternativa)
app.get('/api/assessment-alt/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar primero si el assessment existe en la tabla principal
    const checkQuery = 'SELECT id FROM assessments WHERE id = $1';
    const checkResult = await db.executeQuery(checkQuery, [id]);
    
    // Si no existe ningún registro, no hay assessment
    if (!checkResult.rows || checkResult.rows.length === 0) {
      logger.warn(`Assessment no encontrado con ID: ${id}`);
      return res.status(404).json({ error: 'Assessment no encontrado' });
    }
    
    // Si llegamos aquí, el assessment existe. Obtenemos sus datos básicos
    const assessmentQuery = 'SELECT a.*, u.name, u.email FROM assessments a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = $1';
    const assessmentResult = await db.executeQuery(assessmentQuery, [id]);
    const assessment = assessmentResult.rows ? assessmentResult.rows[0] : assessmentResult[0];
    
    // Formateamos la puntuación a porcentaje
    let averageScore = assessment.average_score || 0;
    if (averageScore < 20 && averageScore <= 5) {
      averageScore = Math.round((averageScore / 5) * 100);
    }
    
    // Intentamos obtener puntuaciones por dimensión, sin fallar si no hay
    let dimensionScores = {};
    try {
      const dimensionResult = await db.executeQuery('SELECT dimension, score FROM dimension_scores WHERE assessment_id = $1', [id]);
      if (dimensionResult.rows && dimensionResult.rows.length > 0) {
        for (const row of dimensionResult.rows) {
          let score = row.score || 0;
          if (score < 20 && score <= 5) {
            score = Math.round((score / 5) * 100);
          }
          dimensionScores[row.dimension] = score;
        }
      }
    } catch (e) {
      logger.warn(`No se pudieron obtener dimensiones para assessment ${id}`);
    }
    
    // Intentamos obtener respuestas, sin fallar si no hay
    let answers = {};
    try {
      const answersResult = await db.executeQuery('SELECT question_id, dimension, answer FROM question_answers WHERE assessment_id = $1', [id]);
      if (answersResult.rows && answersResult.rows.length > 0) {
        for (const row of answersResult.rows) {
          // Guardamos la respuesta con más información (pregunta y dimensión)
          answers[row.question_id] = {
            value: row.answer,
            dimension: row.dimension,
            questionText: getQuestionText(row.question_id, row.dimension)
          };
        }
      } else {
        // Si no hay respuestas, añadimos un mensaje explicativo
        logger.info(`No se encontraron respuestas para el assessment ${id}`);
      }
    } catch (e) {
      logger.warn(`No se pudieron obtener respuestas para assessment ${id}: ${e.message}`);
    }
    
    // Respuesta con datos básicos garantizados y opcionales si existen
    const responseObj = {
      id: Number(id),
      userId: assessment.user_id,
      date: assessment.date,
      averageScore: averageScore,
      name: assessment.name || 'Anónimo',
      email: assessment.email || 'anónimo@example.com',
      dimensionScores,
      answers,
      metadata: {
        hasAnswers: Object.keys(answers).length > 0,
        hasDimensionScores: Object.keys(dimensionScores).length > 0,
        message: Object.keys(answers).length === 0 ? 
          "Este assessment no tiene respuestas guardadas. Es posible que se haya creado sin guardar las respuestas individuales." :
          null
      }
    };
    
    logger.info(`Detalles de assessment ${id} enviados correctamente (ruta alternativa)`);
    res.json(responseObj);
    
  } catch (error) {
    logger.error(`Error en ruta alternativa para assessment ${id}:`, error);
    // En caso de cualquier error, devolvemos un objeto mínimo para evitar errores en el frontend
    res.json({
      id: Number(id),
      userId: 0,
      date: new Date().toISOString(),
      averageScore: 0,
      name: 'Error - Datos no disponibles',
      email: 'error@example.com',
      dimensionScores: {},
      answers: {},
      metadata: {
        hasAnswers: false,
        hasDimensionScores: false,
        message: "Error al obtener los datos del assessment."
      }
    });
  }
});

// Ruta para obtener información sobre la base de datos
app.get('/api/db-info', async (req, res) => {
  try {
    // Obtener lista de tablas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tablesResult = await db.executeQuery(tablesQuery);
    const tables = tablesResult.rows || tablesResult;
    
    // Obtener datos de cada tabla
    const dbInfo = {};
    
    for (const tableRow of tables) {
      const tableName = tableRow.table_name;
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const dataQuery = `SELECT * FROM ${tableName} LIMIT 50`;
      
      try {
        const countResult = await db.executeQuery(countQuery);
        const dataResult = await db.executeQuery(dataQuery);
        
        dbInfo[tableName] = {
          count: parseInt(countResult.rows[0].count),
          data: dataResult.rows || dataResult
        };
      } catch (tableError) {
        logger.error(`Error al obtener datos de tabla ${tableName}:`, tableError);
        dbInfo[tableName] = { error: tableError.message };
      }
    }
    
    res.json({ 
      tables: tables.map(t => t.table_name),
      data: dbInfo
    });
  } catch (error) {
    logger.error('Error al obtener información de la base de datos:', error);
    res.status(500).json({ error: 'Error al obtener información de la base de datos' });
  }
});

// Ruta para crear datos de prueba en un assessment existente
app.get('/api/test-data/:assessmentId', async (req, res) => {
  const { assessmentId } = req.params;
  
  try {
    // Verificar si el assessment existe
    const checkQuery = 'SELECT id FROM assessments WHERE id = $1';
    const checkResult = await db.executeQuery(checkQuery, [assessmentId]);
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment no encontrado' });
    }
    
    // Datos de prueba para dimension_scores
    const dimensions = [
      { dimension: 'raising_expectations', score: 75 },
      { dimension: 'increasing_urgency', score: 80 },
      { dimension: 'intensifying_commitment', score: 65 },
      { dimension: 'transforming_conversations', score: 70 },
      { dimension: 'data_driven_leadership', score: 85 }
    ];
    
    // Primero eliminar datos existentes para evitar duplicados
    await db.executeQuery('DELETE FROM dimension_scores WHERE assessment_id = $1', [assessmentId]);
    await db.executeQuery('DELETE FROM question_answers WHERE assessment_id = $1', [assessmentId]);
    
    // Insertar puntuaciones por dimensión
    for (const dim of dimensions) {
      const dimensionQuery = 'INSERT INTO dimension_scores (assessment_id, dimension, score) VALUES ($1, $2, $3)';
      await db.executeQuery(dimensionQuery, [assessmentId, dim.dimension, dim.score]);
    }
    
    // Datos de prueba para question_answers - usando números como IDs
    const questions = [
      { id: 101, dimension: 'raising_expectations', answer: 4, originalId: 'q1_1' },
      { id: 102, dimension: 'raising_expectations', answer: 5, originalId: 'q1_2' },
      { id: 103, dimension: 'raising_expectations', answer: 3, originalId: 'q1_3' },
      { id: 201, dimension: 'increasing_urgency', answer: 4, originalId: 'q2_1' },
      { id: 202, dimension: 'increasing_urgency', answer: 5, originalId: 'q2_2' },
      { id: 203, dimension: 'increasing_urgency', answer: 4, originalId: 'q2_3' },
      { id: 301, dimension: 'intensifying_commitment', answer: 3, originalId: 'q3_1' },
      { id: 302, dimension: 'intensifying_commitment', answer: 4, originalId: 'q3_2' },
      { id: 303, dimension: 'intensifying_commitment', answer: 3, originalId: 'q3_3' },
      { id: 401, dimension: 'transforming_conversations', answer: 4, originalId: 'q4_1' },
      { id: 402, dimension: 'transforming_conversations', answer: 3, originalId: 'q4_2' },
      { id: 403, dimension: 'transforming_conversations', answer: 4, originalId: 'q4_3' },
      { id: 501, dimension: 'data_driven_leadership', answer: 5, originalId: 'q5_1' },
      { id: 502, dimension: 'data_driven_leadership', answer: 4, originalId: 'q5_2' },
      { id: 503, dimension: 'data_driven_leadership', answer: 4, originalId: 'q5_3' }
    ];
    
    // Insertar respuestas
    for (const q of questions) {
      const questionQuery = 'INSERT INTO question_answers (assessment_id, question_id, dimension, answer) VALUES ($1, $2, $3, $4)';
      await db.executeQuery(questionQuery, [assessmentId, q.id, q.dimension, q.answer]);
    }
    
    res.json({ 
      success: true, 
      message: `Datos de prueba creados para assessment ${assessmentId}`,
      dimensionsAdded: dimensions.length,
      questionsAdded: questions.length
    });
  } catch (error) {
    logger.error(`Error al crear datos de prueba para assessment ${assessmentId}:`, error);
    res.status(500).json({ error: 'Error al crear datos de prueba' });
  }
});

// Función auxiliar para obtener el texto de la pregunta basado en su ID
function getQuestionText(questionId, dimension) {
  // Mapeo de dimensiones a nombres más amigables
  const dimensionNames = {
    'raising_expectations': 'Aumentar Expectativas',
    'increasing_urgency': 'Incrementar Urgencia',
    'intensifying_commitment': 'Intensificar Compromiso',
    'transforming_conversations': 'Transformar Conversaciones',
    'data_driven_leadership': 'Liderazgo basado en Datos'
  };
  
  // Mapeo para convertir IDs numéricos a formato de texto original
  let textId = questionId;
  if (typeof questionId === 'number') {
    const hundreds = Math.floor(questionId / 100);
    const remainder = questionId % 100;
    textId = `q${hundreds}_${remainder}`;
  }
  
  // Mapeo de preguntas específicas a textos descriptivos
  const questionTexts = {
    'q1_1': '¿Con qué frecuencia estableces metas ambiciosas para tu equipo?',
    'q1_2': '¿Cuán efectivo eres comunicando altas expectativas?',
    'q1_3': '¿Reconoces y celebras cuando el equipo supera las expectativas?',
    
    'q2_1': '¿Comunicas claramente la urgencia de las iniciativas importantes?',
    'q2_2': '¿Cuán bien gestionas los plazos y prioridades?',
    'q2_3': '¿Motivas al equipo para actuar con sentido de urgencia?',
    
    'q3_1': '¿Fomentas un fuerte sentido de compromiso en tu equipo?',
    'q3_2': '¿Demuestras compromiso personal con los objetivos del equipo?',
    'q3_3': '¿Ayudas a los miembros del equipo a conectar con el propósito de su trabajo?',
    
    'q4_1': '¿Facilitás conversaciones constructivas en tu equipo?',
    'q4_2': '¿Promueves el feedback honesto y transparente?',
    'q4_3': '¿Transformas los conflictos en oportunidades de aprendizaje?',
    
    'q5_1': '¿Basas tus decisiones en datos y evidencias?',
    'q5_2': '¿Estableces métricas claras para medir el éxito?',
    'q5_3': '¿Utilizas análisis de datos para mejorar procesos y resultados?'
  };
  
  // Si tenemos un texto específico para esta pregunta, usarlo
  if (questionTexts[textId]) {
    return questionTexts[textId];
  }
  
  // Si no, construir un texto genérico
  const dimensionName = dimensionNames[dimension] || dimension || 'Dimensión no especificada';
  return `Pregunta ${textId} (${dimensionName})`;
}

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