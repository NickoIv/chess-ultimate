# Chess Ultimate Pro — коммерческий статус

Дата проверки: 27 сентября 2026.

## Реализовано и проверено

- Адаптивный игровой экран: доска и главные кнопки помещаются на узких мобильных экранах без горизонтальной прокрутки; второстепенная панель раскрывается по кнопке «Партия».
- Локальный Stockfish 19 Lite WASM: соперник и подсказки работают без отправки позиции на сервер.
- Сетевой режим PeerJS, звуки, подчёркнутые анимации ходов и взятий, PWA-оболочка и Android debug APK были собраны в предыдущем этапе.
- Академия: три встроенные позиции приведены к проверяемым задачам. Проверка `node tests/puzzle-validation.mjs` подтверждает легальность решения, матовые утверждения и настоящую вилку.
- Итоговый разбор завершённой партии: Stockfish анализирует позицию до хода и после него, вычисляет практическую потерю оценки, показывает метки «Лучший ход / Отличный / Хороший / Неточность / Ошибка / Зевок», лучший вариант и локально кэширует готовый разбор.
- Экран разбора содержит отдельную доску, навигацию по ходам, переход к первой серьёзной ошибке и начальный режим «Тренировать этот момент».

## Проверки этого этапа

```text
node tests/puzzle-validation.mjs       PASS — 3 задачи
node tests/review-core-validation.mjs  PASS — классификация разбора
node --check academy.js                PASS
node --check final-features.js         PASS
git diff --check                       PASS
```

В браузере вручную подтверждены: загрузка свежей версии, открытие Академии, названия и описания всех трёх исправленных задач, загрузка позиции «Ладейный мат» с фигурами на a8/c8/b6.

## Честные ограничения перед публикацией

- Разбор рассчитывается по завершённой партии с полноценной историей позиций. Старые/импортированные PGN без этих снимков не подлежат точному разбору — интерфейс сообщит об этом, а не покажет выдуманную оценку.
- Время анализа сейчас 430 мс на каждую из двух оценок одного полухода; длинная партия будет анализироваться заметно дольше. Результат после первого расчёта сохраняется локально.
- Для публикации Google Play ещё нужны отдельные действия P1: целевой SDK по актуальным правилам Play, versionCode/versionName, release keystore, подписанный AAB, политика конфиденциальности и Play Console карточка. Ключ подписи намеренно не создавался и не подменялся.
- Тренировка ошибки пока требует точный лучший ход движка; поддержка нескольких равноценных ходов остаётся следующим улучшением.

## Следующий безопасный шаг

После отдельной ручной партии проверить полный живой разбор Stockfish на устройстве, затем собрать новые версии PWA и APK/AAB с новыми именами, не заменяя существующие архивы и APK.

---

# Commercial continuation — 27 September 2026

## Source of Truth

`/Users/nikolay/Desktop/Project/Chess Ultimate/chess-ultimate-pro-deluxe` is now the standalone source of truth. The former copy under `TAURA Resort OS` was preserved untouched as a fallback.

## Completed This Session

- Train My Mistakes now stores local exercises with game sequence identity, ply, FEN, original/best moves, evaluations, attempts and completion state; alternative moves within 45 centipawns of the best result are accepted.
- Academy has a personal “Мои ошибки” list for repeat training.
- Central `Entitlements` and no-op `Analytics` boundaries plus a responsive paywall foundation were added. It does not invent prices or grant paid ownership without a verified native purchase.
- Added `GOOGLE-PLAY-RELEASE-CHECKLIST.md`, `PRIVACY-DATA-SAFETY.md` and `STOCKFISH-LICENSE.md`.

## Android Production / Billing Status

Current Android wrapper is API 35. Official Play guidance requires target API 36+ for a new submission after 31 August 2026. SDK Platform 36 is not installed here, so no false “production-ready” AAB is claimed. Product IDs reserved for Play Console: `remove_ads_lifetime`, `pro_lifetime`; native BillingClient integration waits for Play Console products, test accounts and owner-approved signing.

## Tests

- `node tests/puzzle-validation.mjs` — PASS
- `node tests/review-core-validation.mjs` — PASS
- `node --check academy.js` and `node --check commercial.js` — PASS

## Owner Actions Required

1. Create the app/products and test accounts in Play Console.
2. Provide a secure upload-key strategy without committing a keystore/password.
3. Approve installation/testing of SDK Platform 36 and Play Billing dependencies.
4. Verify exact corresponding source provenance for the bundled Stockfish WASM build.
