import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ruta absoluta al archivo CSV - adaptada para el volumen montado en Docker
const CSV_FILE_PATH = process.env.CSV_PATH || '/app/storage/respuestas.csv';

console.log(`Usando archivo CSV en: ${CSV_FILE_PATH}`);

// Asegurar que el archivo existe y crear encabezado si es necesario
const ensureFileExists = async () => {
  try {
    if (!await fs.pathExists(CSV_FILE_PATH)) {
      // Crear el archivo con encabezados
      await fs.writeFile(
        CSV_FILE_PATH,
        'Manager Name,Assessment Date,Average Score,Raising Expectations,Increasing Urgency,Intensifying Commitment,Transforming Conversations,Data-Driven Leadership,Question Answers\n'
      );
      console.log(`Archivo CSV creado en: ${CSV_FILE_PATH}`);
    } else {
      console.log(`Archivo CSV ya existe en: ${CSV_FILE_PATH}`);
      // Verificar permisos de escritura
      try {
        await fs.access(CSV_FILE_PATH, fs.constants.W_OK);
        console.log('Tenemos permisos de escritura en el archivo CSV');
      } catch (error) {
        console.error('¡ERROR! No tenemos permisos de escritura en el archivo CSV:', error);
      }
    }
  } catch (error) {
    console.error('Error al verificar/crear archivo CSV:', error);
  }
};

// Endpoint para guardar resultados
app.post('/api/save-results', async (req, res) => {
  try {
    const { 
      managerName, 
      results, 
      date,
      averageScore,
      dimensionScores,
      answers
    } = req.body;

    if (!results) {
      return res.status(400).json({ error: 'No se proporcionaron resultados válidos' });
    }

    await ensureFileExists();

    // Formatear fecha
    const formattedDate = new Date(date).toLocaleDateString();
    
    // Construir línea CSV con los datos
    const csvLine = [
      managerName || 'Anonymous',
      formattedDate,
      `${averageScore}%`,
      `${dimensionScores.raising_expectations}%`,
      `${dimensionScores.increasing_urgency}%`,
      `${dimensionScores.intensifying_commitment}%`,
      `${dimensionScores.transforming_conversations}%`,
      `${dimensionScores.data_driven_leadership}%`,
      JSON.stringify(answers).replace(/,/g, ';') // Reemplazar comas para evitar problemas con CSV
    ].join(',');

    // Añadir línea al archivo
    await fs.appendFile(CSV_FILE_PATH, `${csvLine}\n`);

    console.log(`Resultados guardados para ${managerName} en ${CSV_FILE_PATH}`);
    
    res.status(200).json({ 
      success: true, 
      message: `Resultados guardados correctamente para ${managerName}`,
      filePath: CSV_FILE_PATH
    });
  } catch (error) {
    console.error('Error al guardar resultados:', error);
    res.status(500).json({ 
      error: 'Error al guardar resultados', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint para obtener todos los resultados
app.get('/api/results', async (req, res) => {
  try {
    await ensureFileExists();
    
    const csvContent = await fs.readFile(CSV_FILE_PATH, 'utf8');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error al leer resultados:', error);
    res.status(500).json({ 
      error: 'Error al leer resultados', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    csvPath: CSV_FILE_PATH
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  ensureFileExists();
}); 