const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const CinemaPage = require('../../src/pages/cinema.page');

Given('открыт день {int} и сеанс {int}', async function (day, session) {
  this.cinema = new CinemaPage(this.page);
  await this.cinema.openSession(day, session);
});

When('выбрано {int} свободное место', async function (count) {
  await this.cinema.selectSeats(count);
});

When('выбрано {int} свободных места', async function (count) {
  await this.cinema.selectSeats(count);
});

When('подтвержден выбор мест', async function () {
  await this.cinema.confirmSeats();
});

Then('в билете указано мест: {int}', async function (count) {
  assert.equal(await this.cinema.getTicketSeatCount(), count);
});

Then('кнопка бронирования неактивна', async function () {
  assert.equal(await this.cinema.isBookingButtonDisabled(), true);
});
