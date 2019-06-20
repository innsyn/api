exports.up = function(knex, Promise) {
  return knex.schema.createTable('journal_anonymous', table => {
    table.increments('id');
    table.json('data').notNull();
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
    table.string('remarks', 300);
  });
};

exports.down = function(knex, Promise) {};
