/* Copyright 2019 Schibsted */

let fs = require('fs');
let base64 = require('base64-stream');
let Imap = require('imap');
let renamer = require('./../src/helpers/renamer');

module.exports = { scrape };

function scrape(options, scrapeCallback) {
  let uidsToFetch = 0;
  let fileMetas = [];

  let imap = new Imap(options.imap);

  function toUpper(thing) {
    return thing && thing.toUpperCase ? thing.toUpperCase() : thing;
  }

  function findAttachmentParts(struct, attachments) {
    attachments = attachments || [];
    for (let i = 0, len = struct.length, r; i < len; ++i) {
      if (Array.isArray(struct[i])) {
        findAttachmentParts(struct[i], attachments);
      } else {
        if (
          struct[i].disposition &&
          ['INLINE', 'ATTACHMENT'].indexOf(
            toUpper(struct[i].disposition.type),
          ) > -1
        ) {
          attachments.push(struct[i]);
        }
      }
    }
    return attachments;
  }

  function buildSearchCriteria(filter) {
    let criteria = [];

    if (filter.from) {
      criteria.push(['FROM', filter.from]);
    }
    if (filter.to) {
      criteria.push(['TO', filter.to]);
    }
    if (filter.body) {
      criteria.push(['BODY', filter.body]);
    }
    if (filter.subject) {
      criteria.push(['SUBJECT', filter.subject]);
    }
    if (filter.lastXDays) {
      let date = new Date();
      date.setDate(date.getDate() - filter.lastXDays);
      criteria.push(['SINCE', date.toISOString()]);
    }

    criteria.push('UNSEEN');

    return criteria;
  }

  function buildAttMessageFunction(attachment) {
    let filename = attachment.params.name;
    let encoding = attachment.encoding;

    return function(msg, seqno) {
      let prefix = '(#' + seqno + ') ';
      msg.on('body', function(stream, info) {
        //Create a write stream so that we can stream the attachment to file;
        console.log(
          prefix + 'Streaming this attachment to file',
          filename,
          ' renamed to ' + filename,
          info,
        );
        let writeStream = fs.createWriteStream(filename);
        writeStream.on('finish', function() {
          console.log(prefix + 'Done writing to file %s', filename);
        });

        //stream.pipe(writeStream); this would write base64 data to the file.
        //so we decode during streaming using
        if (toUpper(encoding) === 'BASE64') {
          //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
          stream.pipe(base64.decode()).pipe(writeStream);
        } else {
          //here we have none or some other decoding streamed directly to the file which renders it useless probably
          stream.pipe(writeStream);
        }
      });
      msg.once('end', function() {
        console.log(prefix + 'Finished attachment %s', filename);

        fileMetas.push({
          filename: renamer.rename(filename, '', options),
          url: filename,
        });
      });
    };
  }

  imap.once('ready', function() {
    imap.openBox('INBOX', false, function(err, box) {
      if (err) throw err;

      imap.seq.search(buildSearchCriteria(options.filter), function(err, uids) {
        if (err) throw err;
        uidsToFetch = uids;

        try {
          let f = imap.seq.fetch(uidsToFetch, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
            struct: true,
          });

          f.on('message', function(msg, seqno) {
            console.log('Message #%d', seqno);
            let prefix = '(#' + seqno + ') ';
            msg.on('body', function(stream, info) {
              let buffer = '';
              stream.on('data', function(chunk) {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', function() {
                console.log(
                  prefix + 'Parsed header: %s',
                  Imap.parseHeader(buffer),
                );
              });
            });
            msg.once('attributes', function(attrs) {
              let attachments = findAttachmentParts(attrs.struct);

              console.log(prefix + 'Has attachments: %d', attachments.length);
              for (let i = 0, len = attachments.length; i < len; ++i) {
                let attachment = attachments[i];
                console.log(
                  prefix + 'Fetching attachment %s',
                  attachment.params.name,
                );
                let f = imap.fetch(attrs.uid, {
                  //do not use imap.seq.fetch here
                  bodies: [attachment.partID],
                  struct: true,
                  markSeen: true,
                });
                //build function to process attachment message
                f.on('message', buildAttMessageFunction(attachment));
              }
            });
            msg.once('end', function() {
              console.log(prefix + 'Finished email');
            });
          });
          f.once('error', function(err) {
            console.log('Fetch error: ' + err);
          });
          f.once('end', function() {
            console.log('Done fetching all messages!');

            // move messages to the Downloaded inbox
            imap.move(uidsToFetch, 'Downloaded', function(err) {
              if (err) {
                console.log(
                  'Could not move messages to the Downloaded inbox.',
                  uidsToFetch,
                );
              } else {
                console.log(
                  'Moved messages to the Downloaded inbox.',
                  uidsToFetch,
                );
              }

              imap.setFlags(uids, ['\\Seen'], function(err) {
                if (!err) {
                  console.log('Marked as read');
                } else {
                  console.log(err);
                }
                imap.end();
                scrapeCallback(null, fileMetas);
              });
            });
          });
        } catch (e) {
          console.log('Error fetching messages', e);
          // Let the process complete (nothing to handle)
          scrapeCallback(null, []);
        }
      });
    });

    imap.once('error', function(err) {
      console.log(err);
    });

    imap.once('end', function() {
      console.log('Connection ended');
    });
  });

  imap.connect();
}
