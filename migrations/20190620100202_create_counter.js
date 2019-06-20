exports.up = function(knex, Promise) {
  return knex.schema.createTable('counter', table => {
    table.increments('id');
    table.integer('project_id').references('project.id');
    table.integer('source_id').references('source.id');
    table.integer('count').notNull();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('counter');
};
