#!/bin/bash

# Script para construir y ejecutar la aplicación con Docker
# con soporte mejorado para generación de PDF

echo "===== Construyendo imagen de Docker con soporte para PDF ====="

# Construir la imagen de Docker
docker build -t leadership-assessment-app .

# Verificar si la construcción fue exitosa
if [ $? -eq 0 ]; then
  echo ""
  echo "===== Construcción exitosa ====="
  echo ""
  echo "Para ejecutar la aplicación, utiliza uno de los siguientes comandos:"
  echo ""
  echo "1. Docker directamente:"
  echo "   docker run -d -p 80:80 --name leadership-app leadership-assessment-app"
  echo ""
  echo "2. Docker Compose (recomendado):"
  echo "   docker-compose up -d"
  echo ""
  echo "Después, navega a http://localhost en tu navegador."
  echo ""
  echo "NOTA: Para probar la exportación a PDF, sigue estos pasos:"
  echo "1. Completa el cuestionario de evaluación"
  echo "2. En la página de resultados, haz clic en 'Export PDF'"
  echo "3. Si tienes problemas, verifica la consola del navegador para mensajes de error"
  echo ""
else
  echo ""
  echo "===== Error en la construcción ====="
  echo "Revisa los mensajes de error anteriores para solucionar el problema."
  echo ""
fi 