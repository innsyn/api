/* Copyright 2019 Schibsted */

const parsers = [
  // {
  //   name: 'BydelBjerke',
  //   parser: require('./documentParserBydelBjerke'),
  // },
  // {
  //   name: 'Utdanningsetaten',
  //   parser: require('./documentParserUtdanningsetaten'),
  // },
  // {
  //   name: 'MunchMuseet',
  //   parser: require('./documentParserMunchMuseet'),
  // },
  // {
  //   name: 'Renovasjonsetaten',
  //   parser: require('./documentParserRenovasjonsetaten'),
  // },
  // {
  //   name: 'Undervisningsbygg',
  //   parser: require('./documentParserUndervisningsbygg'),
  // },
  // {
  //   name: 'Velferdsetaten',
  //   parser: require('./documentParserVelferdsetaten'),
  // },
  // {
  //   name: 'BydelSagene',
  //   parser: require('./documentParserBydelSagene'),
  // },
  // {
  //   name: 'Naeringsetaten',
  //   parser: require('./documentParserNaeringsetaten'),
  // },
  // { name: 'Kemner', parser: require('./documentParserKemner') },
  // {
  //   name: 'PlanOgBygningsetaten',
  //   parser: require('./documentParserPlanOgBygningsetaten'),
  // },
  // { name: 'Bystyret', parser: require('./documentParserBystyret') },
  // { name: 'SSHF', parser: require('./documentParserSSHF') },
  // { name: 'HSO', parser: require('./documentParserHSO') },
  // {
  //   name: 'Forsvaret',
  //   parser: require('./documentParserForsvaret'),
  // },
  // { name: 'TBaneOld', parser: require('./documentParserTbaneOld') },
  // {
  //   name: 'StOlavsHospital',
  //   parser: require('./documentParserStOlavsHospital'),
  // },
  // {
  //   name: 'OsloUniversitetssykehusWeb',
  //   parser: require('./documentParserOsloUniversitetssykehusWeb'),
  // },
  // { name: 'OUS', parser: require('./documentParserOUS') },
  // {
  //   name: 'Mattilsynet',
  //   parser: require('./documentParserMattilsynet'),
  // },
  // {
  //   name: 'MattilsynetJson',
  //   parser: require('./documentParserMattilsynetJson'),
  // },
  // {
  //   name: 'Stortinget',
  //   parser: require('./documentParserStortinget'),
  // },
  // {
  //   name: 'Midtjylland',
  //   parser: require('./documentParserMidtjylland'),
  // },
  // { name: 'Syddjurs', parser: require('./documentParserSyddjurs') },
  // {
  //   name: 'Sofartsstyrelsen',
  //   parser: require('./documentParserSofartsstyrelsen'),
  // },
  // {
  //   name: 'MicrosoftReportingServices',
  //   parser: require('./documentParserMicrosoftReportingServices'),
  // },
  // {
  //   name: 'GrapeCityActiveReports',
  //   parser: require('./documentParserGrapeCityActiveReports'),
  // },
  { name: 'HTML', parser: require('./html') },
  {
    name: 'JSON',
    parser: require('./json'),
  },
  {
    name: 'Tieto',
    parser: require('./tieto'),
  },
  {
    name: 'Elements',
    parser: require('./elements'),
  },
];

const getParserByName = function(name) {
  try {
    const { parser } = parsers.find(parser => parser.name === name);

    if (parser) {
      return parser;
    } else {
      throw Error('Parser does not exist.');
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getParserByName };
