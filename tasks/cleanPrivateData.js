/* Copyright 2019 Schibsted */

const connection = require('./../src/helpers/connection');

let db = connection.getConnection();

console.log('About to run commands to clean private data');

console.log('Replacing Social Security Numbers in document_title with ***...');
runCommand(
  "update innsyn.journal set document_title=regexp_replace(regexp_replace(document_title, '\\d{11,11}','***********'), '\\d{6,6}[ -]\\d{5,5}','****** *****') where (lower(document_title) ~ ' fnr[ .:]' or lower(document_title) ~ ' pnr[ .:]' or lower(document_title)  ~ 'personnummer') and (document_title ~'\\d{11,11}' or document_title ~'\\d{6,6}[ -]\\d{5,5}');",
);

console.log('Replacing Social Security Numbers in case_title with ***...');
runCommand(
  "update innsyn.journal set case_title=regexp_replace(regexp_replace(case_title, '\\d{11,11}','***********'), '\\d{6,6}[ -]\\d{5,5}','****** *****') where (lower(case_title)  ~ ' fnr[ .:]' or lower(case_title) ~ ' pnr[ .:]' or lower(case_title) ~ 'personnummer') and (case_title ~'\\d{11,11}' or case_title ~'\\d{6,6}[ -]\\d{5,5}');",
);

console.log(
  "Delete records about personal folder (filter: string 'Personalmappe')",
);
runCommand(
  "delete from innsyn.journal where lower(case_title) ~ 'personalmappe' and lower(case_title) not like '%personalmapper%';",
);

function runCommand(command) {
  console.log('Running: ' + command);
  db.runSync(command);
}
