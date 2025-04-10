import React, { useState } from 'react';
import { Question, Dimension } from '../types';
import QuestionItem from './QuestionItem';

interface QuestionnaireFormProps {
  questions: Question[];
  dimensions: Dimension[];
  onSubmit: (answers: Record<string, number>) => void;
}

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ 
  questions, 
  dimensions,
  onSubmit 
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentDimension, setCurrentDimension] = useState<string>(dimensions[0].id);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const dimensionQuestions = questions.filter(q => q.dimension === currentDimension);
  const currentDimensionIndex = dimensions.findIndex(d => d.id === currentDimension);
  const currentDimensionData = dimensions[currentDimensionIndex];

  const handleNext = () => {
    // Check if all questions in current dimension are answered
    const unansweredQuestions = dimensionQuestions.filter(q => answers[q.id] === undefined);
    
    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before continuing.');
      return;
    }
    
    setError(null);
    
    // If this is the last dimension, submit the form
    if (currentDimensionIndex === dimensions.length - 1) {
      onSubmit(answers);
    } else {
      // Otherwise, move to the next dimension
      setCurrentDimension(dimensions[currentDimensionIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentDimensionIndex > 0) {
      setCurrentDimension(dimensions[currentDimensionIndex - 1].id);
    }
    setError(null);
  };

  const progress = ((currentDimensionIndex + 1) / dimensions.length) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {currentDimensionData.name}
          </h2>
          <span className="text-xs text-gray-500">
            Dimension {currentDimensionIndex + 1} of {dimensions.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-600 italic">
          {currentDimensionData.description}
        </p>
      </div>

      <div className="space-y-3">
        {dimensionQuestions.map(question => (
          <QuestionItem
            key={question.id}
            question={question}
            value={answers[question.id] || 0}
            onChange={(value) => handleAnswerChange(question.id, value)}
          />
        ))}
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-3">
        <button
          onClick={handlePrevious}
          disabled={currentDimensionIndex === 0}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        
        <button
          onClick={handleNext}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {currentDimensionIndex === dimensions.length - 1 ? 'View Results' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireForm;
