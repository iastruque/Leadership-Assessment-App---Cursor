# Database Configuration Guide

This application supports two database systems: PostgreSQL and IBM DB2. By default, the application uses PostgreSQL, but you can easily switch to DB2 when needed.

## Configuration

### Environment Variables

The database selection is controlled by the `DB_TYPE` environment variable in the `docker-compose.yml` file:

```yaml
environment:
  - DB_TYPE=postgres  # Can be 'postgres' or 'db2'
```

### Database Connection Details

#### PostgreSQL
- Host: postgres
- Port: 5432
- Database: leadership
- User: postgres
- Password: postgres

#### DB2
- Host: db2
- Port: 50000
- Database: leadership
- Schema: db2inst1
- Username: db2inst1
- Password: db2inst1

## How it Works

The application uses a database selector module (`backend/src/config/db-selector.js`) to dynamically switch between database implementations at runtime. This module:

1. Checks the `DB_TYPE` environment variable to determine which database to use
2. Loads the appropriate database implementation (PostgreSQL or DB2)
3. Exports a unified interface for database operations (`initializeDatabase` and `executeQuery`)

## Switching Databases

To switch from PostgreSQL to DB2:

1. Edit the `docker-compose.yml` file
2. Change the `DB_TYPE` environment variable from `postgres` to `db2`
3. Restart the containers with `docker-compose down && docker-compose up -d`

Example:
```yaml
environment:
  - DB_TYPE=db2  # Change from 'postgres' to 'db2'
```

To switch back to PostgreSQL, set `DB_TYPE=postgres` and restart the containers.

## Implementation Details

### Database Selector Logic

The database selector provides a unified interface regardless of which database is being used:

```javascript
// Select the database implementation
function selectDatabase() {
  const dbType = process.env.DB_TYPE || 'postgres';
  logger.info(`Using database type: ${dbType}`);

  try {
    if (dbType === 'db2') {
      // Try to load the DB2 implementation
      return require('./db2-safe');
    } else {
      // Default to PostgreSQL
      return require('./postgres');
    }
  } catch (error) {
    logger.error(`Error loading database implementation: ${error.message}`);
    // Fallback to PostgreSQL if DB2 fails to load
    return require('./postgres');
  }
}
```

### Database Schema

Both database implementations create the same tables with identical schema:

- `users`: Stores user information
- `assessments`: Stores assessment data
- `dimension_scores`: Stores scores for each leadership dimension
- `question_answers`: Stores individual question responses

## Troubleshooting

### Database Connection Issues

If you encounter connection issues:

1. Check the database container status: `docker-compose ps`
2. View the logs for each database container:
   - PostgreSQL: `docker-compose logs postgres`
   - DB2: `docker-compose logs db2`
3. Verify that the environment variables match the database connection details

### Database Initialization

The application automatically initializes the database tables on startup. If you need to reset the database:

1. Remove the database volume: `docker-compose down -v`
2. Restart the containers: `docker-compose up -d`

This will recreate the database containers with fresh data volumes. 