import { UserResults, Question, Dimension } from '../types';

// Usar la variable de entorno si está disponible, o localhost si estamos en desarrollo
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Guarda los resultados en el archivo CSV del servidor
 */
export const saveResultsToServerCSV = async (
  results: UserResults,
  dimensions: Dimension[],
  managerName: string = 'Anonymous'
): Promise<boolean> => {
  try {
    // Calculate average score
    const scores = Object.values(results.dimensionScores);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
      : 0;

    // Crear el payload para la API
    const payload = {
      managerName,
      results,
      date: results.date,
      averageScore,
      dimensionScores: results.dimensionScores,
      answers: results.answers
    };

    // Enviar al servidor
    const response = await fetch(`${API_URL}/save-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar en el servidor');
    }

    console.log('Resultados guardados correctamente en el servidor:', data.message);
    alert(`Resultados guardados correctamente para ${managerName} en el archivo CSV del servidor.`);
    return true;
  } catch (error: unknown) {
    console.error('Error guardando en el servidor:', error);
    alert(`Error al guardar en el servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return false;
  }
};

/**
 * Obtiene todos los resultados históricos del servidor
 */
export const getHistoricalResultsFromServer = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/results`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener resultados del servidor');
    }

    return await response.text();
  } catch (error: unknown) {
    console.error('Error obteniendo resultados del servidor:', error);
    alert(`Error al obtener resultados: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return null;
  }
};

/**
 * Convertir datos CSV a formato adecuado para Excel
 * (Esta función es opcional y permite descargar los datos para Excel)
 */
export const downloadCSVForExcel = (csvContent: string, filename: string): void => {
  try {
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`CSV Descargado: ${filename}`);
  } catch (error: unknown) {
    console.error('Error descargando CSV:', error);
    alert(`Error al descargar CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Función de compatibilidad para exportar resultados actuales (deprecated)
 */
export const exportResultsToCSV = (
  results: UserResults,
  dimensions: Dimension[],
  questions: Question[],
  managerName: string = 'Anonymous'
): void => {
  try {
    // Save to server first
    saveResultsToServerCSV(results, dimensions, managerName);
    
    // Create header row
    const headers = [
      'Manager Name',
      'Assessment Date',
      'Average Score',
      ...dimensions.map(d => `${d.name} Score`),
      ...questions.map(q => `Q${q.id}: ${q.text.substring(0, 30)}...`)
    ];

    // Calculate average score
    const scores = Object.values(results.dimensionScores);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
      : 0;

    // Create data row
    const row = [
      managerName,
      new Date(results.date).toLocaleDateString(),
      `${averageScore}%`,
      ...dimensions.map(d => `${results.dimensionScores[d.id]}%`),
      ...questions.map(q => results.answers[q.id] ? results.answers[q.id].toString() : 'N/A')
    ];

    // Combine header and row
    const csvContent = [
      headers.join(','),
      row.join(',')
    ].join('\n');

    // Create and trigger download
    const fileName = `leadership_assessment_${managerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSVForExcel(csvContent, fileName);
  } catch (error: unknown) {
    console.error('Error exporting CSV:', error);
    alert(`Error al exportar CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Función de compatibilidad - ya no utilizada (deprecated)
 */
export const saveResultToHistoricalCSV = (
  results: UserResults,
  dimensions: Dimension[],
  questions: Question[],
  managerName: string = 'Anonymous'
): void => {
  // Ahora guardamos directamente en el servidor
  saveResultsToServerCSV(results, dimensions, managerName);
};

/**
 * Exports all historical assessment data as a single CSV file
 */
export const exportHistoricalDataToCSV = async (): Promise<void> => {
  try {
    // Obtener datos del servidor
    const csvContent = await getHistoricalResultsFromServer();
    
    if (!csvContent) {
      alert('No hay datos históricos para exportar. Completa al menos una evaluación primero.');
      return;
    }
    
    // Descargar para Excel
    const fileName = `leadership_assessments_history_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSVForExcel(csvContent, fileName);
  } catch (error: unknown) {
    console.error('Error exporting historical data:', error);
    alert(`Error al exportar datos históricos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}; 