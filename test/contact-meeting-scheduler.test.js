import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMeetingMessage,
  getMeetingSlots,
  isMeetingDateAvailable
} from '../src/ui/meeting-scheduler.js';

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
