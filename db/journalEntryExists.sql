select count(*)
from journal
where case_number = $1 and source_id = $2;
