const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const CinemaPage = require('../../src/pages/cinema.page');

setDefaultTimeout(120_000);

Before(async function () {
  this.browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  this.page = await this.browser.newPage();
  this.page.setDefaultTimeout(15_000);
  this.cinema = new CinemaPage(this.page);
});

After(async function () {
  if (this.browser) await this.browser.close();
});
