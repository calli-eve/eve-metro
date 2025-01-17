exports.up = function (knex) {
    return knex.schema.table('allowed_entity', function (table) {
        table.timestamp('valid_untill')
    })
}

exports.down = function (knex) {
    return knex.schema.table('allowed_entity', function (table) {
        table.dropColumn('valid_untill')
    })
}
