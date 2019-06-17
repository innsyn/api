SELECT
    p.id AS project_id
  , p.name AS project_name
  , p.documentcloud_project_id
  , p.description AS project_description
  , s.id AS source_id
  , s.name AS source_name
  , s.description AS source_description
  , s.is_visible AS source_is_visible
  , s.email AS source_email
  , l.id AS list_id
  , l.name AS list_name
  , l.description AS list_description
FROM
  project p
 JOIN source s on p.id = s.project_id
 LEFT OUTER JOIN
  list l ON l.id = s.list_id
WHERE p.is_visible <> 'f'
ORDER BY project_name ASC, list_name ASC, source_name ASC;
