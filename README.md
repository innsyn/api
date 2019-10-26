# Innsyn

## Introduction

This repository holds the code for the API that powers Innsyn.no.

## Running it

### Setup

Before being able to setup we assume that Node.js, PostgreSQL and Chromium have been installed on your machine.
If you use macOS all of the above can be installed using [brew](https://brew.sh/).

#### Installing dependencies

```
npm install
```

#### Starting the first time

Before being able to run the app, for the first time, you will need to setup the database and database connection string. By default the database name is `innsyn` running under the user `postgres:postgres` (config can be found [here](config.js#28)). This value can be overriden by creating `development.json` inside the `config` folder with [development.json.example](config/development.json.example) as a base. You will also need to set the executable_path for Chromium which is included as an example in the latter file.

After this you can run the database migrations and seed the database by running:

```
node ./node_modules/.bin/knex migrate:latest
node ./node_modules/.bin/knex seed:run
```

**_IMPORTANT_**: Whenever you seed the database you will **_DESTORY_** all data in the database.

#### Staring the application

```
npm run start:web
```

#### Crawling a website

Once the steps above have been succesfull you can crawl a site by running e.g:

```
node ./tasks/syncFromWeb.js aust-agder-fylkeskommune
```

### Requirements

- Knowledge of [Objection.js](https://vincit.github.io/objection.js)
- Knowledge of [Puppeteer](https://github.com/GoogleChrome/puppeteer)
- Chromium
- PostgreSQL
- Node.js 10.\*

### FAQ

**Error: Chromium revision is not downloaded. Run "npm install" or "yarn install"**

You need to let the project know about your Chromium (or Chrome) install, e.g. by setting the CHROME_BIN varible:

```
export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```


