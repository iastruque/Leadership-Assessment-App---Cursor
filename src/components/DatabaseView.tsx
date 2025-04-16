import React, { useState, useEffect } from 'react';
import { getUsers, getAssessments, getAssessmentById } from '../services/databaseService';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Assessment {
  id: number;
  user_id: number;
  date: string;
  average_score: number;
  name?: string;
  email?: string;
}

interface DetailedAssessment {
  id: number;
  userId: number;
  date: string;
  averageScore: number;
  dimensionScores: Record<string, number>;
  answers: Record<string, number>;
}

const DatabaseView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<DetailedAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, assessmentsData] = await Promise.all([
          getUsers(),
          getAssessments()
        ]);
        setUsers(usersData);
        setAssessments(assessmentsData);
        setError(null);
      } catch (err) {
        setError('Error al cargar datos de la base de datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewDetails = async (id: number) => {
    try {
      setLoading(true);
      const detailedAssessment = await getAssessmentById(id);
      setSelectedAssessment(detailedAssessment);
      setError(null);
    } catch (err) {
      setError(`Error al cargar los detalles del assessment ${id}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Base de Datos</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Volver
        </button>
      </div>

      {loading && <p className="text-center py-4">Cargando datos...</p>}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Vista de tabla de assessments */}
          {!selectedAssessment && (
            <div>
              <h3 className="text-xl font-medium mb-4">Assessments ({assessments.length})</h3>
              {assessments.length === 0 ? (
                <p className="text-gray-500 italic">No hay assessments en la base de datos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntuación Promedio</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assessments.map(assessment => (
                        <tr key={assessment.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 text-sm text-gray-900">{assessment.id}</td>
                          <td className="py-2 px-4 text-sm text-gray-900">{assessment.name || 'Anónimo'}</td>
                          <td className="py-2 px-4 text-sm text-gray-500">{assessment.email || 'N/A'}</td>
                          <td className="py-2 px-4 text-sm text-gray-500">{formatDate(assessment.date)}</td>
                          <td className="py-2 px-4 text-sm text-gray-900 font-medium">{assessment.average_score}%</td>
                          <td className="py-2 px-4 text-sm">
                            <button
                              onClick={() => handleViewDetails(assessment.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Vista de detalles de un assessment */}
          {selectedAssessment && (
            <div>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver a la lista
                </button>
                <h3 className="text-xl font-medium">Detalles del Assessment #{selectedAssessment.id}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Información General</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-600">ID:</span> {selectedAssessment.id}</p>
                    <p><span className="font-medium text-gray-600">ID de Usuario:</span> {selectedAssessment.userId}</p>
                    <p><span className="font-medium text-gray-600">Fecha:</span> {formatDate(selectedAssessment.date)}</p>
                    <p><span className="font-medium text-gray-600">Puntuación Promedio:</span> {selectedAssessment.averageScore}%</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Puntuaciones por Dimensión</h4>
                  {Object.entries(selectedAssessment.dimensionScores).length === 0 ? (
                    <p className="text-gray-500 italic">No hay puntuaciones por dimensión disponibles.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(selectedAssessment.dimensionScores).map(([dimension, score]) => (
                        <div key={dimension} className="flex justify-between">
                          <span className="text-gray-600">{dimension}</span>
                          <span className="font-medium">{score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Respuestas a Preguntas</h4>
                {Object.entries(selectedAssessment.answers).length === 0 ? (
                  <p className="text-gray-500 italic">No hay respuestas disponibles.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(selectedAssessment.answers).map(([questionId, answer]) => (
                      <div key={questionId} className="border border-gray-200 p-3 rounded">
                        <p className="text-sm text-gray-500">Pregunta #{questionId}</p>
                        <p className="font-medium">{answer} / 5</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseView; 