/* Copyright 2019 Schibsted */

const config = require('../../config');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const fs = require('fs');
const { downloadFileToPath } = require('./download');
// const http = require('http');
// const https = require('https');
let logRed = require('./logWithColor').logRed;
module.exports = {
  saveUrlToS3AsPromise,
  listFilesInFolder,
  uploadFile,
  downloadFileToPath,
  downloadFile,
};

function saveUrlToS3AsPromise(options) {
  return new Promise(function(resolve, reject) {
    if (options.sourceUrl === '' || options.sourceUrl === undefined) {
      resolve('');
      return;
    }

    const bucket = options.bucket;
    const awsAccessKeyId = config.get('aws.s3.access_key_id');
    const awsSecretAccessKey = config.get('aws.s3.secret_access_key');

    AWS.config.credentials = new AWS.Credentials(
      awsAccessKeyId,
      awsSecretAccessKey,
    );

    downloadFileToPath(options.sourceUrl, options.destinationFilename)
      .then(function(sourceFilename) {
        return uploadFile({
          bucket: bucket,
          sourceFilename: sourceFilename,
          destinationFilename:
            options.folderName + '/' + options.destinationFilename,
        });
      })
      .then(function(data) {
        resolve(data);
      })
      .catch(function({ message, metadata }) {
        logRed(`${message}: ${JSON.stringify(metadata, null, 2)}`);
        resolve('');
      });
  });
}

function uploadFile(options) {
  return new Promise(function(resolve, reject) {
    const bucket = options.bucket;
    const destinationFilename = options.destinationFilename;
    const sourceFilename = options.sourceFilename;

    const s3 = getS3();

    fs.readFile(sourceFilename, function(err, data) {
      if (err) {
        throw err;
      }
      let params = { Bucket: bucket, Key: destinationFilename, Body: data };

      s3.upload(params, function(err, data) {
        if (err) {
          console.log(err);
          resolve({});
        } else {
          resolve({ s3Url: data.Location, s3Key: destinationFilename });
        }
      });
    });
  });
}

// TODO: Currently hardcoded the innsyn bucket
function downloadFile(s3Key) {
  return new Promise(function(resolve, reject) {
    const params = {
      Bucket: 'innsyn',
      Key: s3Key,
    };

    getS3().getObject(params, function(err, data) {
      if (err) {
        console.log(err);
        resolve('');
      } else {
        resolve(data.Body);
      }
    });
  });
}

function listFilesInFolder(options) {
  return new Promise(function(resolve, reject) {
    const bucket = options.bucket;
    const awsAccessKeyId = config.get('aws.s3.access_key_id');
    const awsSecretAccessKey = config.get('aws.s3.secret_access_key');

    AWS.config.credentials = new AWS.Credentials(
      awsAccessKeyId,
      awsSecretAccessKey,
    );

    const s3 = new AWS.S3();

    let folder = options.folder + '/'; // options.sourceName;
    let params = {
      Bucket: bucket,
      Prefix: folder,
    };

    s3.listObjectsV2(params, function(err, data) {
      if (err) {
        reject(err);
        console.log(err, err.stack); // an error occurred
      } else {
        resolve(data);
      }
    });
  });
}

function getS3() {
  const awsAccessKeyId = config.get('aws.s3.access_key_id');
  const awsSecretAccessKey = config.get('aws.s3.secret_access_key');
  AWS.config.credentials = new AWS.Credentials(
    awsAccessKeyId,
    awsSecretAccessKey,
  );
  return new AWS.S3();
}
