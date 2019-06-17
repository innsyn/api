/* Copyright 2019 Schibsted */

const config = require('../config.js');
const mailSender = require('./../src/helpers/mailSender');
const connection = require('./../src/helpers/connection');
const {
  getGlobalConfigurationProperty,
  setGlobalConfigurationProperty,
  getLargestJournalId,
} = require('./../src/helpers/queries');

checkAndSendMail()
  .then(function() {
    console.log('done');
    process.exit(0);
  })
  .catch(function(err) {
    console.error('Error', err);
    process.exit(1);
  });

async function checkAndSendMail() {
  const LAST_JOURNAL_ID_CHECKED_FOR_REMARKS =
    'notification.lastJournalIdCheckedForRemarks';

  const lastJournalIdCheckedForRemarks = await getGlobalConfigurationProperty(
    LAST_JOURNAL_ID_CHECKED_FOR_REMARKS,
  );
  const files = await getFiles(lastJournalIdCheckedForRemarks.value || 0);

  let emailSubject = '';
  let emailText = '';

  if (files.length > 0) {
    emailSubject += 'VIKTIG! Fant filer med personnummer';
    emailText =
      'Husk: Personnummer funnet i filer er allerede anonymisert på innsyn.no.\n\n';
    emailText += formatText(files);
  } else {
    emailSubject += 'Ingen nye filer med personnummer funnet';
    emailText = 'Sjekker igjen om et døgn!';
  }
  emailText += "\nmvh\nBot'en på Innsyn.no";

  const sendResult = await mailSender.sendMailAsText(
    config.get('notifications.email.receivers'),
    emailSubject,
    emailText,
  );
  console.log('Receiver(s): ', sendResult.accepted);

  const jId = await getLargestJournalId();
  await setGlobalConfigurationProperty(
    LAST_JOURNAL_ID_CHECKED_FOR_REMARKS,
    jId,
  );
}

function getFiles(lastJournalIdCheckedForRemarks) {
  return new Promise(function(resolve, reject) {
    connection.getConnectionAsPromise().then(function(db) {
      db.getFilesWithSSNs(lastJournalIdCheckedForRemarks, function(err, res) {
        if (err) reject(err);
        else resolve(res);
      });
    });
  });
}

function formatText(files) {
  let text = '';
  for (let file of files) {
    for (let prop in file) {
      text += prop + ': ' + file[prop] + '\n';
    }
    text += '\n';
  }
  return text;
}
