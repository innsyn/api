exports.up = function(knex, Promise) {
  return knex.schema.createTable('journal', table => {
    table.increments('id');
    table.string('case_number', 50).notNull();
    table.string('case_title', 250).notNull();
    table.string('document_title', 250).notNull();
    table.date('document_date').notNull();
    table.date('recorded_date').notNull();
    table.integer('project_id').references('project.id');
    table.integer('source_id').references('source.id');
    table.integer('file_id').references('file.id');
    table.string('document_type', 5);
    table.string('classification', 20);
    table.string('legal_paragraph', 100);
    table.string('sender', 250);
    table.string('receiver', 250);
    table.string('case_responsible', 250);
    table.string('case_officer', 250);
    table
      .date('registered_date')
      .defaultTo(knex.raw('now()'))
      .notNull();
    table.specificType('search_column', 'tsvector');
    table.string('original_document_link', 250);
    table.string('document_link', 250);
    table.string('unit', 100);
  });
};

exports.down = function(knex, Promise) {};
