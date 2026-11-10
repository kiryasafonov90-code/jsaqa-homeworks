const CinemaPage = require('../src/pages/cinema.page');

const DAY = 2;
const SESSION = 1;

let cinema;

beforeEach(async () => {
  cinema = new CinemaPage(page);
  await cinema.openSession(DAY, SESSION);
});

test('Happy path: бронирование одного свободного места', async () => {
  await cinema.selectSeats(1);
  await cinema.confirmSeats();
  expect(await cinema.getTicketSeatCount()).toBe(1);
});

test('Happy path: бронирование двух свободных мест', async () => {
  await cinema.selectSeats(2);
  await cinema.confirmSeats();
  expect(await cinema.getTicketSeatCount()).toBe(2);
});

test('Sad path: без выбора мест кнопка бронирования неактивна', async () => {
  expect(await cinema.isBookingButtonDisabled()).toBe(true);
});
