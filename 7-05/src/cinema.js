const BASE_URL = process.env.BASE_URL || 'http://qamid.tmweb.ru/client/index.php';

// Номера дня и сеанса начинаются с 1, как в расписании.
async function openSession(page, day, session) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.page-nav__day');

  const days = await page.$$('.page-nav__day');
  if (!days[day - 1]) throw new Error(`День ${day} не найден`);
  await days[day - 1].click();
  await page.waitForFunction(
    (index) => document.querySelectorAll('.page-nav__day')[index]?.classList.contains('page-nav__day_chosen'),
    {},
    day - 1
  );

  await page.waitForSelector('.movie-seances__time');
  const sessions = await page.$$('.movie-seances__time');
  if (!sessions[session - 1]) throw new Error(`Сеанс ${session} в день ${day} не найден`);
  await sessions[session - 1].click();
  await page.waitForSelector('.buying-scheme__chair');
}

async function selectSeats(page, count) {
  const seats = await page.$$('.buying-scheme__chair_standart, .buying-scheme__chair_vip');
  if (seats.length < count) throw new Error(`Свободных мест ${seats.length}, нужно ${count}`);

  for (const seat of seats.slice(0, count)) await seat.click();
  await page.waitForFunction(
    (expected) => document.querySelectorAll('.buying-scheme__chair_selected').length === expected,
    {},
    count
  );
}

async function showBooking(page) {
  await page.click('.acceptin-button');
  await page.waitForSelector('.ticket__chairs');
  // Не нажимаем «Получить код бронирования»: места остаются свободными.
}

async function ticketSeatCount(page) {
  const text = await page.$eval('.ticket__chairs', (node) => node.textContent.trim());
  return text.split(',').filter(Boolean).length;
}

async function bookingDisabled(page) {
  return page.$eval('.acceptin-button', (button) => button.disabled);
}

module.exports = { openSession, selectSeats, showBooking, ticketSeatCount, bookingDisabled };

