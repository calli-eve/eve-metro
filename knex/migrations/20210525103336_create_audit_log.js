exports.up = function (knex) {
    return knex.schema.createTable('audit_log', function (table) {
        table.timestamp('timestamp').defaultTo(knex.fn.now())
        table.string('type').notNullable()
        table.integer('user_id').notNullable()
        table.string('action').notNullable()
        table.jsonb('meta').notNullable()
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('audit_log')
}
