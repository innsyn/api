/* Copyright 2019 Schibsted */

const awsHelper = require('./../src/helpers/awsHelper');
const scraperWeb = require('./sourceScraper');
const scraperMail = require('./emailAttachmentScraper');
const saveFileToDB = require('./../src/helpers/queries').saveFileToDB;
const getSourceById = require('./../src/helpers/queries').getSourceById;
let scraper = null;

const logYellow = require('./../src/helpers/logWithColor').logYellow;
const logRed = require('./../src/helpers/logWithColor').logRed;
const logCyan = require('./../src/helpers/logWithColor').logCyan;
const logDim = require('./../src/helpers/logWithColor').logDim;

sync()
  .then(function() {
    console.log('done');
    process.exit(0);
  })
  .catch(function(err) {
    console.error('Error', err);
    process.exit(1);
  });

async function sync() {
  const options = getSyncOptions();

  const source = await getSourceById(options.sourceId);
  const filesFromSource = await getFilesFromSource(options);
  const filesFromS3 = await getFilesFromS3(options.s3.bucket, source.name);

  let newFiles = filesFromSource.filter(
    x => filesFromS3.indexOf(x.filename) == -1,
  );

  await uploadFilesToS3(options, source, newFiles);
}

async function uploadFilesToS3(options, source, newFiles) {
  for (let i = 0; i < newFiles.length; i++) {
    const location = await awsHelper.saveUrlToS3AsPromise({
      bucket: options.s3.bucket,
      sourceUrl: newFiles[i].url,
      destinationFilename: newFiles[i].filename,
      folderName: source.name,
    });
    logDim('Copied ' + newFiles[i].filename + ' to ' + source.name + ' on S3');

    // add to database
    await saveFileToDB({
      status: 'New',
      name: newFiles[i].filename,
      s3_url: location.s3Url,
      s3_key: location.s3Key,
      source_id: options.sourceId,
    });
    logDim('Saved to database');
  }
}

function getFilesFromSource(options) {
  return new Promise(function(resolve, reject) {
    logYellow('Getting list of files from source');

    scraper.scrape(options, function(err, res) {
      if (err) {
        logRed('Error listing files at source: ', err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function getFilesFromS3(bucket, folder) {
  // must return list of objects with properties url and filename

  const s3Files = await awsHelper.listFilesInFolder({
    bucket: bucket,
    folder: folder,
  });

  if (s3Files.Contents.length === 0) return [];

  const filesTransformed = s3Files.Contents.map(function(e) {
    return e.Key.substring(e.Key.lastIndexOf('/') + 1);
  }).filter(e => e !== '');

  return filesTransformed;
}

function getSyncOptions() {
  logYellow('Getting options for source');

  try {
    let scraperOptionsName = process.argv[2];
    let options = require('./scraper-options/' + scraperOptionsName).get();

    // check required configuration
    if (!Number.isInteger(options.sourceId))
      throw 'The key sourceId MUST be set';
    if (!options.s3) throw 'S3 configuration must be set!';
    if (!options.s3.bucket) throw 'options.s3.bucket must be set!';

    scraper = options.type === 'email' ? scraperMail : scraperWeb;

    return options;
  } catch (e) {
    logYellow(
      'Could not get parser options. ' +
        'Check that the command line argument corresponds to an options file in tasks/scraper-options.',
    );
    logRed('Exception details: ', e);
    process.exit(1);
  }
}
