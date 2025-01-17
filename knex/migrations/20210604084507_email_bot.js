exports.up = function (knex) {
    return knex.schema.createTable('email_bot', function (table) {
        table.string('status')
        table.bigint('character_id').primary()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.string('secret', 10000).notNullable()
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('email_bot')
}
