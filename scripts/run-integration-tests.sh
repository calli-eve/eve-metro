#!/bin/bash

# Set environment to test
export NODE_ENV=test
export POSTGRES_DB=${POSTGRES_DB:-evemetro_test}
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
export POSTGRES_HOST=${POSTGRES_HOST:-localhost}
export POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Create test database if it doesn't exist
echo "Creating test database if it doesn't exist..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $POSTGRES_DB"

# Run migrations
echo "Running migrations..."
npm run knex-migrate

# Run integration tests
echo "Running integration tests..."
npm run test:integration -- --forceExit --detectOpenHandles 