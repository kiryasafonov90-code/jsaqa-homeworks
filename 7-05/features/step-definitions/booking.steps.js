const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { openSession, selectSeats, showBooking, ticketSeatCount, bookingDisabled } = require('../../src/cinema');

Given('открыт день {int} и сеанс {int}', async function (day, session) {
  await openSession(this.page, day, session);
});

When('выбираю свободных мест: {int}', async function (count) {
  await selectSeats(this.page, count);
});

When('перехожу к подтверждению', async function () {
  await showBooking(this.page);
});

Then('в билете указано мест: {int}', async function (count) {
  assert.equal(await ticketSeatCount(this.page), count);
});

Then('кнопка бронирования неактивна', async function () {
  assert.equal(await bookingDisabled(this.page), true);
});

