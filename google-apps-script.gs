/*
  GOOGLE APPS SCRIPT — СБОР СТАТИСТИКИ

  Таблица должна иметь доступ у вас. Скрипт сам создаст лист "Ответы".

  После вставки:
  1) Нажмите "Развернуть" → "Новое развёртывание".
  2) Тип: Веб-приложение.
  3) Выполнять от имени: вы.
  4) Кто имеет доступ: Все.
  5) Скопируйте URL, заканчивающийся на /exec.
  6) Вставьте его в config.js в STATS_ENDPOINT.
*/

function doPost(e) {
  const sheet = getSheet_();
  const raw = e && e.postData ? e.postData.contents : "{}";
  let data = {};
  try { data = JSON.parse(raw); } catch (err) {}

  const matches = data.matches || [];
  const row = [
    new Date(),
    data.participant || "Анонимный эксперт",
    ...matches.flatMap(m => [m.friendName || m.friendId || "", m.swanName || m.swanId || ""])
  ];

  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput("Геральдическая база данных работает.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Ответы");
  if (!sheet) {
    sheet = ss.insertSheet("Ответы");
    const headers = ["Дата","Эксперт"];
    for (let i=1;i<=8;i++) headers.push("Друг "+i,"Лебедь "+i);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
