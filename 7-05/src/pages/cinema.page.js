class CinemaPage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://qamid.tmweb.ru/client/index.php';
    this.selectors = {
      day: '.page-nav__day',
      session: '.movie-seances__time',
      seat: '.buying-scheme__chair',
      freeSeat: '.buying-scheme__chair_standart, .buying-scheme__chair_vip',
      selectedSeat: '.buying-scheme__chair_selected',
      confirm: '.acceptin-button',
      ticket: '.ticket, #ticket',
      ticketSeats: '.ticket__chairs'
    };
  }

  async open() {
    await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector(this.selectors.day, { visible: true });
  }

  // Открывает заданные день и сеанс. Элементы сеанса ищутся после выбора дня.
  async openSession(dayNumber, sessionNumber) {
    await this.open();

    const days = await this.page.$$(this.selectors.day);
    const day = days[dayNumber - 1];

    if (!day) {
      throw new Error('День с номером ' + dayNumber + ' не найден');
    }

    await day.click();

    await this.page.waitForFunction(
      (selector, index) =>
        document.querySelectorAll(selector)[index]?.classList.contains(
          'page-nav__day_chosen'
        ),
      {},
      this.selectors.day,
      dayNumber - 1
    );

    const sessions = await this.page.$$(this.selectors.session);
    const session = sessions[sessionNumber - 1];

    if (!session) {
      throw new Error(
        'Сеанс с номером ' + sessionNumber + ' не найден в выбранном дне'
      );
    }

    await session.click();
    await this.page.waitForSelector(this.selectors.seat, { visible: true });
  }

  async selectAvailableSeats(count) {
    const seats = await this.page.$$(this.selectors.freeSeat);

    if (seats.length < count) {
      throw new Error(
        'Недостаточно свободных мест: ' + seats.length + ', требуется ' + count
      );
    }

    for (const seat of seats.slice(0, count)) {
      await seat.click();
    }

    await this.page.waitForFunction(
      (selector, expected) =>
        document.querySelectorAll(selector).length === expected,
      {},
      this.selectors.selectedSeat,
      count
    );
  }

  async confirmSeats() {
    await this.page.waitForFunction(
      (selector) => {
        const button = document.querySelector(selector);
        return button && !button.disabled;
      },
      {},
      this.selectors.confirm
    );

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
    );

    const seats = text.match(/\d+\s*\/\s*\d+/g);
    return seats ? seats.length : text.split(',').filter(Boolean).length;
  }

  async isBookingButtonDisabled() {
    return this.page.$eval(
      this.selectors.confirm,
      (button) => button.disabled
    );
  }
}

module.exports = CinemaPage;
