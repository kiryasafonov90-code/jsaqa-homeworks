class CinemaPage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://qamid.tmweb.ru/client/index.php';
    this.selectors = {
      movie: '.movie',
      day: '.page-nav__day',
      session: '.movie-seances__time',
      seat: '.buying-scheme__chair',
      freeSeat:
        '.buying-scheme__chair_standart:not(.buying-scheme__chair_taken):not(.buying-scheme__chair_selected), ' +
        '.buying-scheme__chair_vip:not(.buying-scheme__chair_taken):not(.buying-scheme__chair_selected)',
      selectedSeat: '.buying-scheme__chair_selected',
      takenSeat: '.buying-scheme__chair_taken',
      confirm: '.acceptin-button',
      ticket: '.ticket, #ticket',
      ticketSeats: '.ticket__chairs'
    };
  }

  async open() {
    await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForSchedule();
  }

  async waitForSchedule() {
    await this.page.waitForSelector(this.selectors.day, { visible: true });
    await this.page.waitForSelector(this.selectors.movie, { visible: true });
  }

  // Каждый поиск сеанса начинает работу с новой страницы.
  async openDay(dayIndex) {
    await this.open();

    const days = await this.page.$$(this.selectors.day);
    const day = days[dayIndex];
    if (!day) return false;

    const disabled = await day.evaluate((element) =>
      element.classList.contains('page-nav__day_disabled')
    );
    if (disabled) return false;

    await day.click();
    await this.page.waitForFunction(
      (selector, index) => {
        const currentDay = document.querySelectorAll(selector)[index];
        return Boolean(
          currentDay && currentDay.classList.contains('page-nav__day_chosen')
        );
      },
      {},
      this.selectors.day,
      dayIndex
    );

    return true;
  }

  async getVisibleElement(selector, visibleIndex) {
    const elements = await this.page.$$(selector);
    let currentIndex = 0;

    for (const element of elements) {
      const visible = await element.evaluate(
        (node) => node.getClientRects().length > 0
      );

      if (!visible) continue;
      if (currentIndex === visibleIndex) return element;
      currentIndex += 1;
    }

    return null;
  }

  // Custom command: ищет первый сеанс с нужным числом свободных/занятых мест.
  async openFirstAvailableSession({
    requiredSeats = 1,
    requireTaken = false
  } = {}) {
    if (!Number.isInteger(requiredSeats) || requiredSeats < 0) {
      throw new Error('requiredSeats должно быть целым неотрицательным числом');
    }

    await this.open();
    const dayCount = await this.page.$$eval(
      this.selectors.day,
      (days) => days.length
    );

    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
      if (!(await this.openDay(dayIndex))) continue;

      const sessionCount = await this.page.$$eval(
        this.selectors.session,
        (sessions) =>
          sessions.filter((session) => session.getClientRects().length > 0).length
      );

      for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
        // После перезагрузки снова получаем свежие элементы дня и сеанса.
        if (!(await this.openDay(dayIndex))) break;

        const session = await this.getVisibleElement(
          this.selectors.session,
          sessionIndex
        );
        if (!session) continue;

        await session.click();

        try {
          await this.page.waitForSelector(this.selectors.seat, {
            visible: true,
            timeout: 10000
          });
        } catch (error) {
          if (error.name === 'TimeoutError') continue;
          throw error;
        }

        const freeCount = await this.page.$$eval(
          this.selectors.freeSeat,
          (seats) => seats.length
        );
        const takenCount = await this.page.$$eval(
          this.selectors.takenSeat,
          (seats) => seats.length
        );

        if (freeCount >= requiredSeats && (!requireTaken || takenCount > 0)) {
          return;
        }
      }
    }

    throw new Error(
      'Не найден подходящий сеанс. Нужно свободных мест: ' +
      requiredSeats +
      ', требуется занятое место: ' +
      requireTaken
    );
  }

  // Custom command: каждый раз запрашивает свежий свободный элемент кресла.
  async selectAvailableSeats(count) {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error('Количество мест должно быть положительным целым числом');
    }

    for (let index = 0; index < count; index += 1) {
      const seat = await this.page.$(this.selectors.freeSeat);
      if (!seat) {
        throw new Error('Недостаточно свободных мест для выбора');
      }

      await seat.click();
      await seat.dispose();
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
        return Boolean(button && !button.disabled);
      },
      {},
      this.selectors.confirm
    );

    await this.page.click(this.selectors.confirm);
    await this.page.waitForSelector(this.selectors.ticket, { visible: true });
  }

  async isBookingPage() {
    return this.page
      .$eval(this.selectors.ticket, (element) => {
        const style = window.getComputedStyle(element);
        return (
          !element.hidden &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      })
      .catch(() => false);
  }

  async getSelectedSeatCount() {
    const text = await this.page
      .$eval(this.selectors.ticketSeats, (element) =>
        element.textContent.trim()
      )
      .catch(() => '');

    const seatNumbers = text.match(/\d+\s*\/\s*\d+/g);
    if (seatNumbers) return seatNumbers.length;

    return text
      .split(/[,;]/)
      .map((seat) => seat.trim())
      .filter(Boolean).length;
  }

  async unavailableSeatIsNotSelectable() {
    const occupiedSeat = await this.page.$(this.selectors.takenSeat);
    if (!occupiedSeat) {
      throw new Error('В выбранном сеансе нет занятого места');
    }

    const box = await occupiedSeat.boundingBox();
    if (!box) throw new Error('Занятое место не отображается на экране');

    await this.page.mouse.click(
      box.x + box.width / 2,
      box.y + box.height / 2
    );

    return this.page.evaluate(
      ({ takenSelector, selectedSelector, confirmSelector }) => {
        const occupied = document.querySelector(takenSelector);
        const confirmButton = document.querySelector(confirmSelector);
        const selectedCount = document.querySelectorAll(selectedSelector).length;

        return Boolean(
          occupied &&
          confirmButton &&
          selectedCount === 0 &&
          !occupied.classList.contains('buying-scheme__chair_selected') &&
          confirmButton.disabled
        );
      },
      {
        takenSelector: this.selectors.takenSeat,
        selectedSelector: this.selectors.selectedSeat,
        confirmSelector: this.selectors.confirm
      }
    );
  }
}

module.exports = CinemaPage;
