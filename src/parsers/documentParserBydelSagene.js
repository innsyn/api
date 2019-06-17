/* Copyright 2019 Schibsted */

/***
 *
 * Can parse: Bydel Sagene (Oslo)
 *
 */

module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */
  parse: function(raw) {
    var helper = require('./../helpers/documentParserHelper');
    const ENTRY_SPLITTER = 'Innhold:';
    var currentIndex = 0;
    var previousIndex = 0;

    /***
     * List of keywords that should be removed if present in
     * fields.
     * @type {string[]}
     */
    var keywords = [
      /Innhold:/,
      /Sakstittel:/,
      /DokType Sak\/dok nr:/,
      /Løpenr.:/,
      /Avsender\\mottaker:/,
      /Tilg.kode Hjemmel:/,
      /Journaldato:/,
      /Dok.dato:/,
      /Saksansvarlig:/,
      ///\(enhet\/initialer\):/,
      /\(.*\):/,
      /Klassering:/,
      /Avs.\/mottaker: Navn:/,
      /Saksbeh.\(enhet\/initialer\): Avskr. dato: Avskr.måte: Avskriv lnr.:/,
      /Mottaker/,
      /Avsender/,
    ];

    function removeFluff(raw) {
      var doc = raw.replace(/Offentlig journal[^]+Rapport generert:.*/, '');
      doc = doc.replace(/Side:.*/g, '');
      doc = doc.replace(/\n\n/g, '\n');

      // Bydel Gamle Oslo
      var match = raw.match(/(\d{2}\.\d{2}\.\d{4}[^]+?)Innhold:/);
      if (match) {
        var re = new RegExp(match[1], 'g');
        doc = doc.replace(re, '');
      }

      // Helse Førde HF
      doc = doc.replace(/\(enhet\/initialer\):/g, '');

      // Remove urls (present in Helse Stavanger as "bottom text")
      doc = doc.replace(/\bhttp.*\b/g, '');

      // remove empty lines
      doc = doc.replace(/\n\n/g, '\n');

      return doc;
    }

    function removeNewlines(text) {
      text = text ? text.replace(/\n/g, ' ').trim() : '';

      // remove reduntant spaces
      var doubleSpace = /  /g;
      while (text.match(doubleSpace)) {
        text = text.replace(doubleSpace, ' ');
      }
      return text.trim();
    }

    /***
     * Removes keywords from text as specified in the keywords array.
     * Only supply text already grabbed for a field. If used earlier,
     * the parser will not work!
     * @param text
     */
    function removeKeywords(text) {
      for (var reg of keywords) {
        if (typeof text !== 'object') {
          while (text.match(reg)) {
            text = text.replace(reg, '');
          }
        }
      }
      return text;
    }

    function cleanItems(itemsToClean) {
      var items = [];
      for (let item of itemsToClean) {
        var newItem = {};
        for (let prop in item) {
          newItem[prop] = removeKeywords(item[prop]);
        }
        items.push(newItem);
      }
      return items;
    }

    try {
      var rawDocument = removeFluff(raw);

      var rawItems = [];

      while (currentIndex < rawDocument.length) {
        rawItems.push(nextRawEntry());
      }

      var items = [];
      rawItems.forEach(function(item) {
        items.push(createObject(item));
      });

      var itemsCleaned = cleanItems(items);

      // try to evaluate if the parsing was successful
      if (itemsCleaned.length > 0) {
        return {
          parsed: true,
          items: itemsCleaned,
        };
      }

      return { parsed: false };
    } catch (e) {
      return { parsed: false, error: e };
    }

    function createObject(rawItem) {
      return {
        caseNumber: getCaseNumber(rawItem),
        caseTitle: getCaseTitle(rawItem),
        documentTitle: getDocumentTitle(rawItem),
        documentDate: getDocumentdate(rawItem),
        recordedDate: getRecordedDate(rawItem),
        sender: getSender(rawItem),
        receiver: getReceiver(rawItem),
        caseOfficer: getCaseOfficer(rawItem),
        caseResponsible: getCaseResponsible(rawItem),
        documentType: getDocumentType(rawItem),
        classification: getClassification(rawItem),
        legalParagraph: getLegalParagraph(rawItem),
      };
    }

    function getClassification(rawItem) {
      // some documents handled by this part (such as Helse Førde HF)...
      var regexList = [
        /Klassering:\n(\d.*)\n/,
        /Klassering:[^]+?\n(\d.*)\n/,
        /Klassering:[^]+?\n(\*{5})\n/, // redacted (Nordlandssykehuset)
      ];

      var result = helper.getValueFromString(rawItem, regexList);
      if (result) return result;

      // ...other documents by this part

      var line = rawItem.match(/Tilg.kode Hjemmel:\n(.*)/);
      if (line && line[1].length > 0) {
        if (line[1].indexOf('Avsender\\mottaker:') === -1) {
          return removeNewlines(line[1]);
        }
      }
      return '';
    }

    function getLegalParagraph(rawItem) {
      var regexList = [
        /Tilg.kode Hjemmel:[^]+?\n(.*§.*)\nSaksbeh./, // Helse Stavanger HF
        /Tilg.kode Hjemmel:\n.*([^]+?)Avsender\\mottaker:/,
        /\n(.*§.*)/, // try to grab a line at least!
      ];

      var paragraph = helper.getValueFromString(rawItem, regexList);
      paragraph = removeNewlines(paragraph);
      return removeNewlines(paragraph);
    }

    function getDocumentType(rawItem) {
      var regexList = [/DokType.*\n(I)\n/, /\n(U)\n/];
      return helper.getValueFromString(rawItem, regexList);
    }

    function getCaseOfficer(rawItem) {
      var regexList = [
        /\n([A-ZÆØÅ0-9]{2,}\/[A-ZÆØÅ]{2,}\/[A-ZÆØÅ]{2,})\b/, // Nordlandssykehuset (a few)
        /([\wæøå]{1,5}-[\wæøå]{1,5}\/[\wæøå]{1,5})/i, // bydel gamle oslo
        /\n([\D]{1,6}\/[\D]{1,6})\n/, // bydel frogner
        /Saksbeh.*[^]+?([A-ZÆØÅ]{2,}-[A-ZÆØÅ]{2,})\b/, // Helse Førde HF
        /Saksbeh.*[^]+?([A-ZÆØÅ]{2,}\/[A-ZÆØÅ0-9]{2,})\b/, // Nordlandssykehuset (a few)
      ];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getCaseResponsible(rawItem) {
      return '';
    }

    function getCaseNumber(rawItem) {
      var regexList = [
        /(\d{1,10}\/\d{1,10}-\d{1,10})/,
        // the raw text created for Storting does not always contain the hyphen (-)
        /(\d{1,10}\/\d{1,10})/,
      ];
      return helper.getValueFromString(rawItem, regexList);
    }

    function getCaseTitle(rawItem) {
      var title = rawItem.match(/Sakstittel:([^]+?)DokType Sak\/dok nr:/);
      return title ? removeNewlines(title[1]) : '';
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (getDocumentType(rawItem) === 'I') {
        return getSenderOrReceiver(rawItem);
      }
      return '';
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (getDocumentType(rawItem) === 'U') {
        return getSenderOrReceiver(rawItem);
      }
      return '';
    }

    function getSenderOrReceiver(rawItem) {
      var regexList = [
        /Avsender\\mottaker:\n(([^]+))/,
        /Avs.\/mottaker: Navn:\n(([^]+))/,
      ];

      var data = helper.getValueFromString(rawItem, regexList);

      // remove reduntant data
      data = data.replace(/Mottaker/g, '');
      data = data.replace(/Avsender/g, '');
      // for Bydel Gamle Oslo
      data = data.replace(
        /Saksbeh. Avskr. dato: Avskr.måte: Avskriv lnr.:/,
        '',
      );
      // remove anonymized data
      //data = data.replace(/\*+/g, "");
      // remove case officer (if present) Bydel Gamle Oslo
      data = data.replace(/([\wæøå]{1,5}-[\wæøå]{1,5}\/[\wæøå]{1,5})/i, '');

      // remove case officer (if present) Bydel Frogner
      data = data.replace(/\n([\D]{1,6}\/[\D]{1,6})\n/, '\n');

      // remove case officer (if present) Helse Førde HF
      data = data.replace(/\n([A-ZÆØÅ].*-[A-ZÆØÅ].*)\n/, '\n');

      // remove case officer (if present) Helse Stavanger HF (1)
      data = data.replace(/\n([A-ZÆØÅ]{2,}-[A-ZÆØÅ]{2,})$/, '\n');

      // remove case officer (if present) Helse Stavanger HF (2)
      data = data.replace(/\n([A-Z]{2,}\b)$/, '\n');

      // remove case officer (if present) Bydel Ullern
      data = data.replace(/\n([A-ZÆØÅ]{2,}\/[A-ZÆØÅ]{2,})\n/, '\n');

      // remove case officer (if present) Universitetssykehuset Nord-Norge
      data = data.replace(/([A-ZÆØÅ]{2,}\/[A-ZÆØÅ]{2,})$/, '\n');

      // remove case officer (if present) Nordlandssykehuset
      data = data.replace(/([A-ZÆØÅ0-9]{2,}\/[A-ZÆØÅ0-9]{2,})\n/, '\n');

      // remove date and rest of string
      data = data.replace(/\d{2}\.\d{2}\.\d{4}[^]+/, '');

      // Remove sender/receiver info for Helse Førde
      data = data.replace('Helse Førde', '');

      // Remove sender/receiver info for Helse Stavanger
      data = data.replace('Helse Stavanger', '');

      // Remove sender/receiver info for Helse Bergen
      data = data.replace('Helse Bergen HF', '');

      // Remove sender/receiver info for Universitetssykehuset Nord-Norge HF
      data = data.replace('Universitetssykehuset Nord-Norge HF', '');

      // Remove sender/receiver info for Helgelandssykehuset HF
      data = data.replace('Helgelandssykehuset HF', '');

      // Remove sender/receiver info for Nordlandssykehuset
      data = data.replace('Nordlandssykehuset', '');

      // Replace any two or more digits without any letters within word boundaries
      data = data.replace(/\b\d{2,}\b/g, '');

      // replace ellipses (sometimes present in Helse Stavanger after urls)
      data = data.replace(/\.{3,}/g, '');

      // replace equal sign (sometimes present in Helse Stavanger)
      data = data.replace(/=/g, ' ');

      // replace multiple retracted values with one
      data = data.replace(/(\*.*)/g, '*****');

      // remove any digits alone on a single line -- happens with NLSH for "Avskr lnr." not used
      data = data.replace(/\n\d{1,}$/g, '\n');

      // remove any uppercase two or three letter words left here, probably not sender/reeiver
      // Happens with NLSH for the field "Avskr.måte"
      data = data.replace(/\n[A-ZÆØÅ_]{2,3}\n/, '');

      // remove uppoercase letters with an underscore (happens for Helgelandssykehuset)
      data = data.replace(/\n[A-ZÆØÅ_]{2,}\n/, '');

      return removeNewlines(data);
    }

    function getDocumentTitle(rawItem) {
      var title = rawItem.match(/Innhold:([^]+?)Sakstittel:/);
      return title ? removeNewlines(title[1]) : '';
    }

    function getDocumentdate(rawItem) {
      return getDate(rawItem);
    }

    function getRecordedDate(rawItem) {
      return getDate(rawItem, 'r');
    }

    function getDate(rawItem, type) {
      // remove headers due to bug #108
      let rawItemWithoutTitles = rawItem.replace(/Innhold:([^]+?)DokType/, '');

      var dates = rawItemWithoutTitles.match(/\d{2}\.\d{2}\.\d{4}/g);
      // should be two
      if (dates && dates.length > 1) {
        var dateParts = [dates[0].split('.'), dates[1].split('.')];

        var date1 = new Date(
          dateParts[0][2] + '/' + dateParts[0][1] + '/' + dateParts[0][0],
        );
        var date2 = new Date(
          dateParts[1][2] + '/' + dateParts[1][1] + '/' + dateParts[1][0],
        );

        if (type === 'r') {
          // latest date
          return date1 >= date2 ? date1 : date2;
        }
        // oldest date
        return date1 <= date2 ? date1 : date2;
      }
      return null;
    }

    function nextRawEntry() {
      var entry = rawDocument.substring(currentIndex);
      var startIndex = entry.search(ENTRY_SPLITTER);

      if (startIndex === -1) {
        // something's wrong -- probably not the correct document type
        throw new Error('Could not find case number.');
      }

      var entryLength =
        1 + entry.substring(startIndex + 1).search(ENTRY_SPLITTER);
      if (entryLength === 0) {
        entryLength = entry.length;
      }
      previousIndex = currentIndex + startIndex;
      currentIndex = currentIndex + startIndex + entryLength - 1;
      return rawDocument.substring(previousIndex, currentIndex);
    }
  },
};
