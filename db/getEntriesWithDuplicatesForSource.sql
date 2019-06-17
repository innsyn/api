select
	j1.id, j1.case_number, j1.source_id
from
	journal j1
join
	journal j2 on j1.case_number = j2.case_number
where 1=1
and j1.id <> j2.id
and j1.case_title = j2.case_title
and j1.source_id = j2.source_id
and j1.sender = j2.sender
and j1.receiver = j2.receiver
and j1.document_type = j2.document_type
and j1.document_date = j2.document_date
and j1.recorded_date = j2.recorded_date
and j1.document_title = j2.document_title
and j1.case_responsible = j2.case_responsible
and j1.case_officer = j2.case_officer
and j1.legal_paragraph = j2.legal_paragraph
and j1.source_id = $1
and j2.source_id = $1
order by j1.source_id,  j1.case_number, j1.id;
