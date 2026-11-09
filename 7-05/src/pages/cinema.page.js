class CinemaPage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'https://qamid.tmweb.ru/client/index.php';
    this.selectors = {
      movie: '.movie',
      session: '.movie-seances__time',
      day: '.page-nav__day:not(.page-nav__day_chosen)',
      scheme: '.buying-scheme',
      freeSeat: '.buying-scheme__chair_standart:not(.buying-scheme__chair_taken):not(.buying-scheme__chair_disabled)',
      takenSeat: '.buying-scheme__chair_taken',
      selectedSeat: '.buying-scheme__chair_selected, .buying-scheme__chair._selected',
      confirm: '.acceptin-button',
      ticket: '.ticket',
      ticketSeats: '.ticket__chairs'
    };
  }

  async open() {
    await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
  }

  async waitForSchedule() {
    await this.page.waitForSelector(this.selectors.movie, { visible: true });
  }

  // Custom command: переход к ближайшей дате, на которой есть сеансы.
  async openFirstAvailableSession() {
    const dates = await this.page.$$(this.selectors.day);

    for (const date of dates) {
      await date.click();

      // Ждём появления сеансов вместо фиксированной паузы waitForTimeout().
      await this.page.waitForFunction(
        (selector) => document.querySelectorAll(selector).length > 0,
        {},
        this.selectors.session
      ).catch(() => null);

      const sessions = await this.page.$$(this.selectors.session);
      if (sessions.length > 0) {
        await sessions[0].click();
        await this.page.waitForSelector(this.selectors.scheme, { visible: true });
        return;
      }
    }

    const sessions = await this.page.$$(this.selectors.session);
    if (sessions.length > 0) {
      await sessions[0].click();
      await this.page.waitForSelector(this.selectors.scheme, { visible: true });
      return;
    }

    throw new Error('Не найдено доступных сеансов на странице расписания');
  }

  // Custom command: выбрать указанное количество свободных мест.
  async selectAvailableSeats(count) {
    const seats = await this.page.$$(this.selectors.freeSeat);
    if (seats.length < count) {
      throw new Error(`Недостаточно свободных мест: найдено ${seats.length}, требуется ${count}`);
    }

    for (const seat of seats.slice(0, count)) {
      await seat.click();
    }

    await this.page.waitForFunction(
      ({ selector, expected }) => document.querySelectorAll(selector).length >= expected,
      {},
      { selector: this.selectors.selectedSeat, expected: count }
    );
  }

  async confirmSeats() {
    await this.page.waitForFunction((selector) => {
      const button = document.querySelector(selector);
      return button && !button.disabled;
    }, {}, this.selectors.confirm);

    await this.page.click(this.selectors.confirm);
    await this.page.waitForSelector(this.selectors.ticket, { visible: true });
  }

  async isBookingPage() {
    return Boolean(await this.page.$(this.selectors.ticket));
  }

  async getSelectedSeatCount() {
    const text = await this.page.$eval(
      this.selectors.ticketSeats,
      (element) => element.textContent.trim()
    ).catch(() => '');

    if (!text) return 0;

    // В билете места перечислены через запятую; номер ряда/места внутри
    // одной записи не должен считаться двумя разными местами.
    return text.split(',').map((seat) => seat.trim()).filter(Boolean).length;
  }

  async hasUnavailableSeat() {
    return (await this.page.$$(this.selectors.takenSeat)).length > 0;
  }

  async unavailableSeatIsNotSelectable() {
    const takenSeat = await this.page.$(this.selectors.takenSeat);
    if (!takenSeat) return false;

    const before = await this.page.$eval(
      this.selectors.confirm,
      (button) => button.disabled
    ).catch(() => true);

    await takenSeat.click().catch(() => {});

    const after = await this.page.$eval(
      this.selectors.confirm,
      (button) => button.disabled
    ).catch(() => true);

    const classes = await this.page.evaluate((element) => element.className, takenSeat);
    return before === after && !classes.includes('_selected');
  }
}

module.exports = CinemaPage;
