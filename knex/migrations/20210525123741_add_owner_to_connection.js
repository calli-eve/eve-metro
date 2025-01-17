exports.up = function (knex) {
    return knex.schema.table('trig_connections', function (table) {
        table.integer('creator').notNull()
    })
}

exports.down = function (knex) {
    return knex.schema.table('trig_connections', function (table) {
        table.dropColumn('creator')
    })
}
