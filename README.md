# Leadership Assessment Application

A comprehensive web application for leadership skill assessment and development, featuring a user-friendly interface, visual score representation, and personalized recommendations.

## Features

- **Leadership Assessment**: Self-evaluate leadership skills across multiple dimensions
- **Visual Representation**: View results as an intuitive radar chart
- **Personalized Recommendations**: Receive tailored recommendations based on assessment results
- **Dual Database Support**: Choose between PostgreSQL and IBM DB2 databases
- **Containerized Deployment**: Easy setup with Docker Compose

## Architecture

The application consists of three main components:

1. **Frontend**: React-based UI with a clean, modern design
2. **Backend**: Node.js API server with Express.js
3. **Database**: Support for both PostgreSQL and IBM DB2

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for development)

### Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/leadership-assessment-app.git
   cd leadership-assessment-app
   ```

2. Start the application with Docker Compose:
   ```
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000

### Database Configuration

The application supports both PostgreSQL and IBM DB2 databases. By default, it uses PostgreSQL.

To switch between databases, see the [Database Configuration Guide](DATABASE.md).

## Development

### Frontend Development

```
cd leadership-assessment-app
npm install
npm start
```

### Backend Development

```
cd backend
npm install
npm run dev
```

## API Endpoints

- `GET /api/users`: Retrieve all users
- `GET /api/assessments`: Retrieve all assessments
- `POST /api/assessment`: Create a new assessment
- `GET /api/assessment/:id`: Retrieve a specific assessment

## Documentation

- [Database Configuration](DATABASE.md)
- [Docker Setup](README.docker.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [IBM DB2](https://www.ibm.com/products/db2)
- [Recharts](https://recharts.org/) for the radar chart visualization 