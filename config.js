const convict = require('convict');
const fs = require('fs');

// Define a schema
const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 5050,
    env: 'PORT',
  },
  db: {
    client: {
      doc: '',
      format: 'String',
      default: 'pg',
      env: 'DATABASE_CLIENT',
    },
    connection: {
      doc: '',
      format: 'String',
      default: 'postgres://postgres:postgres@localhost:5432/innsyn',
      env: 'DATABASE_URL',
    },
    schema: {
      doc: '',
      format: 'String',
      default: 'public',
      env: 'DATABASE_SCHEMA',
    },
    debug: {
      doc: '',
      format: 'Boolean',
      default: false,
      env: 'DEBUG',
    },
    migrations: {
      tableName: {
        doc: '',
        format: 'String',
        default: 'migrations',
      },
    },
  },
  aws: {
    s3: {
      access_key_id: {
        doc: '',
        format: 'String',
        default: '',
        env: 'S3_DOCUMENTS_ACCESSKEYID',
      },
      secret_access_key: {
        doc: '',
        format: 'String',
        default: '',
        env: 'S3_DOCUMENTS_SECRETACCESSKEY',
      },
    },
  },
  smtp: {
    host: {
      doc: '',
      format: 'String',
      default: '',
      env: 'EMAIL_SMTP_HOST',
    },
    port: {
      doc: '',
      format: 'String',
      default: '',
      env: 'EMAIL_SMTP_PORT',
    },
    secure: {
      doc: '',
      format: 'Boolean',
      default: '',
      env: 'EMAIL_SMTP_SECURE',
    },
    auth: {
      user: {
        doc: '',
        format: 'String',
        default: '',
        env: 'INCOMING_MAIL_ADDRESS',
      },
      password: {
        doc: '',
        format: 'String',
        default: '',
        env: 'INCOMING_MAIL_PASSWORD',
      },
    },
    fromAddress: {
      doc: '',
      format: 'String',
      default: '',
      env: 'INCOMING_MAIL_ADDRESS',
    },
  },
  email: {
    incoming: {
      host: {
        doc: '',
        format: 'String',
        default: '',
        env: 'EMAIL_SMTP_HOST',
      },
      port: {
        doc: '',
        format: 'String',
        default: '',
        env: 'EMAIL_SMTP_PORT',
      },
      secure: {
        doc: '',
        format: 'Boolean',
        default: true,
      },
      auth: {
        user: {
          doc: '',
          format: 'String',
          default: '',
          env: 'INCOMING_MAIL_ADDRESS',
        },
        password: {
          doc: '',
          format: 'String',
          default: '',
          env: 'INCOMING_MAIL_PASSWORD',
        },
      },
    },
  },
  backup: {
    s3: {
      access_key_id: {
        doc: '',
        format: 'String',
        default: '',
        env: 'S3_INNSYNDB_BACKUP_ACCESSKEYID',
      },
      secret_access_key: {
        doc: '',
        format: 'String',
        default: '',
        env: 'S3_INNSYNDB_BACKUP_SECRETACCESSKEY',
      },
    },
  },
  puppeteer: {
    executable_path: {
      doc: '',
      format: 'String',
      default: '/usr/bin/chromium-browser',
      env: 'CHROME_BIN',
    },
  },
  notifications: {
    email: {
      receivers: {
        doc: '',
        format: 'String',
        default: '',
        env: 'EMAIL_NOTIFICATION_RECEIVERS',
      },
    },
  },
});

const env = config.get('env');
try {
  const path = `${__dirname}/config/${env}.json`;

  fs.accessSync(path, fs.F_OK);

  config.loadFile(path);
} catch (err) {
  console.log(err);
}

config.validate({ allowed: 'strict' });

module.exports = config;
