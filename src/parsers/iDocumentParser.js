/* Copyright 2019 Schibsted */

/***
 * IDocumentParser is an example for the parser implementations. All parsers are expected to behave as this one.
 *
 * The description for a parser should note what sources it is capable of parsing.
 *
 * Can parse: nothing
 *
 * @type {{parse: module.exports.parse}}
 */
module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false). See the Jira task FVN-401
   * for valid fields to return.
   */
  parse: function(raw) {
    return raw == 'succeed' ? success() : failure();

    function success() {
      var date = new Date(2016, 8, 11);

      return {
        parsed: true,
        items: [
          {
            source: 'Source1',
            caseNumber: 'CaseNumber1',
            caseTitle: 'CaseTitle1',
            documentTitle: 'DocumenTitle1',
            documentDate: date,
            recordedDate: date,
            sender: 'Sender1',
            receiver: 'Receiver1',
          },
          {
            source: 'Source2',
            caseNumber: 'CaseNumber2',
            caseTitle: 'CaseTitle2',
            documentTitle: 'DocumentTitle2',
            documentDate: date,
            recordedDate: date,
            sender: 'Sender2',
            receiver: 'Receiver2',
          },
        ],
      };
    }

    function failure() {
      return { parsed: false };
    }
  },
};
