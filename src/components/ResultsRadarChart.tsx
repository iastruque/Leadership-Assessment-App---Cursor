import React, { useRef } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Dimension, UserResults } from '../types';
import { generatePDF } from '../utils/pdfUtils';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ResultsRadarChartProps {
  results: UserResults;
  dimensions: Dimension[];
}

const ResultsRadarChart: React.FC<ResultsRadarChartProps> = ({ results, dimensions }) => {
  const chartRef = useRef<ChartJS<"radar", number[], string>>(null);

  const chartData = {
    labels: dimensions.map(d => d.shortDescription),
    datasets: [
      {
        label: 'Your Score',
        data: dimensions.map(d => results.dimensionScores[d.id]),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 3
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.raw}%`;
          }
        }
      }
    },
  };

  const handleExportPDF = () => {
    if (chartRef.current) {
      // Asegurarse de que el canvas esté completamente renderizado
      setTimeout(() => {
        generatePDF(results, dimensions, chartRef);
      }, 100);
    } else {
      console.error('Chart reference is not available');
      alert('Could not generate PDF because the chart is not ready. Please try again in a moment.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 radar-chart-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Leadership Dimensions Assessment</h3>
        <button 
          onClick={handleExportPDF}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
          Export PDF
        </button>
      </div>
      <div className="h-96" style={{ maxHeight: '500px' }}>
        <Radar ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ResultsRadarChart;