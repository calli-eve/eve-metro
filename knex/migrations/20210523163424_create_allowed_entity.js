exports.up = function (knex) {
    return knex.schema.createTable('allowed_entity', function (table) {
        table.integer('entity_id').notNullable()
        table.string('type').notNullable()
        table.string('level').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('allowed_entity')
}
