import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Dimension, UserResults } from '../types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ResultsRadarChartProps {
  results: UserResults;
  dimensions: Dimension[];
  onChartReady?: (chart: ChartJS<"radar", number[], string> | null) => void;
}

const ResultsRadarChart: React.FC<ResultsRadarChartProps> = ({ results, dimensions, onChartReady }) => {
  const chartRef = useRef<ChartJS<"radar", number[], string>>(null);

  useEffect(() => {
    // Notificar al componente padre cuando el gráfico esté listo
    if (onChartReady && chartRef.current) {
      onChartReady(chartRef.current);
    }
  }, [chartRef.current, onChartReady]);

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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 radar-chart-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Leadership Dimensions Assessment</h3>
      </div>
      <div className="h-96" style={{ maxHeight: '500px' }}>
        <Radar ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ResultsRadarChart;