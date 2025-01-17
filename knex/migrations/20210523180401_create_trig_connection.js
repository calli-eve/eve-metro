exports.up = function (knex) {
    return knex.schema.createTable('trig_connections', function (table) {
        table.increments('id')
        table.string('comment')
        table.integer('pochvenSystemId').notNullable()
        table.integer('externalSystemId').notNullable()
        table.string('pochvenSystemName').notNullable()
        table.string('externalSystemName').notNullable()
        table.string('pochvenWormholeType').notNullable()
        table.string('externalWormholeType').notNullable()
        table.string('pochvenSignature').notNullable()
        table.string('externalSignature').notNullable()
        table.boolean('massCritical').defaultTo(false)
        table.boolean('timeCritical').defaultTo(false)
        table.timestamp('timeCriticalTime')
        table.timestamp('createdTime').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('trig_connections')
}
