// Update with your config settings.
require('dotenv').config({ path: '.env' })

module.exports = {
    client: 'pg',
    connection: {
        host: process.env.POSTGRES_HOST,
        database: process.env.EVE_METRO_DATABASE,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        directory: __dirname + '/knex/migrations'
    },
    seeds: {
        directory: __dirname + '/knex/seeds'
    }
}
