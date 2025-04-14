import React, { useState, useEffect } from 'react';
import QuestionnaireForm from './QuestionnaireForm';
import ResultsRadarChart from './ResultsRadarChart';
import Recommendations from './Recommendations';
import { Question, Dimension, UserResults } from '../types';
import { questions } from '../data/questions';
import { dimensions } from '../data/dimensions';
import { 
  exportResultsToCSV, 
  exportHistoricalDataToCSV, 
  saveResultsToServerCSV 
} from '../utils/csvExport';

const App: React.FC = () => {
  const [results, setResults] = useState<UserResults | null>(null);
  const [currentStep, setCurrentStep] = useState<'questionnaire' | 'results'>('questionnaire');
  const [managerName, setManagerName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Check if there are saved results in localStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('leadershipResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        setCurrentStep('results');
        
        // Check if manager name is saved
        const savedName = localStorage.getItem('managerName');
        if (savedName) {
          setManagerName(savedName);
        }
      } catch (e) {
        console.error('Error parsing saved results:', e);
      }
    }
  }, []);

  const handleSubmitAnswers = (answers: Record<string, number>) => {
    // Calculate scores for each dimension
    const dimensionScores: Record<string, number> = {};
    
    dimensions.forEach((dimension: Dimension) => {
      const dimensionQuestions = questions.filter(q => q.dimension === dimension.id);
      let totalScore = 0;
      let questionCount = 0;
      
      dimensionQuestions.forEach(question => {
        if (answers[question.id] !== undefined) {
          totalScore += answers[question.id];
          questionCount++;
        }
      });
      
      dimensionScores[dimension.id] = questionCount > 0 
        ? Math.round((totalScore / (questionCount * 5)) * 100) 
        : 0;
    });
    
    const newResults: UserResults = {
      dimensionScores,
      answers,
      date: new Date().toISOString()
    };
    
    setResults(newResults);
    setCurrentStep('results');
    
    // Save results to localStorage
    localStorage.setItem('leadershipResults', JSON.stringify(newResults));
    
    // Ask for manager name
    setShowNameInput(true);
  };

  const handleManagerNameSubmit = async () => {
    if (managerName.trim()) {
      localStorage.setItem('managerName', managerName);
      
      // Save to server if we have results
      if (results) {
        setIsSaving(true);
        try {
          await saveResultsToServerCSV(results, dimensions, managerName);
        } catch (error) {
          console.error('Error saving to server:', error);
        } finally {
          setIsSaving(false);
        }
      }
      
      setShowNameInput(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setCurrentStep('questionnaire');
    setShowNameInput(false);
    localStorage.removeItem('leadershipResults');
    // Keep manager name in localStorage
  };

  // Calculate average score
  const calculateAverageScore = () => {
    if (!results) return 0;
    
    const scores = Object.values(results.dimensionScores);
    return scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
      : 0;
  };

  const handleExportCSV = async () => {
    if (!results) return;
    
    setIsSaving(true);
    try {
      // Primero guardamos en el servidor (esto es lo más importante)
      await saveResultsToServerCSV(results, dimensions, managerName || 'Anonymous');
      
      // También descargamos una copia local (opcional)
      exportResultsToCSV(results, dimensions, questions, managerName || 'Anonymous');
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportHistoricalData = async () => {
    setIsSaving(true);
    try {
      await exportHistoricalDataToCSV();
    } catch (error) {
      console.error('Error exporting historical data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logo */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded p-2">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V8H7v2zm-4 8h2V4h14v14h2V4c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2h-4v-2z"/>
              </svg>
            </div>
            <h1 className="text-lg font-medium text-gray-800">Leadership Assessment based on Amp It Up and The Geek Way</h1>
          </div>
          <button className="text-gray-500 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Send feedback
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Manager name input dialog */}
        {showNameInput && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">¿Quién completó esta evaluación?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Ingresa tu nombre para guardar los resultados y poder analizarlos posteriormente.
              </p>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Nombre del manager"
                className="w-full p-2 border border-gray-300 rounded mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNameInput(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  disabled={isSaving}
                >
                  Omitir
                </button>
                <button
                  onClick={handleManagerNameSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saving overlay */}
        {isSaving && !showNameInput && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-800">Guardando resultados...</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'questionnaire' ? (
          <QuestionnaireForm 
            questions={questions} 
            dimensions={dimensions}
            onSubmit={handleSubmitAnswers} 
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Integrated Leadership Assessment</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar en CSV'}
                </button>
                <button
                  onClick={handleExportHistoricalData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  disabled={isSaving}
                >
                  Descargar Histórico
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  disabled={isSaving}
                >
                  Nueva evaluación
                </button>
              </div>
            </div>

            {results && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-gray-500 text-sm">Average Score:</span>
                    <span className="text-4xl font-bold text-blue-600 ml-2">{calculateAverageScore()}%</span>
                    {managerName && (
                      <div className="text-sm text-gray-500 mt-1">
                        Manager: <span className="font-medium">{managerName}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <ResultsRadarChart 
                  results={results} 
                  dimensions={dimensions} 
                />
                
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                  {dimensions.map((dimension) => (
                    <div key={dimension.id} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold text-gray-800">{dimension.name.split('&')[0]}</h4>
                        <span className="text-lg font-bold text-blue-600">{results.dimensionScores[dimension.id]}%</span>
                      </div>
                      <p className="text-xs text-gray-600">{dimension.shortDescription}</p>
                    </div>
                  ))}
                </div>
                
                <Recommendations 
                  results={results} 
                  dimensions={dimensions} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;