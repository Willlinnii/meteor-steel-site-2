const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../src/data');

let zodiacData = null;
let calendarData = null;
let synthesisData = null;

function loadAll() {
  if (!zodiacData) {
    zodiacData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'sevenMetalsZodiac.json'), 'utf-8'));
  }
  if (!calendarData) {
    calendarData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mythicCalendar.json'), 'utf-8'));
  }
  if (!synthesisData) {
    synthesisData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'synthesis.json'), 'utf-8'));
  }
}

function getZodiacSign(name) {
  loadAll();
  return zodiacData.find(z => z.sign.toLowerCase() === name.toLowerCase());
}

function getAllZodiacSigns() {
  loadAll();
  return zodiacData;
}

function getMonth(name) {
  loadAll();
  return calendarData.find(m => m.month.toLowerCase() === name.toLowerCase());
}

function getMonthHolidays(name) {
  const month = getMonth(name);
  return month ? month.holidays : [];
}

function getSynthesisStage(id) {
  loadAll();
  return synthesisData[id] || null;
}

function getAllMonths() {
  loadAll();
  return calendarData;
}

module.exports = {
  getZodiacSign,
  getAllZodiacSigns,
  getMonth,
  getMonthHolidays,
  getSynthesisStage,
  getAllMonths,
};
