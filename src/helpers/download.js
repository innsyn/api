/* Copyright 2019 Schibsted */

const fetch = require('node-fetch');
const fs = require('fs');

const downloadFileToPath = function(url, destPath) {
  if (!url.startsWith('http')) {
    return Promise.resolve(url);
  }

  return fetch(url)
    .then(res =>
      res.ok
        ? res
        : Promise.reject({
            message: 'Initial error downloading file',
            metadata: { url, error: res.error },
          }),
    )
    .then(res => {
      if (!res.ok) {
        return Promise.reject({
          message: 'Initial error downloading file',
          metadata: { url, error: new Error(res.statusText) },
        });
      }

      const stream = fs.createWriteStream(destPath);
      let timer;

      return new Promise((resolve, reject) => {
        const errorHandler = error => {
          reject({
            message: 'Unable to download file',
            metadata: { url, error },
          });
        };

        res.body.on('error', errorHandler).pipe(stream);

        stream
          .on('open', () => {
            timer = setTimeout(() => {
              stream.close();
              reject({
                message: 'Timed out downloading file',
                metadata: { url, error: null },
              });
            }, 10000);
          })
          .on('error', errorHandler)
          .on('finish', () => {
            resolve(stream.path);
          });
      }).then(
        destPath => {
          clearTimeout(timer);
          return destPath;
        },
        err => {
          clearTimeout(timer);
          return Promise.reject(err);
        },
      );
    });
};

module.exports = { downloadFileToPath };
