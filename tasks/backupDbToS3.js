/* Copyright 2019 Schibsted */

const config = require('../config');
const exec = require('child_process').execSync;
const s3 = require('s3');
const parseCS = require('pg-connection-string').parse;

let client = s3.createClient({
  s3Options: {
    accessKeyId: config.get('backup.s3.access_key_id'),
    secretAccessKey: config.get('backup.s3.secret_access_key'),
  },
});

let now = new Date().toJSON().replace(/[:.]/g, '-');
let filename = `innsyn-db-backup-${now}.dump`;

let cs = process.env.HEROKU_POSTGRESQL_PINK_URL;
let csParts = parseCS(cs);

let cmd =
  'pg_dump --no-password -U ' +
  csParts.user +
  ' -p ' +
  csParts.port +
  ' -h ' +
  csParts.host +
  ' -Fc ' +
  csParts.database +
  ' > ' +
  filename;

execute(cmd);

// downloaded file is named latest.dump
let params = {
  localFile: filename,

  s3Params: {
    Bucket: 'innsyn-db-backup',
    Key: filename,
  },
};

let uploader = client.uploadFile(params);
uploader.on('error', function(err) {
  console.error('unable to upload:', err.stack);
  process.exit(1);
});
uploader.on('progress', function() {
  process.stdout.write(
    uploader.progressAmount + ' of ' + uploader.progressTotal + '\r',
  );
  /*console.log("progress", uploader.progressMd5Amount,*/
  /*  uploader.progressAmount, uploader.progressTotal);*/
});
uploader.on('end', function() {
  console.log('done uploading');
});

function execute(command) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      process.exit(1);
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}
