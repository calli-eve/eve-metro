exports.up = function (knex) {
    return knex.schema.createTable('wallet_watcher', function (table) {
        table.string('status')
        table.bigint('character_id').primary()
        table.string('corp_id').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.string('secret', 10000).notNullable()
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('wallet_watcher')
}
