require('dotenv').config();

module.exports = {
    client: 'pg',
    connection: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'evemetro_test'
    },
    migrations: {
        directory: './knex/migrations'
    }
}; 