const { Client } = require('pg')
const dbName = process.env.EVE_METRO_DATABASE

const createDatabase = async (dbName) => {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    })

    try {
        await client.connect()
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}';`)
        if (res.rows.length === 0) {
            await client.query(`CREATE DATABASE ${dbName}`)
            console.log(`Database "${dbName}" created successfully!`)
        } else {
            console.log(`Database "${dbName}" already exists.`)
        }
    } catch (error) {
        console.error('Error creating database:', error)
    } finally {
        await client.end()
    }
}

const main = async () => {
    await createDatabase(dbName)
}

main().catch((error) => {
    console.error('Error:', error)
    process.exit(1)
})
