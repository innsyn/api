/* Copyright 2019 Schibsted */

const fetch = require('node-fetch');
const puppeteer = require('puppeteer-core');
const { DateTime } = require('luxon');
const queryString = require('query-string');
const _ = require('lodash');

const Source = require('../models/source');
const parserHelper = require('../parsers');
const { mapJournalsToDb } = require('../../../src/helpers/databaseMapper');
const { save } = require('../../../src/helpers/journalSaver');

/**
 * Function to extract content (HTML or JSON) from a page.
 *
 * @param {*} page
 * @param {*} config
 */
const getContent = async function(page, config) {
  const pages = [];

  if (typeof config.getContent === 'function') {
    pages.push(...(await config.getContent(page, config)));
  } else if (
    typeof config.mode === 'string' &&
    config.mode.toUpperCase() === 'JSON'
  ) {
    pages.push({
      request: config.request,
      content: await page.evaluate(() => {
        return JSON.parse(document.querySelector('body').innerText);
      }),
    });
  } else {
    pages.push({
      request: config.request,
      content: await page.content(),
    });
  }

  return pages;
};

let browser = null;

/**
 * Function to get a browser instance.
 */
const getBrowser = async () => {
  if (browser) {
    return browser;
  }

  const args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  const puppeteerconfig = {
    args,
    headless: true,
    ignoreHTTPSErrors: false,
    executablePath: process.env.CHROME_BIN,
  };

  browser = await puppeteer.launch(puppeteerconfig);

  return browser;
};

/**
 *
 * @param {*} config
 */
const scrape = async function(config) {
  try {
    const browser = await getBrowser();

    const page = await browser.newPage();

    // page.on('console', consoleObj => console.log(consoleObj.text()));

    const pages = [];

    await page.goto(config.request.url);

    // Support for a POST request.
    if (config.request.method.toUpperCase() === 'POST') {
      const response = await fetch(config.request.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: config.request.postData,
      });

      page.setContent(await response.text());
    }

    if (config.pagination) {
      let currentPage = 1;
      let pagesToScrape = 1;
      let nextSelector = null;

      const paginationUrls = [];

      while (currentPage <= pagesToScrape) {
        console.log(`Scraping: ${page.url()}`);
        console.log(`Scraping: ${config.request.postData}`);

        // Since the containerSelector can be an element that not gets painted (read: no pagination element due to no documents on the page) we have to fallback.
        await Promise.race([
          page.waitForSelector(
            _.get(config, 'pagination.containerSelector', 'body'),
          ),
          page.waitFor(3000),
        ]);

        // TODO: Do it based on weather the next buttons is active?
        if (typeof config.pagination.evaluate === 'function') {
          const result = await page.evaluate(config.pagination.evaluate);

          if (Array.isArray(result.paginationUrls))
            paginationUrls.push(...result.paginationUrls);

          const makeUpAName = [
            ...new Set(paginationUrls.map(paginationUrl => paginationUrl.text)),
          ];

          pagesToScrape = makeUpAName.length || 1;

          if (result.nextSelector) nextSelector = result.nextSelector;
        }

        pages.push(...(await getContent(page, config)));

        if (currentPage < pagesToScrape) {
          const triggers = [
            page.click(nextSelector || config.pagination.nextSelector),
          ];

          config.pagination.async
            ? triggers.push(
                page.waitForSelector(config.pagination.waitForSelector),
              )
            : page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });

          await Promise.all(triggers);
        }

        currentPage++;
      }
    }

    await page.close();

    return {
      pages,
    };
  } catch (err) {
    console.log(err);
  }
};

const parsePostData = function(postData) {
  // Check if undefined.
  if (typeof postData === 'undefined') {
    return '';
  }

  // Check if string.
  if (typeof postData === 'string') {
    return postData;
  }

  // Check if object.
  if (typeof postData === 'object') {
    return queryString.stringify(postData, { encode: false });
  }

  throw new Error('Invalid postData.');
};

/**
 *
 */
class Scraper {
  constructor(config) {
    const { sourceId, baseUrl, scraper, parser } = config;

    this.sourceId = sourceId;
    this.baseUrl = baseUrl;
    this.scraper = scraper;
    this.parser = parser;

    this.allowedMethods = ['GET', 'POST'];

    // Methods
    this.generateRequests = this.generateRequests.bind(this);

    this.run = this.run.bind(this);
  }

  /**
   *
   * @param {*} reverse
   */
  generateRequests(reverse = true) {
    const requests = [];

    const config = this.scraper.pagination.generate;
    const {
      type = { name: 'offset' },
      urlPattern,
      numberOfPages,
      offsetStart,
      offsetStep,
      request: { method, postData } = { method: 'GET' },
    } = config;

    // Check if (HTTP) method is allowed.
    if (!this.allowedMethods.includes(method)) {
      throw new Error(
        `Methods is not allowed. Only the following methods are allowed: ${allowedMethods.join(
          ', ',
        )}`,
      );
    }

    for (let i = 0; i < numberOfPages; i++) {
      const request = {
        method: method.toUpperCase(),
        url: urlPattern,
        postData: parsePostData(postData),
      };

      if (type.name === 'offset') {
        const regex = /{OFFSET}/g;
        const offset = i === 0 ? offsetStart : offsetStart + offsetStep * i;

        if (method.toUpperCase() === 'GET') {
          request.url = urlPattern.replace(regex, offset.toString());
        }

        if (method.toUpperCase() === 'POST') {
          request.postData = request.postData.replace(regex, offset.toString());
        }
      }

      if (type.name === 'date') {
        const date = DateTime.local().minus({ days: i });
        const format = _.get(type, 'config.format', 'dd.MM.yyyy');

        const regex = /{FULL_DATE}/g;

        if (method.toUpperCase() === 'GET') {
          request.url = urlPattern.replace(regex, date.toFormat(format));
        }

        if (method.toUpperCase() === 'POST') {
          request.postData = request.postData.replace(
            regex,
            date.toFormat(format),
          );
        }
      }

      requests.push(request);
    }

    return reverse === true ? requests.reverse() : requests;
  }

  /**
   *
   */
  async run() {
    try {
      const source = await Source.getBy({ id: this.sourceId });

      const parser = parserHelper.getParserByName(this.parser.name);

      const requests = this.generateRequests();

      const parserConfig = {
        ...this.parser,
        baseUrl: this.baseUrl,
      };

      for (let request of requests) {
        const scraperConfig = {
          ...this.scraper,
          request,
        };

        const { pages } = await scrape(scraperConfig);

        const parsedPages = pages.map(html => parser.parse(html, parserConfig));
        const journals = mapJournalsToDb(parsedPages, source);

        console.log(
          `About to persist ${journals.length} entries from: ${
            scraperConfig.request.url
          }.`,
        );

        await save(journals);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = { scrape, Scraper };
