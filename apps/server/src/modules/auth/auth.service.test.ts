import test from 'node:test';
import assert from 'node:assert/strict';
import { demoStore } from '../../infrastructure/demoStore.js';
import { loginUser } from './auth.service.js';

test('login succeeds for seeded mobile number and password', async () => {
  demoStore.reset();
  const result = await loginUser({ mobileNumber: '9876543210', password: 'password123' });

  assert.ok(result);
  assert.equal(result?.user.role, 'student');
  assert.equal(result?.user.phoneNumber, '9876543210');
});

test('login fails for incorrect password', async () => {
  demoStore.reset();
  const result = await loginUser({ mobileNumber: '9876543210', password: 'wrongpassword' });

  assert.equal(result, null);
});
