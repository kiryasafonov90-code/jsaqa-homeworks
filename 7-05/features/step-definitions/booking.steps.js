const { Given, When, Then } = require('@cucumber/cucumber');
const { strict: assert } = require('node:assert');

Given('открыта страница расписания кинотеатра', async function () {
  await this.cinema.open();
  await this.cinema.waitForSchedule();
});

When('выбран ближайший сеанс со свободными местами', async function () {
  await this.cinema.openFirstAvailableSession();
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
  assert.equal(await this.cinema.getSelectedSeatCount(), count, 'Количество мест в заказе не совпадает');
});

Then('занятое место нельзя выбрать', async function () {
  assert.equal(await this.cinema.hasUnavailableSeat(), true, 'На схеме нет занятого места для негативной проверки');
  assert.equal(await this.cinema.unavailableSeatIsNotSelectable(), true,
    'Занятое место доступно для выбора или кнопка подтверждения активна');
});
