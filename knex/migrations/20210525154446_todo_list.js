exports.up = function (knex) {
    return knex.schema.createTable('todo_list', function (table) {
        table.increments('id')
        table.integer('entity_id').notNullable()
        table.string('type')
        table.string('level')
        table.string('action').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('todo_list')
}
