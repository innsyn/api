select
	  f.id as file_id
    , f.source_id
    , s.name as source_name
    , s.email as source_email
    , f.name as filename
    , f.s3_url
    , f.s3_key
from file f
join source s on s.id = f.source_id
where 1 = 1
and f.id in (
	select j.file_id from journal j
    where j.id in (
    	select ja.id from journal_anonymous ja
        where ja.id > $1
        and ja.remarks <> ''
    )
)

