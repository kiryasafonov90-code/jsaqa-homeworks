# Домашнее задание 7.5 — Puppeteer 2

Автотесты бронирования билетов для учебного приложения «Идём в кино». Первое задание реализовано отдельным тест-сьютом на встроенном Node.js Test Runner и Puppeteer, второе — BDD-сценариями на Cucumber.

## Требования

- Node.js 20 или новее.
- Установленный браузер Chrome для Puppeteer.

## Установка и запуск

```bash
npm install
npx puppeteer browsers install chrome
npm test
```

Команда `npm test` запускает оба набора: три самостоятельных тест-кейса Puppeteer и сценарии Cucumber.

Отдельный запуск:

```bash
npm run test:puppeteer
npm run test:bdd
```

По умолчанию используется учебный стенд `https://qamid.tmweb.ru/client/index.php`. Для другого адреса задайте `BASE_URL`.

PowerShell:

```powershell
$env:BASE_URL="https://qamid.tmweb.ru/client/index.php"
npm test
```

macOS / Linux:

```bash
BASE_URL="https://qamid.tmweb.ru/client/index.php" npm test
```

Чтобы открыть браузер в видимом режиме:

```bash
# PowerShell
$env:HEADLESS="false"; npm test

# macOS / Linux
HEADLESS=false npm test
```

## Тест-кейсы первого задания

1. Happy path: выбрать одно свободное место, подтвердить заказ и проверить страницу билета и количество мест.
2. Happy path: выбрать два свободных места, подтвердить заказ и проверить страницу билета и количество мест.
3. Sad path: проверить, что занятое место нельзя выбрать и оно не активирует подтверждение заказа.

Файл тест-сьюта: `tests/booking.test.js`.

## BDD второго задания

Файл `features/booking.feature` содержит те же три сценария на русском языке. Все шаги реализованы в `features/step-definitions/booking.steps.js`, включая отдельное выражение для проверки одного и двух мест. Hooks браузера находятся в `features/support/hooks.js`.

## Структура

- `tests/booking.test.js` — три тест-кейса первого задания.
- `features/booking.feature` — BDD-сценарии.
- `features/step-definitions/booking.steps.js` — определения шагов Cucumber.
- `src/pages/cinema.page.js` — Page Object и custom commands.
- `features/support/hooks.js` — browser/page hooks.
