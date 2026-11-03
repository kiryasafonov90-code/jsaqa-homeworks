const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const CinemaPage = require('../../src/pages/cinema.page');

setDefaultTimeout(60_000);

Before(async function () {
  this.browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  this.page = await this.browser.newPage({ viewport: { width: 1440, height: 1000 } });
  this.cinema = new CinemaPage(this.page);
  await this.page.setDefaultTimeout(15_000);
});

After(async function () {
  if (this.browser) await this.browser.close();
});
