class CinemaPage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'https://qamid.tmweb.ru/client/index.php';
    this.selectors = {
      movie: '.movie',
      day: '.page-nav__day',
      session: '.movie-seances__time',
      scheme: '.buying-scheme',
      seat: '.buying-scheme__chair',
      freeSeat: '.buying-scheme__chair_standart:not(.buying-scheme__chair_taken), .buying-scheme__chair_vip:not(.buying-scheme__chair_taken)',
      selectedSeat: '.buying-scheme__chair_selected',
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

  // Custom command: находим сеанс с нужным количеством свободных (или с занятым) мест.
  async openFirstAvailableSession({ requiredSeats = 1, requireTaken = false } = {}) {
    const days = await this.page.$$(this.selectors.day);
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      await this.open();
      await this.waitForSchedule();

      const day = (await this.page.$$(this.selectors.day))[dayIndex];
      if (!day) continue;
      const disabled = await day.evaluate(el => el.classList.contains('page-nav__day_disabled'));
      if (disabled) continue;
      await day.click();
      await this.page.waitForFunction(
        index => document.querySelectorAll('.page-nav__day')[index]?.classList.contains('page-nav__day_chosen'),
        {}, dayIndex
      );

      const sessions = await this.page.$$(this.selectors.session);
      for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
        if (sessionIndex > 0) {
          await this.open();
          await this.waitForSchedule();
          const currentDay = (await this.page.$$(this.selectors.day))[dayIndex];
          await currentDay.click();
          await this.page.waitForFunction(
            index => document.querySelectorAll('.page-nav__day')[index]?.classList.contains('page-nav__day_chosen'),
            {}, dayIndex
          );
        }

        const session = (await this.page.$$(this.selectors.session))[sessionIndex];
        if (!session) continue;
        await session.click();
        try {
          await this.page.waitForSelector(this.selectors.seat, { visible: true, timeout: 5000 });
        } catch {
          continue;
        }
        const free = await this.page.$$(this.selectors.freeSeat);
        const taken = await this.page.$$(this.selectors.takenSeat);
        if (free.length >= requiredSeats && (!requireTaken || taken.length > 0)) return;
      }
    }
    throw new Error(
      'Не найден сеанс с нужными местами: свободных требуется ' +
      requiredSeats + ', занятое обязательно: ' + requireTaken
    );
  }

  // Custom command: кликаем только по свободным местам и ждём изменения состояния схемы.
  async selectAvailableSeats(count) {
    const seats = await this.page.$$(this.selectors.freeSeat);
    if (seats.length < count) {
      throw new Error('Недостаточно свободных мест: ' + seats.length + ' вместо ' + count);
    }
    for (const seat of seats.slice(0, count)) await seat.click();
    await this.page.waitForFunction(
      (selector, expected) => document.querySelectorAll(selector).length === expected,
      {}, this.selectors.selectedSeat, count
    );
  }

  async confirmSeats() {
    await this.page.waitForFunction(
      selector => {
        const button = document.querySelector(selector);
        return button && !button.disabled;
      },
      {}, this.selectors.confirm
    );
    await this.page.click(this.selectors.confirm);
    await this.page.waitForSelector(this.selectors.ticket, { visible: true });
  }

  async isBookingPage() {
    return Boolean(await this.page.$(this.selectors.ticket));
  }

  async getSelectedSeatCount() {
    const text = await this.page.$eval(this.selectors.ticketSeats, el => el.textContent.trim());
    // На экране билета места перечислены как "ряд/место, ряд/место".
    const matches = text.match(/\d+\s*\/\s*\d+/g);
    if (matches) return matches.length;
    return text.split(/[,;]/).map(s => s.trim()).filter(Boolean).length;
  }

  async unavailableSeatIsNotSelectable() {
    const occupied = await this.page.$(this.selectors.takenSeat);
    if (!occupied) throw new Error('В выбранном сеансе нет занятого места');
    const before = await this.page.$$(this.selectors.selectedSeat);
    if (before.length) throw new Error('Негативный тест требует пустого выбора мест');
    // Клик мышью по координатам, а не ElementHandle.click() по неинтерактивному месту.
    const box = await occupied.boundingBox();
    if (!box) throw new Error('Занятое место не видно');
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const selected = await this.page.$$(this.selectors.selectedSeat);
    const takenIsSelected = await occupied.evaluate(el => el.classList.contains('buying-scheme__chair_selected'));
    const confirmEnabled = await this.page.$eval(
      this.selectors.confirm, button => !button.disabled
    );
    return selected.length === 0 && !takenIsSelected && !confirmEnabled;
  }
}

module.exports = CinemaPage;
