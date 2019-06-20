exports.up = function(knex, Promise) {
  return knex.schema.createTable('project', table => {
    table.increments('id').primary();
    table.string('name', 100).notNull();
    table.string('description', 500);
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
    table.string('source_regex', 500);
    table
      .boolean('is_visible')
      .default(true)
      .notNull();
    table.integer('country_id').references('country.id');
  });
};

exports.down = function(knex, Promise) {};
