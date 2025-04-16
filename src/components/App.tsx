import React, { useState, useEffect, useRef } from 'react';
import QuestionnaireForm from './QuestionnaireForm';
import ResultsRadarChart from './ResultsRadarChart';
import Recommendations from './Recommendations';
import DatabaseView from './DatabaseView';
import { Question, Dimension, UserResults } from '../types';
import { questions } from '../data/questions';
import { dimensions } from '../data/dimensions';
import { generatePDF } from '../utils/pdfUtils';
import { saveAssessment } from '../services/databaseService';
import { Chart } from 'chart.js';

const App: React.FC = () => {
  const [results, setResults] = useState<UserResults | null>(null);
  const [currentStep, setCurrentStep] = useState<'questionnaire' | 'results' | 'database'>('questionnaire');
  const chartRef = useRef<Chart<"radar", number[], string> | null>(null);

  // Check if there are saved results in localStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('leadershipResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        setCurrentStep('results');
      } catch (e) {
        console.error('Error parsing saved results:', e);
      }
    }
  }, []);

  const handleSubmitAnswers = async (answers: Record<string, number>) => {
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
    
    // Save results to the database
    try {
      await saveAssessment(newResults);
    } catch (error) {
      console.error('Error al guardar en la base de datos:', error);
      // No mostramos error al usuario para no interrumpir la experiencia
    }
  };

  const handleReset = () => {
    setResults(null);
    setCurrentStep('questionnaire');
    localStorage.removeItem('leadershipResults');
  };

  // Calculate average score
  const calculateAverageScore = () => {
    if (!results) return 0;
    
    const scores = Object.values(results.dimensionScores);
    return scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
      : 0;
  };

  const handleChartRef = (chart: Chart<"radar", number[], string> | null) => {
    chartRef.current = chart;
  };

  const handleExportPDF = () => {
    if (!results || !chartRef.current) return;
    generatePDF(results, dimensions, chartRef);
  };

  const handleViewDatabase = () => {
    setCurrentStep('database');
  };

  const handleBackFromDatabase = () => {
    setCurrentStep('results');
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
        {currentStep === 'questionnaire' ? (
          <QuestionnaireForm 
            questions={questions} 
            dimensions={dimensions}
            onSubmit={handleSubmitAnswers} 
          />
        ) : currentStep === 'database' ? (
          <DatabaseView onBack={handleBackFromDatabase} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Integrated Leadership Assessment</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  New Assessment
                </button>
              </div>
            </div>

            {results && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-gray-500 text-sm">Average Score:</span>
                    <span className="text-4xl font-bold text-blue-600 ml-2">{calculateAverageScore()}%</span>
                  </div>
                  
                  {/* Botones de acción principales */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleViewDatabase}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                      </svg>
                      Ver Base de Datos
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Exportar PDF
                    </button>
                  </div>
                </div>
                
                <ResultsRadarChart 
                  results={results} 
                  dimensions={dimensions}
                  onChartReady={handleChartRef}
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