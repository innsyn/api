exports.up = function(knex, Promise) {
  return knex.schema.createTable('list', table => {
    table.increments('id').primary();
    table.string('name', 100).notNull();
    table.string('description', 500);
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
  });
};

exports.down = function(knex, Promise) {};
