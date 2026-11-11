const BASE_URL = process.env.BASE_URL || 'http://qamid.tmweb.ru/client/index.php';

const SEAT_SELECTOR =
  '.buying-scheme__chair_standart, .buying-scheme__chair_vip';

// Номера дня и сеанса начинаются с 1, как в расписании.
async function openSession(page, day, session) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.page-nav__day');

  const days = await page.$$('.page-nav__day');
  if (!days[day - 1]) throw new Error(`День ${day} не найден`);

  await days[day - 1].click();
  await page.waitForFunction(
    (index) =>
      document
        .querySelectorAll('.page-nav__day')[index]
        ?.classList.contains('page-nav__day_chosen'),
    {},
    day - 1
  );

  await page.waitForSelector('.movie-seances__time');
  const sessions = await page.$$('.movie-seances__time');
  if (!sessions[session - 1]) {
    throw new Error(`Сеанс ${session} в день ${day} не найден`);
  }

  await sessions[session - 1].click();

  // Не считаем образцы из легенды залом. Ждём, пока места действительно
  // появятся и hall.js выставит кнопке исходное disabled-состояние.
  await page.waitForFunction(
    () => {
      const button = document.querySelector('.acceptin-button');
      const hallSeats = Array.from(
        document.querySelectorAll('.buying-scheme__chair')
      ).filter(
        (seat) =>
          seat.closest(
            '.buying-scheme__wrapper, .buying-scheme__row, .buying-scheme'
          ) &&
          !seat.closest('.buying-scheme__legend')
      );

      return hallSeats.length > 0 && button !== null && button.disabled === true;
    },
    { timeout: 20000 }
  );
}

async function selectSeats(page, count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Количество мест должно быть положительным целым числом: ${count}`);
  }

  const candidates = await page.$$(SEAT_SELECTOR);
  const checks = await Promise.all(
    candidates.map(async (seat) => ({
      seat,
      isFree: await seat.evaluate((element) => {
        const belongsToHall = Boolean(
          element.closest(
            '.buying-scheme__wrapper, .buying-scheme__row, .buying-scheme'
          )
        );
        const isLegend = Boolean(
          element.closest('.buying-scheme__legend')
        );
        const isTaken = element.classList.contains(
          'buying-scheme__chair_taken'
        );
        const isAlreadySelected = element.classList.contains(
          'buying-scheme__chair_selected'
        );

        return belongsToHall && !isLegend && !isTaken && !isAlreadySelected;
      })
    }))
  );

  const freeSeats = checks
    .filter(({ isFree }) => isFree)
    .map(({ seat }) => seat);

  if (freeSeats.length < count) {
    throw new Error(`Свободных мест ${freeSeats.length}, нужно ${count}`);
  }

  for (const seat of freeSeats.slice(0, count)) {
    await seat.click();
  }

  // Легенда содержит демонстрационное selected-место — исключаем её
  // и считаем только кресла в зале.
  await page.waitForFunction(
    (expected) => {
      const selectedInHall = Array.from(
        document.querySelectorAll('.buying-scheme__chair_selected')
      ).filter(
        (seat) =>
          seat.closest(
            '.buying-scheme__wrapper, .buying-scheme__row, .buying-scheme'
          ) &&
          !seat.closest('.buying-scheme__legend')
      );

      return selectedInHall.length === expected;
    },
    { timeout: 20000 },
    count
  );
}

async function showBooking(page) {
  // После выбора мест дождаться фактического включения кнопки.
  await page.waitForFunction(() => {
    const button = document.querySelector('.acceptin-button');
    return button !== null && button.disabled === false;
  });

  await page.click('.acceptin-button');

  // Проверяем не только наличие элемента, но и появление самого билета
  // с заполненным списком выбранных кресел.
  await page.waitForSelector('.ticket, #ticket', { visible: true });
  await page.waitForFunction(() => {
    const chairs = document.querySelector('.ticket__chairs');
    return chairs !== null && chairs.textContent.trim().length > 0;
  });
}

async function ticketSeatCount(page) {
  const text = await page.$eval('.ticket__chairs', (node) =>
    node.textContent.trim()
  );

  return text.split(/\s*,\s*/).filter(Boolean).length;
}

async function bookingDisabled(page) {
  await page.waitForSelector('.acceptin-button');
  return page.$eval('.acceptin-button', (button) => button.disabled);
}

module.exports = {
  openSession,
  selectSeats,
  showBooking,
  ticketSeatCount,
  bookingDisabled
};
