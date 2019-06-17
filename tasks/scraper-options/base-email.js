/* Copyright 2019 Schibsted */
const config = require('../../config.js');

module.exports = {
  get: function() {
    console.log(
      config.get('email.incoming.auth.user'),
      config.get('email.incoming.auth.password'),
      config.get('email.incoming.host'),
      config.get('email.incoming.port'),
      config.get('email.incoming.secure'),
    );
    return {
      type: 'email',
      s3: {
        bucket: 'innsyn',
      },
      sourceId: -1,
      imap: {
        user: config.get('email.incoming.auth.user'),
        password: config.get('email.incoming.auth.password'),
        host: config.get('email.incoming.host'),
        port: config.get('email.incoming.port'),
        tls: config.get('email.incoming.secure'),
      },
      filter: {
        from: '',
        to: '',
        subject: '',
        body: '',
        lastXDays: 14,
      },
    };
  },
};
