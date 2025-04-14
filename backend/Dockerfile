FROM node:18-alpine

WORKDIR /app

# Instalar dependencias necesarias para compilar TypeScript
RUN apk add --no-cache python3 make g++

# Copiar archivos de definición de paquetes
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente y configuración de TypeScript
COPY tsconfig.json ./
COPY src ./src

# Exponer puerto
EXPOSE 5000

# Usar ts-node para ejecutar directamente
CMD ["npx", "ts-node", "src/index.ts"] 