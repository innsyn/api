CREATE OR REPLACE FUNCTION fix_journal_dates()
RETURNS void AS $$
DECLARE
    records_to_fix bigint[];
    fixed_dates varchar[];
BEGIN
    records_to_fix := ARRAY(
        select id
        from journal
        where document_date > CURRENT_DATE
        and recorded_date < CURRENT_DATE
        and recorded_date > '1900-01-01'
    );

    -- Copy year from journal_date to document_date
    update journal
    set document_date = to_date(replace(format('%s-%2s-%2s', date_part('year',recorded_date), date_part('month',document_date), date_part('day',document_date)), ' ', '0'),'YYYY-MM-DD')
    where id = any (records_to_fix);

    -- subtract 1 year from document_date when it is later than journal date (after the previous update)
    update journal
    set document_date = to_date(replace(format('%s-%2s-%2s', date_part('year',recorded_date)-1, date_part('month',document_date), date_part('day',document_date)), ' ', '0'),'YYYY-MM-DD')
    where id = any (records_to_fix)
    and document_date > recorded_date;

    -- fixed_dates := ARRAY (select replace(format('%s-%2s-%2s', date_part('year',recorded_date), date_part('month',document_date), date_part('day',document_date)), ' ', '0')
    -- from journal  where id = any(records_to_fix));
    -- raise notice 'Value: %', fixed_dates;
END; $$ LANGUAGE plpgsql;
