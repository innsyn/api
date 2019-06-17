/* Copyright 2019 Schibsted */

module.exports = {
  parse: function(raw) {
    let transformed = [];

    if (!Array.isArray(raw)) {
      return { parsed: false, items: [] };
    }

    raw.forEach(function(item) {
      transformed.push(createObject(item));
    });
    return { parsed: true, items: transformed };
  },
};

function createObject(item) {
  return {
    caseNumber: item.doc_num,
    caseTitle: item.case_title,
    documentTitle: item.doc_title,
    documentDate: getDateFromString(item.doc_date),
    recordedDate: new Date(1900, 1, 1),
    sender: item.from || '',
    receiver: item.to || '',
    caseOfficer: '',
    caseResponsible: item.doc_unit_id,
    documentType: item.doc_direction,
    classification: '',
    legalParagraph:
      item.other.length === 1 ? item.other[0].replace(/Grad.*/, '').trim() : '',
  };
}

/***
 * Converts a string with the format like "24.10.2012"  to a date object.
 */
function getDateFromString(dateString) {
  try {
    let dateParts = dateString.split('.');
    let day = dateParts[0];
    let month = dateParts[1];
    let year = dateParts[2];
    let result = new Date('"' + year + '/' + month + '/' + day + '"');
    if (result == 'Invalid Date') {
      return '';
    }
    return result;
  } catch (e) {
    return '';
  }
}
