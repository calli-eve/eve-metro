const knex = require('knex')
const config = require('../knexfile.js')

const getDatabaseConnector = () => {
    if (global.cachedConnection) {
        console.log('Cached Connection')
        return global.cachedConnection
    }

    if (!config) {
        throw new Error(`Failed to get knex configuration for env:${process.env.NODE_ENV}`)
    }
    const connection = knex(config)
    global.cachedConnection = connection
    return connection
}

module.exports = getDatabaseConnector()
