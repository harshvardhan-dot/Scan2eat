import test from 'node:test';
import assert from 'node:assert/strict';
import { issueLunchBox, returnLunchBox } from './mess.service.js';
import { demoStore } from '../../infrastructure/demoStore.js';

test('issue flow creates a lunch box record and blocks duplicate issue', async () => {
  demoStore.reset();

  const first = await issueLunchBox({ studentId: 'student-1', mealType: 'lunch', staffId: 'staff-1' });
  assert.equal(first.ok, true);
  assert.equal(first.lunchBox?.currentStatus, 'issued');

  const duplicate = await issueLunchBox({ studentId: 'student-1', mealType: 'lunch', staffId: 'staff-1' });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.message ?? '', /already issued/i);
});

test('return flow updates the lunch box and blocks duplicate return', async () => {
  demoStore.reset();

  await issueLunchBox({ studentId: 'student-1', mealType: 'lunch', staffId: 'staff-1' });
  const firstReturn = await returnLunchBox({ studentId: 'student-1', staffId: 'staff-1' });
  assert.equal(firstReturn.ok, true);
  assert.equal(firstReturn.lunchBox?.currentStatus, 'returned');

  const duplicateReturn = await returnLunchBox({ studentId: 'student-1', staffId: 'staff-1' });
  assert.equal(duplicateReturn.ok, false);
  assert.match(duplicateReturn.message ?? '', /already returned/i);
});
