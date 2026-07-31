import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudent, listStudents, getReports } from './admin.service.js';
import { demoStore } from '../../infrastructure/demoStore.js';

test('admin can create and search students', async () => {
  demoStore.reset();

  const created = await createStudent({
    name: 'Mina Shah',
    email: 'mina-unique@example.com',
    roomNumber: 'C-101',
    rollNumber: 'R-202-unique',
    mealPreference: 'veg'
  });

  assert.ok(created);
  assert.equal(created.student.name, 'Mina Shah');

  const result = await listStudents({ search: 'mina' });
  assert.ok(result.some((student) => student.id === created.student.id));
});

test('admin reports return the expected summary shape', async () => {
  demoStore.reset();
  const reports = await getReports();

  assert.equal(reports.totalStudents, demoStore.listStudents().length);
  assert.ok(reports.collectionPercentage >= 0);
  assert.ok(Array.isArray(reports.recentTransactions));
});

test('duplicate student registration is rejected', async () => {
  demoStore.reset();

  const first = await createStudent({
    name: 'Nina Das',
    email: 'nina@example.com',
    roomNumber: 'D-303',
    rollNumber: 'R-303'
  });

  const duplicate = await createStudent({
    name: 'Another Student',
    email: 'nina@example.com',
    roomNumber: 'D-304',
    rollNumber: 'R-303'
  });

  assert.ok(first);
  assert.equal(duplicate, null);
});
