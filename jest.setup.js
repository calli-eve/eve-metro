// Increase timeout for integration tests
jest.setTimeout(30000);

const { knex, cleanup } = require('./knex/knex');

// Run migrations before all tests
beforeAll(async () => {
    try {
        console.log('Running migrations...');
        await knex.migrate.latest();
        console.log('Migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        await cleanup();
        throw error;
    }
});

// Clean up database after each test
afterEach(async () => {
    try {
        console.log('Cleaning up test data...');
        await knex('payments_log').del();
        await knex('allowed_entity').del();
        console.log('Test data cleanup completed');
    } catch (error) {
        console.error('Error during test cleanup:', error);
        throw error;
    }
});

// Clean up and close connection after all tests
afterAll(async () => {
    console.log('Running final cleanup...');
    try {
        await cleanup();
        console.log('Final cleanup completed');
    } catch (error) {
        console.error('Error during final cleanup:', error);
        process.exit(1); // Force exit if cleanup fails
    }
}); 