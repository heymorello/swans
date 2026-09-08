/*
  НАСТРОЙКА ОТПРАВКИ СТАТИСТИКИ

  Вариант по умолчанию: Google Apps Script → Google Таблица.
  Если URL пустой, сайт всё равно работает, но результаты сохраняются только
  в браузере и НЕ попадут вам в общую статистику.

  1. Создайте Google Таблицу.
  2. Расширения → Apps Script.
  3. Вставьте код из файла google-apps-script.gs.
  4. Разверните как веб-приложение: доступ "Все".
  5. Скопируйте URL /exec сюда.
*/
const APP_CONFIG = {
  STATS_ENDPOINT: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE",
  ONE_TO_ONE: true
};
