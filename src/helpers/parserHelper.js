/* Copyright 2019 Schibsted */

module.exports = { getParserByName, mapItems, ymd, listParsers };

function getParserByName(name) {
  for (var p of parsers) {
    if (p.name == name) return p.parser;
  }
}

function listParsers() {
  return parsers;
}

function mapItems(items) {
  var mapped = [];
  for (var item of items) {
    mapped.push(mapJournal(item));
  }
  return mapped;
}

function mapJournal(jObj) {
  let jDB = {};

  jDB.case_number = jObj.caseNumber ? jObj.caseNumber.substring(0, 50) : '';
  jDB.case_title = jObj.caseTitle ? jObj.caseTitle.substring(0, 250) : '';
  jDB.document_title = jObj.documentTitle
    ? jObj.documentTitle.substring(0, 250)
    : '';
  jDB.document_date = ymd(jObj.documentDate || new Date(1900, 0, 1));
  jDB.recorded_date = ymd(jObj.recordedDate || new Date(1900, 0, 1));
  jDB.document_type = jObj.documentType
    ? jObj.documentType.substring(0, 5)
    : '';
  jDB.classification = jObj.classification
    ? jObj.classification.substring(0, 20)
    : '';
  jDB.legal_paragraph = jObj.legalParagraph
    ? jObj.legalParagraph.substring(0, 100)
    : '';
  jDB.sender = jObj.sender ? jObj.sender.substring(0, 250) : '';
  jDB.receiver = jObj.receiver ? jObj.receiver.substring(0, 250) : '';
  jDB.case_responsible = jObj.caseResponsible
    ? jObj.caseResponsible.substring(0, 250)
    : '';
  jDB.case_officer = jObj.caseOfficer ? jObj.caseOfficer.substring(0, 250) : '';
  jDB.original_document_link = jObj.originalDocumentLink
    ? jObj.originalDocumentLink.substring(0, 250)
    : '';
  jDB.unit = jObj.unit ? jObj.unit.substring(0, 100) : '';
  // Hotfix #16, Massivejs treats this as a column. need another solution
  //jDB.documents = jObj.documentUrls;

  return jDB;
}

function ymd(d) {
  if (!Date.parse(d)) return '1900-01-01';

  // convert if string
  if (typeof d === 'string') d = new Date(Date.parse(d));

  var mm = d.getMonth() + 1;
  var dd = d.getDate();

  return [
    d.getFullYear(),
    mm < 10 ? '0' + mm : mm,
    dd < 10 ? '0' + dd : dd,
  ].join('-');
}

let parsers = [
  {
    name: 'BydelBjerke',
    parser: require('./../parsers/documentParserBydelBjerke'),
  },
  {
    name: 'Utdanningsetaten',
    parser: require('./../parsers/documentParserUtdanningsetaten'),
  },
  {
    name: 'MunchMuseet',
    parser: require('./../parsers/documentParserMunchMuseet'),
  },
  {
    name: 'Renovasjonsetaten',
    parser: require('./../parsers/documentParserRenovasjonsetaten'),
  },
  {
    name: 'Undervisningsbygg',
    parser: require('./../parsers/documentParserUndervisningsbygg'),
  },
  {
    name: 'Velferdsetaten',
    parser: require('./../parsers/documentParserVelferdsetaten'),
  },
  {
    name: 'BydelSagene',
    parser: require('./../parsers/documentParserBydelSagene'),
  },
  {
    name: 'Naeringsetaten',
    parser: require('./../parsers/documentParserNaeringsetaten'),
  },
  { name: 'Kemner', parser: require('./../parsers/documentParserKemner') },
  {
    name: 'PlanOgBygningsetaten',
    parser: require('./../parsers/documentParserPlanOgBygningsetaten'),
  },
  { name: 'Bystyret', parser: require('./../parsers/documentParserBystyret') },
  { name: 'SSHF', parser: require('./../parsers/documentParserSSHF') },
  { name: 'HSO', parser: require('./../parsers/documentParserHSO') },
  {
    name: 'Forsvaret',
    parser: require('./../parsers/documentParserForsvaret'),
  },
  { name: 'TBaneOld', parser: require('./../parsers/documentParserTbaneOld') },
  {
    name: 'StOlavsHospital',
    parser: require('./../parsers/documentParserStOlavsHospital'),
  },
  {
    name: 'OsloUniversitetssykehusWeb',
    parser: require('./../parsers/documentParserOsloUniversitetssykehusWeb'),
  },
  { name: 'OUS', parser: require('./../parsers/documentParserOUS') },
  {
    name: 'Mattilsynet',
    parser: require('./../parsers/documentParserMattilsynet'),
  },
  {
    name: 'MattilsynetJson',
    parser: require('./../parsers/documentParserMattilsynetJson'),
  },
  {
    name: 'Stortinget',
    parser: require('./../parsers/documentParserStortinget'),
  },
  {
    name: 'Midtjylland',
    parser: require('./../parsers/documentParserMidtjylland'),
  },
  { name: 'Syddjurs', parser: require('./../parsers/documentParserSyddjurs') },
  {
    name: 'Sofartsstyrelsen',
    parser: require('./../parsers/documentParserSofartsstyrelsen'),
  },
  {
    name: 'MicrosoftReportingServices',
    parser: require('./../parsers/documentParserMicrosoftReportingServices'),
  },
  {
    name: 'GrapeCityActiveReports',
    parser: require('./../parsers/documentParserGrapeCityActiveReports'),
  },
  { name: 'HTML', parser: require('./../parsers/html') },
  {
    name: 'JSON',
    parser: require('../parsers/json'),
  },
  {
    name: 'Tieto',
    parser: require('../parsers/tieto'),
  },
  {
    name: 'Elements',
    parser: require('../parsers/elements'),
  },
];
