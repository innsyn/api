--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.10
-- Dumped by pg_dump version 11.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track execution statistics of all SQL statements executed';


--
-- Name: fix_journal_dates(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fix_journal_dates() RETURNS void
    LANGUAGE plpgsql
    AS $$
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
END; $$;


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: configuration; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE configuration (
    id integer NOT NULL,
    source_id integer,
    property character varying(100) NOT NULL,
    value character varying(100) NOT NULL,
    last_updated date NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: configuration_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE configuration_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE configuration_id_seq OWNED BY configuration.id;


--
-- Name: counter; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE counter (
    id integer NOT NULL,
    project_id integer,
    source_id integer,
    count integer NOT NULL
);


--
-- Name: counter_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE counter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: counter_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE counter_id_seq OWNED BY counter.id;


--
-- Name: counters; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE counters (
    project_id integer,
    source_id integer,
    count integer NOT NULL
);


--
-- Name: country; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE country (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    country_code character(2) NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: country_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE country_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: country_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE country_id_seq OWNED BY country.id;


--
-- Name: document; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE document (
    id integer NOT NULL,
    journal_id integer NOT NULL,
    external_url character varying(500) NOT NULL,
    imported_url character varying(500),
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: document_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE document_id_seq OWNED BY document.id;


--
-- Name: file; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE file (
    id integer NOT NULL,
    source_id integer NOT NULL,
    date_imported date,
    date_imported_documentcloud date,
    name character varying(100) NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    parser_name character varying(100),
    status character varying(20) DEFAULT 'New'::character varying NOT NULL,
    s3_url character varying(300),
    s3_key character varying(300)
);


--
-- Name: file_backup; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE file_backup (
    id integer NOT NULL,
    source_id integer,
    date_imported date,
    date_imported_documentcloud date,
    name character varying(100),
    parser_name character varying(100),
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: file_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE file_id_seq OWNED BY file.id;


--
-- Name: file_log; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE file_log (
    id integer NOT NULL,
    file_id integer NOT NULL,
    message character varying(200) NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: file_log_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE file_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_log_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE file_log_id_seq OWNED BY file_log.id;


--
-- Name: file_testing; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE file_testing (
    id bigint NOT NULL,
    download_url character varying(500) NOT NULL,
    parser_name character varying(100),
    original_file_path character varying(500),
    status character varying(20) NOT NULL,
    registered_date date NOT NULL,
    source_id integer NOT NULL,
    parsed_file_path character varying(500)
);


--
-- Name: journal; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal (
    id integer NOT NULL,
    case_number character varying(50) NOT NULL,
    case_title character varying(250) NOT NULL,
    document_title character varying(250) NOT NULL,
    document_date date NOT NULL,
    recorded_date date NOT NULL,
    project_id integer NOT NULL,
    source_id integer NOT NULL,
    file_id integer,
    document_type character varying(5),
    classification character varying(20),
    legal_paragraph character varying(100),
    sender character varying(250),
    receiver character varying(250),
    case_responsible character varying(250),
    case_officer character varying(250),
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    search_column tsvector,
    original_document_link character varying(250),
    document_link character varying(250),
    unit character varying(100)
)
WITH (autovacuum_vacuum_threshold='10000', autovacuum_vacuum_scale_factor='0.0');


--
-- Name: journal_anonymous; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_anonymous (
    id integer NOT NULL,
    data json NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    remarks character varying(300)
);


--
-- Name: journal_backup; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_backup (
    id integer,
    case_number character varying(50),
    case_title character varying(250),
    document_title character varying(250),
    document_date date,
    recorded_date date,
    project_id integer,
    source_id integer,
    file_id integer,
    document_type character varying(5),
    classification character varying(20),
    legal_paragraph character varying(100),
    sender character varying(250),
    receiver character varying(250),
    case_responsible character varying(250),
    case_officer character varying(250),
    registered_date date,
    search_column tsvector
);


--
-- Name: journal_backup2; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_backup2 (
    id integer,
    case_number character varying(50),
    case_title character varying(250),
    document_title character varying(250),
    document_date date,
    recorded_date date,
    project_id integer,
    source_id integer,
    file_id integer,
    document_type character varying(5),
    classification character varying(20),
    legal_paragraph character varying(100),
    sender character varying(250),
    receiver character varying(250),
    case_responsible character varying(250),
    case_officer character varying(250),
    registered_date date,
    search_column tsvector,
    original_document_link character varying(250),
    document_link character varying(250),
    unit character varying(100)
);


--
-- Name: journal_bys; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_bys (
    id integer,
    case_number character varying(50),
    case_title character varying(250),
    document_title character varying(250),
    document_date date,
    recorded_date date,
    project_id integer,
    source_id integer,
    file_id integer,
    document_type character varying(5),
    classification character varying(20),
    legal_paragraph character varying(100),
    sender character varying(250),
    receiver character varying(250),
    case_responsible character varying(250),
    case_officer character varying(250),
    registered_date date,
    search_column tsvector
);


--
-- Name: journal_comment; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_comment (
    id integer NOT NULL,
    journal_id integer NOT NULL,
    comment character varying(1000) NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    handled_date date,
    handled_comment character varying(1000)
);


--
-- Name: journal_comment_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE journal_comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE journal_comment_id_seq OWNED BY journal_comment.id;


--
-- Name: journal_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE journal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE journal_id_seq OWNED BY journal.id;


--
-- Name: journal_name; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_name (
    journal_id integer NOT NULL,
    name_id integer NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    anonymize boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT '-1'::integer NOT NULL
);


--
-- Name: journal_name_check; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_name_check (
    journal_id integer NOT NULL,
    last_updated date DEFAULT ('now'::text)::date NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: journal_old_parser_stortinget; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_old_parser_stortinget (
    journal_id integer
);


--
-- Name: journal_pbe; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE journal_pbe (
    id integer,
    case_number character varying(50),
    case_title character varying(250),
    document_title character varying(250),
    document_date date,
    recorded_date date,
    project_id integer,
    source_id integer,
    file_id integer,
    document_type character varying(5),
    classification character varying(20),
    legal_paragraph character varying(100),
    sender character varying(250),
    receiver character varying(250),
    case_responsible character varying(250),
    case_officer character varying(250),
    registered_date date,
    search_column tsvector
);


--
-- Name: list; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE list (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: list_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE list_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: list_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE list_id_seq OWNED BY list.id;


--
-- Name: name; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE name (
    name character varying(200),
    id integer NOT NULL,
    is_common_word boolean DEFAULT false NOT NULL
);


--
-- Name: name_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE name_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: name_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE name_id_seq OWNED BY name.id;


--
-- Name: person_name; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE person_name (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    country_id integer NOT NULL,
    registered_date date DEFAULT ('now'::text)::date NOT NULL
);


--
-- Name: person_name_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE person_name_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: person_name_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE person_name_id_seq OWNED BY person_name.id;


--
-- Name: project; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE project (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    documentcloud_project_id character varying(100) NOT NULL,
    description character varying(500),
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    source_regex character varying(500),
    is_visible boolean DEFAULT true NOT NULL,
    documentcloud_project_id_numeric integer,
    dropbox_path character varying(200),
    country_id integer DEFAULT 1 NOT NULL
);


--
-- Name: project_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE project_id_seq OWNED BY project.id;


--
-- Name: search_result_test; Type: VIEW; Schema: innsyn; Owner: -
--

CREATE VIEW search_result_test AS
 SELECT j.id,
    j.case_number,
    j.case_title,
    j.document_title,
    j.document_date,
    j.recorded_date,
    j.project_id,
    j.source_id,
    j.document_type,
    j.classification,
    j.legal_paragraph,
    j.sender,
    j.receiver,
    j.case_responsible,
    j.case_officer,
    j.registered_date,
    j.original_document_link,
    j.document_link,
    j.unit,
    j.search_column,
    ja.data
   FROM (journal j
     JOIN journal_anonymous ja ON ((j.id = ja.id)));


--
-- Name: source; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE source (
    id integer NOT NULL,
    project_id integer NOT NULL,
    list_id integer,
    source_system character varying(100) DEFAULT ''::character varying NOT NULL,
    parser_name character varying(100),
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    description character varying(500),
    registered_date date DEFAULT ('now'::text)::date NOT NULL,
    is_visible boolean DEFAULT true NOT NULL
);


--
-- Name: source_id_seq; Type: SEQUENCE; Schema: innsyn; Owner: -
--

CREATE SEQUENCE source_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: source_id_seq; Type: SEQUENCE OWNED BY; Schema: innsyn; Owner: -
--

ALTER SEQUENCE source_id_seq OWNED BY source.id;


--
-- Name: task; Type: TABLE; Schema: innsyn; Owner: -
--

CREATE TABLE task (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    source_id integer,
    project_id integer,
    command character varying(500) NOT NULL,
    "interval" integer NOT NULL,
    last_run timestamp(6) with time zone,
    registered_date date NOT NULL,
    status character varying,
    is_active boolean
);


--
-- Name: active_locks; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_locks AS
 SELECT t.schemaname,
    t.relname,
    l.locktype,
    l.page,
    l.virtualtransaction,
    l.pid,
    l.mode,
    l.granted
   FROM (pg_locks l
     JOIN pg_stat_all_tables t ON ((l.relation = t.relid)))
  WHERE ((t.schemaname <> 'pg_toast'::name) AND (t.schemaname <> 'pg_catalog'::name))
  ORDER BY t.schemaname, t.relname;


--
-- Name: kenneth_temp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kenneth_temp (
    id integer,
    text character varying(50)
)
WITH (autovacuum_vacuum_scale_factor='0.0', autovacuum_vacuum_threshold='10000');


--
-- Name: test; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    is_visible boolean DEFAULT true NOT NULL
);


--
-- Name: test_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_id_seq OWNED BY public.test.id;


--
-- Name: configuration id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY configuration ALTER COLUMN id SET DEFAULT nextval('configuration_id_seq'::regclass);


--
-- Name: counter id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY counter ALTER COLUMN id SET DEFAULT nextval('counter_id_seq'::regclass);


--
-- Name: country id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY country ALTER COLUMN id SET DEFAULT nextval('country_id_seq'::regclass);


--
-- Name: document id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY document ALTER COLUMN id SET DEFAULT nextval('document_id_seq'::regclass);


--
-- Name: file id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file ALTER COLUMN id SET DEFAULT nextval('file_id_seq'::regclass);


--
-- Name: file_log id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file_log ALTER COLUMN id SET DEFAULT nextval('file_log_id_seq'::regclass);


--
-- Name: journal id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal ALTER COLUMN id SET DEFAULT nextval('journal_id_seq'::regclass);


--
-- Name: journal_comment id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_comment ALTER COLUMN id SET DEFAULT nextval('journal_comment_id_seq'::regclass);


--
-- Name: list id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY list ALTER COLUMN id SET DEFAULT nextval('list_id_seq'::regclass);


--
-- Name: name id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY name ALTER COLUMN id SET DEFAULT nextval('name_id_seq'::regclass);


--
-- Name: person_name id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY person_name ALTER COLUMN id SET DEFAULT nextval('person_name_id_seq'::regclass);


--
-- Name: project id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY project ALTER COLUMN id SET DEFAULT nextval('project_id_seq'::regclass);


--
-- Name: source id; Type: DEFAULT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY source ALTER COLUMN id SET DEFAULT nextval('source_id_seq'::regclass);


--
-- Name: test id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test ALTER COLUMN id SET DEFAULT nextval('public.test_id_seq'::regclass);


--
-- Name: configuration configuration_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY configuration
    ADD CONSTRAINT configuration_pkey PRIMARY KEY (id);


--
-- Name: counter counter_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY counter
    ADD CONSTRAINT counter_pkey PRIMARY KEY (id);


--
-- Name: country country_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY country
    ADD CONSTRAINT country_pkey PRIMARY KEY (id);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: file_backup file_backup_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file_backup
    ADD CONSTRAINT file_backup_pkey PRIMARY KEY (id);


--
-- Name: file_log file_log_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file_log
    ADD CONSTRAINT file_log_pkey PRIMARY KEY (id);


--
-- Name: file file_name_key; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_name_key UNIQUE (name);


--
-- Name: file file_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);


--
-- Name: file_testing file_testing_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file_testing
    ADD CONSTRAINT file_testing_pkey PRIMARY KEY (id);


--
-- Name: journal_anonymous journal_anonymous_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_anonymous
    ADD CONSTRAINT journal_anonymous_pkey PRIMARY KEY (id);


--
-- Name: journal_comment journal_comment_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_comment
    ADD CONSTRAINT journal_comment_pkey PRIMARY KEY (id);


--
-- Name: journal_name_check journal_name_check_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_name_check
    ADD CONSTRAINT journal_name_check_pkey PRIMARY KEY (journal_id);


--
-- Name: journal_name journal_name_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_name
    ADD CONSTRAINT journal_name_pkey PRIMARY KEY (journal_id, name_id);


--
-- Name: journal journal_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal
    ADD CONSTRAINT journal_pkey PRIMARY KEY (id);


--
-- Name: list list_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY list
    ADD CONSTRAINT list_pkey PRIMARY KEY (id);


--
-- Name: name name_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY name
    ADD CONSTRAINT name_pkey PRIMARY KEY (id);


--
-- Name: person_name person_name_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY person_name
    ADD CONSTRAINT person_name_pkey PRIMARY KEY (id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: source source_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY source
    ADD CONSTRAINT source_pkey PRIMARY KEY (id);


--
-- Name: task tasks_pkey; Type: CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY task
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: test test_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- Name: case_number_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX case_number_idx ON journal USING btree (case_number);


--
-- Name: document_date_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX document_date_idx ON journal USING btree (document_date);


--
-- Name: file_id_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX file_id_idx ON journal USING btree (file_id);


--
-- Name: journal_id_ix; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX journal_id_ix ON journal_anonymous USING btree (id);


--
-- Name: name_name_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX name_name_idx ON name USING btree (name);


--
-- Name: project_id_and_source_id_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX project_id_and_source_id_idx ON journal USING btree (project_id, source_id);


--
-- Name: project_id_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX project_id_idx ON journal USING btree (project_id);


--
-- Name: source_id_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX source_id_idx ON journal USING btree (source_id);


--
-- Name: textsearch_idx; Type: INDEX; Schema: innsyn; Owner: -
--

CREATE INDEX textsearch_idx ON journal USING gin (search_column);


--
-- Name: test_id_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX test_id_name_idx ON public.test USING btree (id, name);


--
-- Name: journal textsearch_update; Type: TRIGGER; Schema: innsyn; Owner: -
--

CREATE TRIGGER textsearch_update BEFORE INSERT OR UPDATE ON journal FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger('search_column', 'pg_catalog.norwegian', 'case_number', 'case_title', 'document_title', 'sender', 'receiver', 'case_responsible', 'case_officer');


--
-- Name: configuration configuration_source_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY configuration
    ADD CONSTRAINT configuration_source_id_fkey FOREIGN KEY (source_id) REFERENCES source(id);


--
-- Name: document document_journal_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY document
    ADD CONSTRAINT document_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES journal(id);


--
-- Name: file_log file_log_file_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file_log
    ADD CONSTRAINT file_log_file_id_fkey FOREIGN KEY (file_id) REFERENCES file(id);


--
-- Name: file file_source_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_source_id_fkey FOREIGN KEY (source_id) REFERENCES source(id);


--
-- Name: journal_anonymous journal_anonymous_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_anonymous
    ADD CONSTRAINT journal_anonymous_id_fkey FOREIGN KEY (id) REFERENCES journal(id) ON DELETE CASCADE;


--
-- Name: journal_comment journal_comment_journal_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_comment
    ADD CONSTRAINT journal_comment_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES journal(id);


--
-- Name: journal journal_file_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal
    ADD CONSTRAINT journal_file_id_fkey FOREIGN KEY (file_id) REFERENCES file(id);


--
-- Name: journal_name_check journal_name_check_journal_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal_name_check
    ADD CONSTRAINT journal_name_check_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES journal(id);


--
-- Name: journal journal_project_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal
    ADD CONSTRAINT journal_project_id_fkey FOREIGN KEY (project_id) REFERENCES project(id);


--
-- Name: journal journal_source_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY journal
    ADD CONSTRAINT journal_source_id_fkey FOREIGN KEY (source_id) REFERENCES source(id);


--
-- Name: person_name person_name_country_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY person_name
    ADD CONSTRAINT person_name_country_id_fkey FOREIGN KEY (country_id) REFERENCES country(id);


--
-- Name: project project_country_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY project
    ADD CONSTRAINT project_country_id_fkey FOREIGN KEY (country_id) REFERENCES country(id);


--
-- Name: source source_list_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY source
    ADD CONSTRAINT source_list_id_fkey FOREIGN KEY (list_id) REFERENCES list(id);


--
-- Name: source source_project_id_fkey; Type: FK CONSTRAINT; Schema: innsyn; Owner: -
--

ALTER TABLE ONLY source
    ADD CONSTRAINT source_project_id_fkey FOREIGN KEY (project_id) REFERENCES project(id);


--
-- PostgreSQL database dump complete
--

