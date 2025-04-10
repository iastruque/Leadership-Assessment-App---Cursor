import React, { useState } from 'react';
import { Dimension, UserResults } from '../types';
import { getRecommendations } from '../utils/recommendationUtils';

interface RecommendationsProps {
  results: UserResults;
  dimensions: Dimension[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ results, dimensions }) => {
  // Find the dimension with the lowest score as the default selected
  const lowestScoreDimension = Object.entries(results.dimensionScores)
    .reduce((lowest, [dimId, score]) => {
      if (lowest.score === null || score < lowest.score) {
        return { id: dimId, score };
      }
      return lowest;
    }, { id: '' as string, score: null as number | null });
    
  const [selectedDimensionId, setSelectedDimensionId] = useState<string>(lowestScoreDimension.id);
  
  const selectedDimension = dimensions.find(d => d.id === selectedDimensionId);
  const dimensionScore = selectedDimension ? results.dimensionScores[selectedDimension.id] : 0;
  const recommendations = selectedDimension ? getRecommendations(selectedDimension.id, dimensionScore) : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Personalized Recommendations</h3>
      
      <div className="mb-5">
        <label htmlFor="dimension-select" className="block text-sm font-medium text-gray-500 mb-1">
          Select a dimension:
        </label>
        <select
          id="dimension-select"
          value={selectedDimensionId}
          onChange={(e) => setSelectedDimensionId(e.target.value)}
          className="block w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {dimensions.map(dimension => (
            <option key={dimension.id} value={dimension.id}>
              {dimension.name} ({results.dimensionScores[dimension.id]}%)
            </option>
          ))}
        </select>
      </div>
      
      {selectedDimension && (
        <div className="mt-5">
          <div className="flex items-center mb-4">
            <div className="bg-blue-500 rounded-full p-2 h-16 w-16 flex items-center justify-center mr-4">
              <span className="text-xl font-bold text-white">{dimensionScore}%</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{selectedDimension.name}</h4>
              <p className="text-sm text-gray-600">{selectedDimension.description}</p>
            </div>
          </div>
          
          <div className="mt-5">
            <h5 className="font-medium text-gray-800 mb-2">Recommendations:</h5>
            <ul className="list-disc pl-5 space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="text-gray-700">{recommendation}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-5">
            <h5 className="font-medium text-gray-800 mb-2">Suggested Resources:</h5>
            <ul className="list-disc pl-5 space-y-2">
              {selectedDimension.resources.map((resource, index) => (
                <li key={index} className="text-gray-700">{resource}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-md">
            <p className="font-medium mb-1">Integrated Leadership Principles:</p>
            <p className="text-sm">
              This assessment integrates Frank Slootman's "Amp It Up" approach that focuses on raising expectations, 
              increasing urgency, and intensifying commitment with Andrew McAfee's "The Geek Way" principles 
              about rapid experimentation, challenging established practices, and leveraging technology.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
