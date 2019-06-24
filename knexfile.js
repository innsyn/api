const config = require('./config');

module.exports = {
  development: {
    client: 'postgresql',
    connection: config.get('db.connection'),
    pool: {
      min: 10,
      max: 20,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'postgresql',
    connection: config.get('db.connection'),
    pool: {
      min: 10,
      max: 20,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
};
