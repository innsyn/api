exports.up = function(knex, Promise) {
  return knex.schema.createTable('name', table => {
    table.increments('id');
    table.string('name', 200);
    table
      .boolean('is_common_word')
      .default(false)
      .notNull();
  });
};

exports.down = function(knex, Promise) {};
