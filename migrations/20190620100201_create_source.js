exports.up = function(knex, Promise) {
  return knex.schema.createTable('source', table => {
    table.increments('id').primary();
    table.integer('project_id').references('project.id');
    table.integer('list_id').references('list.id');
    table.string('source_system', 100).notNull();
    table.string('parser_name', 100);
    table.string('name', 100).notNull();
    table.string('email', 150).notNull();
    table.string('description', 500);
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
    table
      .boolean('is_visible')
      .default(true)
      .notNull();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('counter');
};
