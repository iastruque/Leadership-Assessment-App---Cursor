const winston = require('winston');
const path = require('path');

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/db-selector.log') 
    })
  ]
});

/**
 * Selecciona la implementación de base de datos a utilizar
 * @returns {Object} Implementación de base de datos
 */
function selectDatabase() {
  logger.info('Using PostgreSQL database');
  return require('./postgres');
}

// Exportar la implementación de base de datos seleccionada
module.exports = selectDatabase(); 