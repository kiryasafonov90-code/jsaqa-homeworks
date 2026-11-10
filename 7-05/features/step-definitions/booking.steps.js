const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');

Given('открыт день {int} и сеанс {int}', async function (day, session) {
  await this.cinema.openSession(day, session);
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

Then('отображается страница подтверждения', async function () {
  assert.equal(
    await this.cinema.isBookingPage(),
    true,
    'Страница подтверждения бронирования не открылась'
  );
});

async function verifySeatCount(count) {
  assert.equal(
    await this.cinema.getSelectedSeatCount(),
    count,
    'Количество мест в заказе не совпадает с выбранным'
  );
}

Then('в заказе указано {int} место', verifySeatCount);
Then('в заказе указано {int} места', verifySeatCount);

Then('кнопка бронирования неактивна', async function () {
  assert.equal(
    await this.cinema.isBookingButtonDisabled(),
    true,
    'Кнопка бронирования должна быть неактивна без выбранных мест'
  );
});
