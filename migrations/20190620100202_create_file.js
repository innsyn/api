exports.up = function(knex, Promise) {
  return knex.schema.createTable('file', table => {
    table.increments('id');
    table
      .integer('source_id')
      .notNull()
      .references('source.id');
    table.date('date_imported');
    table.string('name', 100).notNull();
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
    table.string('parser_name', 100);
    table.string('status', 20).notNull();
    table.string('s3_url', 300);
    table.string('s3_key', 300);
    table
      .integer('retries_remaining')
      .notNull()
      .defaultTo(1);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('file');
};
