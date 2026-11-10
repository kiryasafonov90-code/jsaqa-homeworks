const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const CinemaPage = require('../src/pages/cinema.page');

const DAY = 2;
const SESSION = 1;

describe('Puppeteer: бронирование билетов', { timeout: 60_000 }, () => {
  let browser;
  let cinema;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(15_000);
    cinema = new CinemaPage(page);
    await cinema.openSession(DAY, SESSION);
  });

  afterEach(async () => {
    if (browser) await browser.close();
  });

  it('happy path: бронирование одного места', async () => {
    await cinema.selectAvailableSeats(1);
    await cinema.confirmSeats();

    assert.equal(await cinema.isBookingPage(), true);
    assert.equal(await cinema.getSelectedSeatCount(), 1);
  });

  it('happy path: бронирование двух мест', async () => {
    await cinema.selectAvailableSeats(2);
    await cinema.confirmSeats();

    assert.equal(await cinema.isBookingPage(), true);
    assert.equal(await cinema.getSelectedSeatCount(), 2);
  });

  it('sad path: без выбора мест кнопка бронирования неактивна', async () => {
    assert.equal(await cinema.isBookingButtonDisabled(), true);
  });
});
