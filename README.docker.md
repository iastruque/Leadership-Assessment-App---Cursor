# Contenerización de Leadership Assessment App

Este documento proporciona instrucciones para ejecutar la aplicación Leadership Assessment utilizando Docker.

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (Opcional, pero recomendado)

## Ejecutar la aplicación con Docker

### Opción 1: Usando el script de construcción (Recomendado)

1. Ejecuta el script de construcción que incluye soporte mejorado para PDF:
   ```bash
   ./docker-build.sh
   ```

2. Después, ejecuta el contenedor:
   ```bash
   docker run -d -p 80:80 --name leadership-app leadership-assessment-app
   ```
   
   O con Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Accede a la aplicación:
   ```
   http://localhost
   ```

### Opción 2: Usando Docker directamente

1. Construir la imagen:
   ```bash
   docker build -t leadership-assessment-app .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -d -p 80:80 --name leadership-app leadership-assessment-app
   ```

3. Acceder a la aplicación:
   ```
   http://localhost
   ```

### Opción 3: Usando Docker Compose

1. Ejecutar la aplicación:
   ```bash
   docker-compose up -d
   ```

2. Acceder a la aplicación:
   ```
   http://localhost
   ```

## Exportación de PDF

La aplicación permite exportar los resultados como PDF. Para que esto funcione correctamente en el contenedor Docker:

1. El Dockerfile incluye las dependencias necesarias para el manejo de canvas y generación de PDF
2. La exportación de PDF ahora está optimizada para entornos contenerizados
3. Si experimentas problemas con la exportación, sigue estos pasos:
   - Verifica la consola del navegador para mensajes de error
   - Asegúrate de que tu navegador permita descargas de archivos
   - Si persisten los problemas, utiliza el botón dedicado "Export PDF" en el componente del gráfico radar

## Detener la aplicación

### Si usas Docker directamente:
```bash
docker stop leadership-app
docker rm leadership-app
```

### Si usas Docker Compose:
```bash
docker-compose down
```

## Desarrollo con Docker

Para desarrollo local, puedes montar volúmenes para que los cambios se reflejen inmediatamente:

1. Descomenta las líneas de volúmenes en el archivo `docker-compose.yml`:
   ```yaml
   volumes:
     - ./src:/app/src
     - ./public:/app/public
   ```

2. Cambia el entorno a desarrollo:
   ```yaml
   environment:
     - NODE_ENV=development
   ```

3. Ejecuta con Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Integración con IBM Db2 (Preparación futura)

El archivo `docker-compose.yml` incluye configuración comentada para integrar un backend con IBM Db2. Para activar esta configuración:

1. Implementa el backend según las instrucciones (crear directorio `/backend` con todo lo necesario)
2. Descomenta las secciones correspondientes en `docker-compose.yml`
3. Ejecuta:
   ```bash
   docker-compose up -d
   ```

## Información adicional

- La aplicación utiliza Nginx como servidor web en producción
- Se incluye una configuración optimizada de Nginx para aplicaciones SPA (Single Page Application)
- El contenedor está optimizado para producción utilizando un enfoque multi-etapa
- La generación de PDF utiliza jsPDF y Chart.js, con ajustes específicos para entornos Docker 