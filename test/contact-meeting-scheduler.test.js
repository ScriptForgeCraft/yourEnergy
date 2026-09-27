import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEngineerMeetingMessage,
  buildMeetingMessage,
  formatMeetingDate,
  formatMeetingMonth,
  getMeetingSlots,
  isMeetingDateAvailable
} from '../src/ui/meeting-scheduler.js';
import { contactPageCopy } from '../src/content/contacts.js';

test('meeting scheduler offers only configured working-day slots', () => {
  assert.deepEqual(getMeetingSlots(new Date(2026, 8, 28)), [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ]);
  assert.deepEqual(getMeetingSlots(new Date(2026, 9, 3)), [
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00'
  ]);
  assert.deepEqual(getMeetingSlots(new Date(2026, 9, 4)), []);
});

test('meeting scheduler excludes past dates and Sundays', () => {
  const today = new Date(2026, 8, 28);
  assert.equal(isMeetingDateAvailable(new Date(2026, 8, 28), today), true);
  assert.equal(isMeetingDateAvailable(new Date(2026, 8, 27), today), false);
  assert.equal(isMeetingDateAvailable(new Date(2026, 9, 4), today), false);
});

test('meeting scheduler substitutes the selected date and time into the lead message', () => {
  assert.equal(
    buildMeetingMessage('Meeting: {date}, {time}.', 'Tuesday, 29 September 2026', '10:00'),
    'Meeting: Tuesday, 29 September 2026, 10:00.'
  );
});

test('meeting calendar uses the site language for all three locales', () => {
  const date = new Date(2026, 8, 30);

  assert.equal(formatMeetingMonth(date, 'hy-AM'), 'Սեպտեմբեր 2026');
  assert.equal(formatMeetingDate(date, 'hy-AM'), '2026 թ. սեպտեմբերի 30, չորեքշաբթի');
  assert.equal(formatMeetingMonth(date, 'ru-RU'), 'Сентябрь 2026');
  assert.equal(formatMeetingDate(date, 'ru-RU'), 'среда, 30 сентября 2026 г.');
  assert.equal(formatMeetingMonth(date, 'en-US'), 'September 2026');
  assert.equal(formatMeetingDate(date, 'en-US'), 'Wednesday, September 30, 2026');
});

test('meeting flow supplies a localized back control in every site language', () => {
  assert.equal(contactPageCopy.hy.meeting.back, 'Հետ');
  assert.equal(contactPageCopy.ru.meeting.back, 'Назад');
  assert.equal(contactPageCopy.en.meeting.back, 'Back');
});

test('contact and meeting forms use the shared localized success state', () => {
  assert.deepEqual(contactPageCopy.hy.success, contactPageCopy.hy.meeting.success);
  assert.deepEqual(contactPageCopy.ru.success, contactPageCopy.ru.meeting.success);
  assert.deepEqual(contactPageCopy.en.success, contactPageCopy.en.meeting.success);
});

test('meeting notifications use Armenian operational copy', () => {
  const message = buildEngineerMeetingMessage(new Date(2026, 8, 29), '10:00');

  assert.match(message, /Հանդիպման հայտ/);
  assert.match(message, /Ամսաթիվ/);
  assert.match(message, /երեքշաբթի/);
  assert.doesNotMatch(message, /Tuesday/);
});
