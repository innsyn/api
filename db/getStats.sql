select
    s.id
  , s.source_system
  , s.name
  , (select count(f.id) from file f where source_id = s.id) as file_count
  , (select count(f_inner.id) from file f_inner where (select count(id) from journal where file_id = f_inner.id) > 0 and  source_id = s.id) as imported_file_count
  , (select count(f_inner.id) from file f_inner  where (select count(id) from journal where file_id = f_inner.id) = 0 and  source_id = s.id) as not_imported_file_count
  , (select count(id) from journal where source_id = s.id) as imported_entries_count
  from source s
  order by s.project_id, s.name;
