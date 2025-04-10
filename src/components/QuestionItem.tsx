import React from 'react';
import { Question } from '../types';

interface QuestionItemProps {
  question: Question;
  value: number;
  onChange: (value: number) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, value, onChange }) => {
  const options = [
    { value: 1, label: 'Never' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Frequently' },
    { value: 5, label: 'Always' }
  ];

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <p className="mb-2 text-sm font-medium text-gray-800">{question.text}</p>
      <div className="grid grid-cols-5 gap-1 text-center text-xs">
        {options.map(option => (
          <div key={option.value} className="flex flex-col items-center">
            <button
              onClick={() => onChange(option.value)}
              className={`w-full py-1.5 rounded-lg transition-colors ${
                value === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <span className="italic">{question.ampItUpPrinciple}</span>
      </div>
    </div>
  );
};

export default QuestionItem;
