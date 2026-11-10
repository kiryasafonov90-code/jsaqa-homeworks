const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const CinemaPage = require('../src/pages/cinema.page');

describe('Задание 1: Puppeteer — бронирование билетов', { timeout: 120_000 }, () => {
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
  });

  afterEach(async () => {
    if (browser) await browser.close();
  });

  it('happy path: бронирование одного свободного места', async () => {
    await cinema.openFirstAvailableSession({ requiredSeats: 1 });
    await cinema.selectAvailableSeats(1);
    await cinema.confirmSeats();

    assert.equal(await cinema.isBookingPage(), true);
    assert.equal(await cinema.getSelectedSeatCount(), 1);
  });

  it('happy path: бронирование двух свободных мест', async () => {
    await cinema.openFirstAvailableSession({ requiredSeats: 2 });
    await cinema.selectAvailableSeats(2);
    await cinema.confirmSeats();

    assert.equal(await cinema.isBookingPage(), true);
    assert.equal(await cinema.getSelectedSeatCount(), 2);
  });

  it('sad path: занятое место нельзя выбрать', async () => {
    await cinema.openFirstAvailableSession({
      requiredSeats: 0,
      requireTaken: true
    });

    assert.equal(await cinema.unavailableSeatIsNotSelectable(), true);
  });
});
