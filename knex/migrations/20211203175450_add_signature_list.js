exports.up = function (knex) {
    return knex.schema.createTable('trig_signatures', function (table) {
        table.increments('id')
        table.integer('systemId').notNullable()
        table.string('sig').notNullable()
        table.string('type').notNullable()
        table.string('name').notNullable()
        table.timestamp('createdTime').defaultTo(knex.fn.now())
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('trig_signatures')
}
