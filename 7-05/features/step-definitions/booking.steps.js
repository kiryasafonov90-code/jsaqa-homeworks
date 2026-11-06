const { Given, When, Then } = require('@cucumber/cucumber');
const { strict: assert } = require('node:assert');

Given('открыта страница расписания кинотеатра', async function () {
  await this.cinema.open();
  await this.cinema.waitForSchedule();
});

When('выбран ближайший сеанс со свободными местами', async function () {
  await this.cinema.openFirstAvailableSession({ requiredSeats: 2 });
});

When('выбран сеанс с занятыми местами', async function () {
  await this.cinema.openFirstAvailableSession({ requiredSeats: 0, requireTaken: true });
});

When('выбрано {int} свободное место', async function (count) {
  await this.cinema.selectAvailableSeats(count);
});

When('выбрано {int} свободных места', async function (count) {
  await this.cinema.selectAvailableSeats(count);
});

When('подтвержден выбор мест', async function () {
  await this.cinema.confirmSeats();
});

Then('отображается страница подтверждения бронирования', async function () {
  assert.equal(await this.cinema.isBookingPage(), true, 'Не открылась страница подтверждения заказа');
});

Then('в заказе указано {int} место', async function (count) {
  assert.equal(await this.cinema.getSelectedSeatCount(), count, 'Неверное количество мест в заказе');
});

Then('занятое место нельзя выбрать', async function () {
  assert.equal(
    await this.cinema.unavailableSeatIsNotSelectable(),
    true,
    'Занятое место было выбрано или кнопка подтверждения активировалась'
  );
});
