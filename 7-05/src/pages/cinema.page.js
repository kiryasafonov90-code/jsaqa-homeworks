class CinemaPage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'https://qamid.tmweb.ru/client/index.php';
    this.selectors = {
      movie: '.movie',
      session: '.movie-seances__time',
      day: '.page-nav__day:not(.page-nav__day_chosen)',
      freeSeat: '.buying-scheme__chair_standart:not(.buying-scheme__chair_taken):not(.buying-scheme__chair_disabled)',
      takenSeat: '.buying-scheme__chair_taken',
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

  // Custom command: переход к ближайшей дате, где есть сеансы.
  async openFirstAvailableSession() {
    const dates = await this.page.$$(this.selectors.day);
    for (const date of dates) {
      await date.click();
      await this.page.waitForTimeout(300);
      const sessions = await this.page.$$(this.selectors.session);
      if (sessions.length) {
        await sessions[0].click();
        await this.page.waitForSelector('.buying-scheme', { visible: true });
        return;
      }
    }

    const sessions = await this.page.$$(this.selectors.session);
    if (sessions.length) {
      await sessions[0].click();
      await this.page.waitForSelector('.buying-scheme', { visible: true });
      return;
    }
    throw new Error('Не найдено доступных сеансов на странице расписания');
  }

  // Custom command: выбрать указанное число свободных мест.
  async selectAvailableSeats(count) {
    const seats = await this.page.$$(this.selectors.freeSeat);
    if (seats.length < count) {
      throw new Error(`Недостаточно свободных мест: найдено ${seats.length}, требуется ${count}`);
    }
    for (const seat of seats.slice(0, count)) await seat.click();
    await this.page.waitForTimeout(200);
  }

  async confirmSeats() {
    await this.page.waitForFunction((selector) => {
      const button = document.querySelector(selector);
      return button && !button.disabled;
    }, {}, this.selectors.confirm);
    await this.page.click(this.selectors.confirm);
    await this.page.waitForTimeout(300);
  }

  async isBookingPage() {
    return Boolean(await this.page.$(this.selectors.ticket));
  }

  async getSelectedSeatCount() {
    const text = await this.page.$eval(this.selectors.ticketSeats, el => el.textContent.trim())
      .catch(() => '');
    const numbers = text.match(/\d+/g);
    if (numbers) return numbers.length;
    const seats = await this.page.$$(this.selectors.ticketSeats);
    return seats.length;
  }

  async hasUnavailableSeat() {
    return (await this.page.$$(this.selectors.takenSeat)).length > 0;
  }

  async unavailableSeatIsNotSelectable() {
    const taken = await this.page.$(this.selectors.takenSeat);
    if (!taken) return false;
    const before = await this.page.$eval(this.selectors.confirm, button => button.disabled).catch(() => true);
    await taken.click().catch(() => {});
    const after = await this.page.$eval(this.selectors.confirm, button => button.disabled).catch(() => true);
    const classes = await this.page.evaluate(el => el.className, taken);
    return before === after && !classes.includes('_selected');
  }
}

module.exports = CinemaPage;
