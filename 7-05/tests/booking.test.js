const { openSession, selectSeats, showBooking, ticketSeatCount, bookingDisabled } = require('../src/cinema');

// Завтрашний день, первый сеанс; при необходимости индексы можно поменять.
const DAY = 2;
const SESSION = 1;

beforeEach(async () => {
  await openSession(page, DAY, SESSION);
});

test('Happy path: одно свободное место', async () => {
  await selectSeats(page, 1);
  await showBooking(page);
  expect(await ticketSeatCount(page)).toBe(1);
});

test('Happy path: два свободных места', async () => {
  await selectSeats(page, 2);
  await showBooking(page);
  expect(await ticketSeatCount(page)).toBe(2);
});

test('Sad path: без выбора мест бронирование недоступно', async () => {
  expect(await bookingDisabled(page)).toBe(true);
});

