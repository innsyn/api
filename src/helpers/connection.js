/* Copyright 2019 Schibsted */

const massive = require('massive');
const config = require('../../config');

module.exports = { getConnection, getConnectionAsPromise };

let reusableConnection = null;

function getConnection() {
  if (reusableConnection) {
    return reusableConnection;
  }
  const config = getDbConfiguration();

  try {
    reusableConnection = massive.connectSync(config);
    return reusableConnection;
  } catch (e) {
    console.log('Error connecting to DB', e);
    throw e;
  }
}

function getConnectionAsPromise() {
  return new Promise(function(resolve, reject) {
    if (reusableConnection) {
      resolve(reusableConnection);
    } else {
      let config = getDbConfiguration();

      massive.connect(config, function(err, connection) {
        if (err) {
          reject('Error connecting to DB' + err);
        } else {
          reusableConnection = connection;
          resolve(connection);
        }
      });
    }
  });
}

function getDbConfiguration() {
  const connectionString = config.get('db.connection');
  const dbSchema = config.get('db.schema');

  if (!connectionString) {
    throw Error('API needs database, check config');
  }

  return {
    schema: dbSchema,
    connectionString: connectionString,
  };
}
