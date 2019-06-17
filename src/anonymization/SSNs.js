/* Copyright 2019 Schibsted */

module.exports = { toAnonymize: SSNs };

// RULE #2: Get Social Security Numbers
function SSNs(names, text) {
  let remarks = [];

  let keywords = [/[ ]fnr[ .:]/, /[ ]pnr[ .:]/, /personnummer/, /[ ]f[ .:]/];

  const ssnPatterns = [
    /\d{11}/g,
    /\d{6}[ -]\d{5}/g,
    /\d{2}.\d{2}.\d{4}[ -]\d{5}/g,
  ];

  let containsKeyword;
  for (let keyword of keywords) {
    containsKeyword = keyword.test(text);
    if (containsKeyword) break;
  }

  let toAnonymize = [];

  if (containsKeyword) {
    for (let pattern of ssnPatterns) {
      let results = text.match(pattern);
      if (results) {
        for (let result of results) {
          toAnonymize.push(result);
          remarks.push('SSN found');
        }
      }
    }
  }
  return { toAnonymize: toAnonymize, remarks: remarks };
}
