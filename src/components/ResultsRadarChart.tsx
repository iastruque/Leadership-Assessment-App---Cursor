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
      generatePDF(results, dimensions, chartRef);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 radar-chart-container">
      <div className="h-96" style={{ maxHeight: '500px' }}>
        <Radar ref={chartRef} data={chartData} options={chartOptions} onClick={handleExportPDF} />
      </div>
    </div>
  );
};

export default ResultsRadarChart;