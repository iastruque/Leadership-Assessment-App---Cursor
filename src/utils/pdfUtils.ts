import { jsPDF } from 'jspdf';
import { Dimension, UserResults } from '../types';
import { getRecommendations } from './recommendationUtils';
import { Chart } from 'chart.js';

export const generatePDF = (
  results: UserResults,
  dimensions: Dimension[],
  chartRef: React.RefObject<Chart<"radar", number[], string>>
): void => {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Integrated Leadership Assessment Results', 105, 20, { align: 'center' });

    // Add date
    const date = new Date(results.date);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Assessment Date: ${date.toLocaleDateString()}`, 105, 30, { align: 'center' });

    // Add radar chart
    if (chartRef.current) {
      try {
        const chartCanvas = chartRef.current.canvas;
        const chartImage = chartCanvas.toDataURL('image/png', 1.0);
        doc.addImage(chartImage, 'PNG', 20, 40, 170, 85);
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
      }
    }

    // Add scores summary
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Dimension Scores', 105, 140, { align: 'center' });

    // Calculate average score
    const scores = Object.values(results.dimensionScores);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
      : 0;

    doc.setFontSize(12);
    doc.text(`Average Score: ${averageScore}%`, 105, 150, { align: 'center' });

    // Add dimension scores
    let yPosition = 160;
    dimensions.forEach(dimension => {
      const score = results.dimensionScores[dimension.id] || 0;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${dimension.name}`, 20, yPosition, { maxWidth: 120 });
      doc.text(`${score}%`, 170, yPosition, { align: 'right' });
      
      // Add score bar
      doc.setFillColor(220, 220, 220);
      doc.rect(20, yPosition + 3, 100, 5, 'F');
      
      // The width of the colored part of the bar should be proportional to the score percentage
      const barWidth = score;
      doc.setFillColor(54, 162, 235);
      if (barWidth > 0) {
        doc.rect(20, yPosition + 3, barWidth, 5, 'F');
      }
      
      yPosition += 15;
    });

    // Add recommendations for lowest scoring dimension
    const lowestScoreDimension = Object.entries(results.dimensionScores)
      .reduce((lowest, [dimId, score]) => {
        if (lowest.score === null || score < lowest.score) {
          return { id: dimId, score };
        }
        return lowest;
      }, { id: null as string | null, score: null as number | null });

    if (lowestScoreDimension.id) {
      const dimension = dimensions.find(d => d.id === lowestScoreDimension.id);
      
      if (dimension) {
        // Add a page break if we're running out of space
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Personalized Recommendations', 105, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        doc.setFontSize(14);
        doc.text(`Focus Area: ${dimension.name}`, 20, yPosition, { maxWidth: 170 });
        
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.text(dimension.description, 20, yPosition, { maxWidth: 170 });
        
        yPosition += 15;
        
        // Add recommendations
        const recommendations = getRecommendations(dimension.id, lowestScoreDimension.score || 0);
        
        doc.setFontSize(12);
        doc.text('Recommendations:', 20, yPosition);
        
        yPosition += 8;
        
        doc.setFontSize(10);
        recommendations.forEach(recommendation => {
          // Add a page break if we're running out of space
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.text(`• ${recommendation}`, 25, yPosition, { maxWidth: 165 });
          yPosition += 10;
        });
      }
    }

    // Add footer with integrated leadership principles
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerText = 'This assessment integrates Frank Slootman\'s "Amp It Up" approach with Andrew McAfee\'s "The Geek Way" principles.';
    doc.text(footerText, 105, 285, { align: 'center', maxWidth: 170 });

    // Save the PDF
    doc.save('leadership-assessment-results.pdf');
    
    console.log('PDF generated and saved successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('There was an error generating the PDF. Please try again later.');
  }
};
