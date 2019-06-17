SELECT
    s.id AS source_id
  , s.name AS source_name
  , s.description AS source_description
  , s.email AS source_email

  , s.project_id AS project_id
  , s.list_id AS list_id
  , s.description AS source_description

  , s.registered_date AS source_date

FROM
  source s

ORDER BY
    project_id ASC
  , source_id ASC
  , list_id ASC

LIMIT
  $1
;
