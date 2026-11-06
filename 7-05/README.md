# Домашнее задание 7.5 — Puppeteer 2

Автотесты бронирования билетов в приложении «Идём в кино».

## Установка

Node.js 20+.

```bash
cd 7-05
npm install
npx puppeteer browsers install chrome
```

При необходимости укажите адрес тестового стенда в переменной `BASE_URL` (по умолчанию https://qamid.tmweb.ru/client/index.php).

## Задание 1 — Puppeteer

Отдельный тест-сьют `tests/booking.test.js` (Node.js test runner, без Cucumber), 3 теста:

1. Happy path: выбор одного свободного места, переход к подтверждению и проверка одного места.
2. Happy path: выбор двух свободных мест, переход к подтверждению и проверка двух мест.
3. Sad path: попытка нажать занятое место, проверка отсутствия выбора и недоступности подтверждения.

```bash
npm test
```

В тестах используются хуки `beforeEach` / `afterEach`, Page Object и custom commands.

## Задание 2 — Puppeteer + Cucumber

Те же три сценария записаны в `features/booking.feature` и реализованы в `features/step-definitions/booking.steps.js`.

```bash
npm run test:bdd
npm run test:bdd:dry-run  # проверить сопоставление шагов без запуска браузера
npm run test:smoke
```

Для запуска Cucumber в окне браузера используйте `HEADLESS=false npm run test:bdd` (PowerShell: `$env:HEADLESS='false'; npm run test:bdd`).

## Структура

- `tests/booking.test.js` — задание 1.
- `features/booking.feature` — BDD-сценарии задания 2.
- `features/step-definitions/booking.steps.js` — шаги Cucumber.
- `features/support/hooks.js` — хуки Cucumber.
- `src/pages/cinema.page.js` — Page Object и общие custom commands.

## Важно

Тесты зависят от доступности стенда и от наличия свободных и занятых мест в его текущих сеансах. Время ожидания задаётся через `page.setDefaultTimeout()`, `page.waitForSelector()` и `page.waitForFunction()`; удалённый из современных Puppeteer метод `page.waitForTimeout()` не используется.
