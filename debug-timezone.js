
const { fromZonedTime, toZonedTime, format: formatTz } = require('date-fns-tz');
const { parseISO } = require('date-fns');

// Simulate backend logic
function generateSlot(startStr, ruleTime) {
  // startStr: YYYY-MM-DD (e.g. 2026-02-24)
  // ruleTime: HH:mm (e.g. 16:30)
  
  const startDateTimeStr = `${startStr}T${ruleTime}:00`;
  console.log(`Input String: ${startDateTimeStr}`);
  
  // Convert to UTC assuming input is America/Sao_Paulo
  const slotStart = fromZonedTime(startDateTimeStr, 'America/Sao_Paulo');
  console.log(`Slot Start (Date object): ${slotStart.toISOString()}`);
  
  return slotStart.toISOString();
}

// Simulate frontend logic
function displaySlot(isoString) {
  console.log(`\nFrontend Input: ${isoString}`);
  const date = parseISO(isoString);
  
  const display = formatTz(date, 'HH:mm', { timeZone: 'America/Sao_Paulo' });
  console.log(`Displayed Time (SP): ${display}`);
  
  const displayUTC = formatTz(date, 'HH:mm', { timeZone: 'UTC' });
  console.log(`Displayed Time (UTC): ${displayUTC}`);
}

console.log('--- Simulation ---');
const iso = generateSlot('2026-02-24', '16:30');
displaySlot(iso);

console.log('\n--- Double Conversion Simulation ---');
// What if backend treats 16:30 as UTC?
const utcDate = new Date('2026-02-24T16:30:00Z');
console.log(`If backend produced: ${utcDate.toISOString()}`);
displaySlot(utcDate.toISOString());

// What if data is 19:30 (stored as UTC) but treated as Local?
const iso2 = generateSlot('2026-02-24', '19:30');
displaySlot(iso2);
