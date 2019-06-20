exports.up = function(knex, Promise) {
  return knex.schema.createTable('country', table => {
    table.increments('id').primary();
    table.string('name', 100).notNull();
    table.specificType('country_code', 'char(2)').notNull();
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('country');
};
