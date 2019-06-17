-- NOTES:
--
-- field registered_date added to all tables to register date for row creation
CREATE TABLE project (
		id SERIAL PRIMARY KEY NOT NULL
	, name VARCHAR(100) NOT NULL
	, documentcloud_project_id VARCHAR(100) NOT NULL
	, description VARCHAR(500)
	, source_regex VARCHAR(500)
	, is_visible boolean NOT NULL DEFAULT TRUE
	, registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- For logical grouping of sources
CREATE TABLE list (
		id SERIAL PRIMARY KEY NOT NULL
	, name VARCHAR(100) NOT NULL
	, description VARCHAR(500)
	, registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE source (
		id SERIAL PRIMARY KEY NOT NULL
	, project_id INT REFERENCES project(id) NOT NULL
	, list_id INT REFERENCES list(id) NULL
	, source_system VARCHAR(100) NOT NULL DEFAULT ''
 , parser_name VARCHAR(100) NULL
	, name VARCHAR(100) NOT NULL
	, email VARCHAR(150) NOT NULL
	, description VARCHAR(500)
	, is_visible boolean NOT NULL DEFAULT TRUE
	, registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE file (
		 id SERIAL PRIMARY KEY NOT NULL
	, source_id INT REFERENCES source(id) NOT NULL
	, date_imported DATE
	, date_imported_documentcloud DATE
	, name VARCHAR(100) NOT NULL UNIQUE
	, parser_name VARCHAR(100) NULL
	, registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE file_log (
		id SERIAL PRIMARY KEY NOT NULL
	, file_id INT REFERENCES file(id) NOT NULL
	, message VARCHAR(200) NOT NULL
	, registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE journal (
		id SERIAL PRIMARY KEY NOT NULL
	, case_number VARCHAR(50) NOT NULL
	, case_title VARCHAR(250) NOT NULL
	, document_title VARCHAR(250) NOT NULL
	, document_date DATE NOT NULL
	, recorded_date DATE NOT NULL
	, project_id INT REFERENCES project(id) NOT NULL
	, source_id INT REFERENCES source(id) NOT NULL
	, file_id INT REFERENCES file(id) NOT NULL
	, document_type VARCHAR(5)      -- Does this actually indicate In/Out?
	, classification VARCHAR(20)
	, legal_paragraph VARCHAR(100)
	, sender VARCHAR(250)
	, receiver VARCHAR(250)
	, case_responsible VARCHAR(250)
	, case_officer VARCHAR(250)
	, registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE document (
  id SERIAL PRIMARY KEY NOT NULL
 , journal_id INT REFERENCES journal(id) NOT NULL
 , external_url VARCHAR(500) NOT NULL
 , imported_url VARCHAR(500) NULL
 , registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

create table counter (id serial primary key not null,project_id INT,source_id INT,count INT NOT NULL);

CREATE TABLE configuration (
      id serial PRIMARY KEY NOT NULL
    , source_id INT REFERENCES source(id) NOT NULL
    , property VARCHAR(100) NOT NULL
    , value VARCHAR(100) NOT NULL
    , last_updated DATE NOT NULL
    , registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE country (
      id serial PRIMARY KEY NOT NULL
    , name VARCHAR(100) NOT NULL
    , country_code CHAR(2) NOT NULL
    , registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE person_name (
      id serial PRIMARY KEY NOT NULL
    , first_name VARCHAR(100) NOT NULL
    , middle_name VARCHAR(100) NULL
    , last_name VARCHAR(100) NOT NULL
    , country_id INT REFERENCES country(id) NOT NULL
    , registered_date DATE NOT NULL DEFAULT CURRENT_DATE
);

﻿create table journal_name (
	journal_id INT REFERENCES journal(id) NOT NULL,
    name_id INT REFERENCES name(id) NOT NULL,
    registered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    anonymize boolean not null default false
    primary key (journal_id, name_id)
);

﻿create table journal_name_check (
	journal_id int primary key references journal(id) not null,
    last_updated date not null default current_date,
    registered_date date not null default current_date
);

﻿CREATE TABLE name
(
    name character varying(200) COLLATE pg_catalog."default",
    id integer NOT NULL DEFAULT nextval('name_id_seq'::regclass),
    is_common_name boolean NOT NULL DEFAULT false,
    CONSTRAINT name_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE name
    OWNER to u4qrcloefbjup;

-- Index: name_name_idx

-- DROP INDEX name_name_idx;

CREATE INDEX name_name_idx
    ON name USING btree
    (name COLLATE pg_catalog."default")
    TABLESPACE pg_default;

ALTER TABLE project ADD COLUMN country_id INT REFERENCES country(id) NOT NULL DEFAULT 1;


-- Adding new column for text search to journal:
ALTER TABLE journal ADD COLUMN search_column tsvector;

-- Create an index for the new column to enable fast searching
CREATE INDEX textsearch_idx ON journal USING GIN (search_column);

-- Create a trigger that will update the column on inserts
CREATE TRIGGER textsearch_update BEFORE INSERT OR UPDATE
ON journal FOR EACH ROW EXECUTE PROCEDURE
tsvector_update_trigger(search_column, 'pg_catalog.norwegian', case_number, case_title, document_title, sender, receiver, case_responsible, case_officer);

CREATE INDEX ON journal (project_id);
CREATE INDEX ON journal (source_id);
CREATE INDEX ON journal (document_date);
CREATE INDEX ON journal (file_id);
CREATE INDEX ON journal (case_number);

CREATE INDEX ON file (source_id);

-- Nullable file id needed for online journals
ALTER TABLE journal ALTER COLUMN file_id DROP NOT NULL;

ALTER TABLE project ADD COLUMN documentcloud_project_id_numeric INT;
ALTER TABLE project ADD COLUMN dropbox_path VARCHAR(200);
ALTER TABLE journal ADD COLUMN original_document_link VARCHAR(250);
ALTER TABLE journal ADD COLUMN document_link VARCHAR(250);
ALTER TABLE journal ADD COLUMN unit VARCHAR(100);
