/* Copyright 2019 Schibsted */

/**
 * Scraper that scrapes a list of urls or HTML from a source. Scraper
 * configuration must be provided.
 * */
let cheerio = require('cheerio');
let utils = require('./../src/helpers/taskUtils');
let renamer = require('./../src/helpers/renamer');
let dateFormatYYYMMDDhhmm = require('../src/helpers/dateFunctions')
  .dateFormatYYYMMDDhhmm;
let Bottleneck = require('bottleneck');
const puppeteer = require('puppeteer-core');
const config = require('../config.js');

module.exports = { scrape, getUrlsFromOptions };

/***
 *
 * @param options
 * @param scrapeCallback
 */
function scrape(options, scrapeCallback) {
  let limiter = new Bottleneck(1, options.delayBetweenRequests || 500);
  let results = [];
  let urls = getUrlsFromOptions(options);

  let fn = options.htmlOnly ? getWholePage : getUrlListForPage;

  urls.forEach(function(url) {
    limiter.submit(fn, options, url, function(err, result) {
      console.log('Scraped ' + url);
      results.push(result);
    });
  });

  limiter.on('idle', function() {
    let allResults = [];
    results.forEach(function(item) {
      // different handling for HTML source and lists
      if (Array.isArray(item)) {
        allResults.push(...item);
      } else {
        allResults.push(item);
      }
    });
    scrapeCallback(null, options.htmlOnly ? results : allResults);
  });
}

function getUrlsFromOptions(options) {
  let urls = [];

  if (options.paging) {
    let paging = options.paging;

    let pagingType = options.paging.type || 'offset';

    for (let i = 0; i < paging.numberOfPages; i++) {
      let url = '';

      if (pagingType === 'offset') {
        let offset =
          i === 0
            ? paging.offsetStart
            : paging.offsetStart + paging.offsetStep * i;
        url = paging.urlPattern.replace('{OFFSET}', offset.toString());
        url = utils.replacePlaceholders(url);
        urls.push(url);
      } else if (pagingType === 'date') {
        let dateOffset = paging.dateOffset || 0;
        let date = new Date();
        date.setDate(date.getDate() - (i + dateOffset));

        if (options.paging.offsetPerDate) {
          for (
            let o = options.paging.offsetStart;
            o <= options.paging.maxOffset;
            o += options.paging.offsetStep
          ) {
            urls.push(
              utils.replacePlaceholders(paging.urlPattern, {
                date: date,
                dateFormat: options.paging.dateFormat,
                offset: o,
              }),
            );
          }
        } else {
          urls.push(
            utils.replacePlaceholders(paging.urlPattern, {
              date: date,
              dateFormat: options.paging.dateFormat,
            }),
          );
        }
      }
    }
  } else {
    urls.push(options.url);
  }

  return urls;
}

function getUrlListForPage(options, url, callback) {
  url = utils.replacePlaceholders(url);

  getHtml(url, options, function(err, html) {
    console.log('Getting PDF urls from ' + url);
    let anchors = getUrlList(options, html);
    let fileMeta = getFilenames(options, html, anchors);
    callback(err, fileMeta);
  });
}

function getWholePage(options, url, callback) {
  url = utils.replacePlaceholders(url);
  getHtml(url, options, function(err, html) {
    let filename = renamer.rename(
      dateFormatYYYMMDDhhmm(new Date()),
      '',
      options,
    );

    callback(err, {
      filename: filename,
      html: html,
    });
  });
}

function getHtml(url, options, callback) {
  (async () => {
    try {
      const args = [
        '--no-sandbox',
        '--headless',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ];
      const options = {
        args,
        ignoreHTTPSErrors: true,
        executablePath: config.get('puppeteer.executable_path'),
      };

      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto(url);

      const html = await page.content();

      await browser.close();

      callback(null, html);
    } catch (err) {
      callback(err, null);
    }
  })();
}

function getUrlList(options, html) {
  let anchors = [];

  // handling with regex
  if (options.filenameRegex) {
    let match;
    while ((match = options.filenameRegex.exec(html))) {
      anchors.push({ url: match[1], title: '' });
    }
  } else if (options.type === 'json') {
    const $ = cheerio.load(html);

    const result = JSON.parse($('pre').text());

    return result.map(function(element) {
      return {
        url: decodeURI(element[options.urlPath]),
        title: element[options.titlePath],
      };
    });
  }
  // handling with cheerio
  else {
    const $ = cheerio.load(html);

    anchors = $(options.anchorTagSelector)
      .map(function() {
        return {
          url: $(this).attr('href'),
          title: $(this).attr('title'),
        };
      })
      .get() // jQuery / Cheerio returns weird stuff.. see: https://stackoverflow.com/questions/39044690/cheerio-map-strange-behaviour
      .map(function(item) {
        return {
          url: decodeURIComponent(
            JSON.parse('"' + item.url.replace(/"/g, '\\"') + '"'),
          ),
          title: item.title,
        };
      })
      .reduce(function(acc, { url, title }) {
        // TODO: Propper URL building...
        acc.push({
          url: url.startsWith('http') ? url : `${options.basePath}${url}`,
          title,
        });

        return acc;
      }, []);
  }

  return anchors;
}

function decodeHtmlEntities(text) {
  let $ = cheerio.load('<html><head><body></body></head></html>');
  return $('<textarea/>')
    .html(text)
    .text();
}

function getFilenames(options, html, anchors) {
  let fileMeta = [];

  for (let anchor of anchors) {
    let filename = '';
    if (options.useTitleAttributeAsFilename) {
      filename = anchor.title;
    } else if (options.filenamePattern) {
      let match = anchor.url.match(options.filenamePattern);
      if (match) {
        filename = match[match.length - 1];
      } else {
        continue; // not a valid file name
      }
    } else {
      filename = anchor.url.substring(anchor.url.lastIndexOf('/') + 1);
    }

    filename = renamer.rename(filename, html, options);

    fileMeta.push({
      url: anchor.url,
      filename: filename,
    });
  }

  return fileMeta;
}
