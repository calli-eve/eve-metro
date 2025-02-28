const environment = process.env.NODE_ENV || 'development';
const config = environment === 'test' ? require('../knexfile.test') : require('../knexfile');

const getDatabaseConnector = () => {
    if (global.cachedConnection) {
        console.log('Using cached connection')
        return global.cachedConnection
    }

    if (!config) {
        throw new Error(`Failed to get knex configuration for env:${process.env.NODE_ENV}`)
    }
    const connection = require('knex')(config)
    global.cachedConnection = connection
    return connection
}

// Add cleanup method for tests
const cleanup = async () => {
    console.log('Cleaning up database connections...');
    if (global.cachedConnection) {
        try {
            console.log('Destroying cached connection...');
            await global.cachedConnection.destroy();
            console.log('Connection destroyed successfully');
            global.cachedConnection = null;
        } catch (error) {
            console.error('Error destroying connection:', error);
            throw error;
        }
    } else {
        console.log('No cached connection to clean up');
    }
}

// Create a single instance
const knexInstance = getDatabaseConnector();

module.exports = {
    knex: knexInstance,
    cleanup
}
