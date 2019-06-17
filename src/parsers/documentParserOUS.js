/* Copyright 2019 Schibsted */

let baseParser = require('./baseParser');

module.exports = {
  parse: function(raw) {
    let configuration = {
      entrySplitter: 'Innhold:',
      removeBefore: [
        /Offentlig journal[^]+Rapport generert:.*/,
        ///(Side:[^]+?)Innhold:/g,
        /Side:.*/g,
        /\(enhet\/initialer\):/g,
      ],
      removeAfter: [
        /Oslo universitetssykehus/,
        /Akershus fylkeskommune/,
        /Saksbeh./,
        /Avskr. dato:/,
        /Avskr.måte:/,
        /Avskriv lnr.:/,
        /Mottaker/,
        /Avsender/,
        /Klassering:/,
        /\(enhet\/initialer\):/,
        /Journaldato:/,
        /Dok.dato:/,
        /Saksansvarlig:/,
        /.\d{1,3} av \d{1,3}/,
      ],
      fields: {
        caseNumber: [
          /(\d{1,10}\/\d{1,10}-\d{1,10})/,
          // the raw text created for Storting does not always contain the hyphen (-)
          /(\d{1,10}\/\d{1,10})/,
        ],
        caseTitle: [/Sakstittel:([^]+?)DokType Sak\/dok nr:/],
        documentTitle: [/Innhold:([^]+?)Sakstittel:/],
        dateRegex: /\d{2}\.\d{2}\.\d{4}/g,
        senderOrReceiver: [
          /Avsender\\mottaker:\n(([^]+))/,
          /Avs.\/mottaker: Navn:\n(([^]+))/,
        ],
        senderOrReceiverCleanup: [
          // remove dates
          /\d{2}\.\d{2}\.\d{4}/,
          // remove codes (bottom text on pages)
          /[A-ZÆØÅ]{2,3}/g,
        ],
        caseOfficer: [
          /\nMottaker\nAvsender\n(.*)\n/, // Oslo universitetssykehus
          /\n([A-ZÆØÅ0-9]{2,}\/[A-ZÆØÅ]{2,}\/[A-ZÆØÅ]{2,})\b/, // Nordlandssykehuset (a few)
          /([\wæøå]{1,5}-[\wæøå]{1,5}\/[\wæøå]{1,5})/i, // bydel gamle oslo
          /\n([\D]{1,6}\/[\D]{1,6})\n/, // bydel frogner
          /Saksbeh.*[^]+?([A-ZÆØÅ]{2,}-[A-ZÆØÅ]{2,})\b/, // Helse Førde HF
          /Saksbeh.*[^]+?([A-ZÆØÅ]{2,}\/[A-ZÆØÅ0-9]{2,})\b/, // Nordlandssykehuset (a few)
        ],
        caseResponsible: [/Saksansvarlig*[^]+?\n(.*)\nTilg.kode Hjemmel/],
        documentType: [/DokType.*\n(I)\n/, /\n(U)\n/],
        classification: [
          /Klassering:\n(\d.*)\n/,
          /Klassering:[^]+?\n(\d.*)\n/,
          /Klassering:[^]+?\n(\*{5})\n/, // redacted (Nordlandssykehuset)
        ],
        legalParagraph: [
          /Tilg.kode Hjemmel:[^]+?\n(.*§.*)\nSaksbeh./, // Helse Stavanger HF
          /Tilg.kode Hjemmel:\n.*([^]+?)Avsender\\mottaker:/,
          /\n(.*§.*)/, // try
        ],
      },
    };

    return baseParser.parse(raw, configuration);
  },
};
