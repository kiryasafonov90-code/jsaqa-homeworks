const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const CinemaPage = require('../src/pages/cinema.page');

let browser;
let page;
let cinema;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(20000);
  cinema = new CinemaPage(page);
  await cinema.open();
  await cinema.waitForSchedule();
  await cinema.openFirstAvailableSession();
});

afterEach(async () => {
  if (browser) await browser.close();
});

test('Happy path: бронирование одного свободного места', async () => {
  await cinema.selectAvailableSeats(1);
  await cinema.confirmSeats();

  assert.equal(await cinema.isBookingPage(), true);
  assert.equal(await cinema.getSelectedSeatCount(), 1);
});

test('Happy path: бронирование двух свободных мест', async () => {
  await cinema.selectAvailableSeats(2);
  await cinema.confirmSeats();

  assert.equal(await cinema.isBookingPage(), true);
  assert.equal(await cinema.getSelectedSeatCount(), 2);
});

test('Sad path: занятое место нельзя выбрать', async () => {
  assert.equal(await cinema.hasUnavailableSeat(), true, 'На выбранном сеансе нет занятых мест');
  assert.equal(
    await cinema.unavailableSeatIsNotSelectable(),
    true,
    'Занятое место выбралось или кнопка подтверждения изменила состояние'
  );
});
