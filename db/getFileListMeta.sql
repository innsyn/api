SELECT
    f.id AS file_id

  , f.name AS file_name
  , i.parser_name AS parser_name

  , i.project_id AS project_id
  , i.source_id AS source_id

  -- included as extra check, should reject if set
  , f.date_imported AS date_imported

FROM
  file f

JOIN
  importer i on f.importer_id = i.id

WHERE
  f.date_imported IS NULL
  AND
  f.importer_id = $1

ORDER BY
  f.date_imported_documentcloud ASC
;
