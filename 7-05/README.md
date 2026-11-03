# Домашнее задание 7.5 — Puppeteer 2

Автотесты бронирования билетов для учебного приложения «Идём в кино» с Puppeteer и Cucumber (BDD).

## Запуск

Требуется Node.js 20+.

```bash
npm install
npx puppeteer browsers install chrome
npm test
```

По умолчанию используется `https://qamid.tmweb.ru/client/index.php`. Для другого стенда задайте `BASE_URL`.

```bash
# PowerShell
$env:BASE_URL="https://qamid.tmweb.ru/client/index.php"; npm test
# macOS / Linux
BASE_URL="https://qamid.tmweb.ru/client/index.php" npm test
```

## Сценарии

1. Happy path: выбор одного свободного места и переход к подтверждению билета.
2. Happy path: выбор двух свободных мест и проверка количества мест в заказе.
3. Sad path: занятое место нельзя выбрать; кнопка подтверждения остаётся недоступной.

Селекторы собраны в `src/pages/cinema.page.js`. Перед запуском на изменённой версии стенда достаточно скорректировать их там.

## Структура

- `features/booking.feature` — BDD-сценарии.
- `features/step-definitions/booking.steps.js` — шаги Cucumber.
- `src/pages/cinema.page.js` — Page Object и custom commands.
- `features/support/hooks.js` — browser/page hooks.
