/* Copyright 2019 Schibsted */

module.exports = {
  get: function() {
    return {
      sourceId: 153,
      scraper: {
        async getContent(page, config) {
          const pages = [];
          const parentURL = page.url();

          const urls = await page.evaluate(() => {
            const urls = [];
            const rows = document.querySelectorAll(
              '#itemListView > tbody > tr',
            );

            const elements = Array.from(rows)
              .filter(
                item =>
                  item.querySelector('td.tdRegistryCasenummer > a') !== null,
              )
              .map(row => row.querySelector('td.content-description > a'));

            for (let element of elements) {
              urls.push(
                `https://einnsyn.hfk.no${element.getAttribute('href')}`,
              );
            }

            return urls;
          });

          for (let url of urls) {
            console.log(`Scraping: ${page.url()}`);
            await page.goto(url);
            pages.push({
              request: config.request,
              content: await page.content(),
            });
          }

          await page.goto(parentURL);

          return pages;
        },
        pagination: {
          generate: {
            request: {
              method: 'POST',
              postData: {
                FromDate: '{FULL_DATE}',
                ToDate: '{FULL_DATE}',
              },
            },
            type: {
              name: 'date',
            },
            urlPattern: 'https://einnsyn.hfk.no/eInnsyn/',
            offsetStart: 1,
            offsetStep: 1,
            numberOfPages: 10,
          },
        },
      },
      parser: {
        name: 'Elements',
      },
    };
  },
};
