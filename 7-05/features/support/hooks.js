const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');

setDefaultTimeout(60000);

Before(async function () {
  this.browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  this.page = await this.browser.newPage();
  this.page.setDefaultTimeout(15000);
});

After(async function () {
  if (this.browser) await this.browser.close();
});
