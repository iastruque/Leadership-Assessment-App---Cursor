import { UserResults } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Obtener todos los usuarios
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getUsers:', error);
    throw error;
  }
};

// Obtener todos los assessments
export const getAssessments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments`);
    if (!response.ok) {
      throw new Error('Error al obtener assessments');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getAssessments:', error);
    throw error;
  }
};

// Obtener un assessment específico por ID
export const getAssessmentById = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el assessment');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getAssessmentById(${id}):`, error);
    throw error;
  }
};

// Guardar un nuevo assessment
export const saveAssessment = async (results: UserResults) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: results.answers,
        dimensionScores: results.dimensionScores
      }),
    });
    
    if (!response.ok) {
      throw new Error('Error al guardar el assessment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en saveAssessment:', error);
    throw error;
  }
}; 