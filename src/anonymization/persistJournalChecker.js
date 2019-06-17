/* Copyright 2019 Schibsted */

module.exports = { shouldPersist };

// TODO: Move this somewhere else, such as into a configuration?
const PatternsToExclude = [
  {
    rx: /\bpersonalmappe\b/,
    fields: ['case_title'],
  },
  {
    rx: /\belevmappe\b/,
    fields: ['case_title'],
  },
  {
    rx: /\bstudentmappe\b/,
    fields: ['case_title'],
  },
];

// Expects a valid object here...
function shouldPersist(journal) {
  for (let pattern of PatternsToExclude) {
    for (let field of pattern.fields) {
      if (pattern.rx.test((journal[field] || '').toLowerCase())) return false;
    }
  }
  return true;
}
