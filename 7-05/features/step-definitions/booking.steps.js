const { When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');

When('выбран сеанс со свободными местами', async function () {
  await this.cinema.openFirstAvailableSession({ requiredSeats: 2 });
});

When('выбран сеанс с занятыми местами', async function () {
  await this.cinema.openFirstAvailableSession({
    requiredSeats: 0,
    requireTaken: true
  });
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
  assert.equal(
    await this.cinema.isBookingPage(),
    true,
    'Не открылась страница подтверждения заказа'
  );
});

async function verifySeatCount(count) {
  assert.equal(
    await this.cinema.getSelectedSeatCount(),
    count,
    'Неверное количество мест в заказе'
  );
}

Then('в заказе указано {int} место', verifySeatCount);
Then('в заказе указано {int} места', verifySeatCount);

Then('занятое место нельзя выбрать', async function () {
  assert.equal(
    await this.cinema.unavailableSeatIsNotSelectable(),
    true,
    'Занятое место было выбрано или кнопка подтверждения стала активной'
  );
});
