SELECT
    i.id AS importer_id
  , i.name AS importer_name
  , i.description AS importer_description

  , i.project_id AS project_id
  , i.source_id AS source_id
  , i.source AS importer_source

  , i.source_system AS importer_source_system
  , i.parser_name AS importer_parser_name

  , i.registered_date AS importer_date

FROM
  importer i

WHERE
  id = $1
;
