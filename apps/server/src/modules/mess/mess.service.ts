import type { MealType } from '../../shared/types.js';
import { demoStore } from '../../infrastructure/demoStore.js';

export interface IssueLunchBoxInput {
  studentId: string;
  mealType: MealType;
  staffId: string;
}

export interface ReturnLunchBoxInput {
  studentId: string;
  staffId: string;
}

export async function issueLunchBox(input: IssueLunchBoxInput) {
  const student = demoStore.getStudentById(input.studentId);
  if (!student) {
    return { ok: false, message: 'Student not found' };
  }

  const isAttending = demoStore.getMealOptIn(input.studentId);
  if (!isAttending) {
    return { ok: false, message: `Cannot issue meal box: ${student.name} has NOT marked that they are going to college / attending today!` };
  }

  const existing = demoStore.getActiveLunchBoxForStudent(input.studentId);
  if (existing) {
    return { ok: false, message: 'Lunch box already issued for this student' };
  }

  const lunchBox = demoStore.createLunchBox({
    studentId: input.studentId,
    mealType: input.mealType,
    issuedByStaffId: input.staffId
  });

  return { ok: true, lunchBox };
}

export async function returnLunchBox(input: ReturnLunchBoxInput) {
  const student = demoStore.getStudentById(input.studentId);
  if (!student) {
    return { ok: false, message: 'Student not found' };
  }

  const existing = demoStore.getLatestLunchBoxForStudent(input.studentId);
  if (!existing) {
    return { ok: false, message: 'No active lunch box to return' };
  }

  if (existing.currentStatus === 'returned') {
    return { ok: false, message: 'Lunch box already returned' };
  }

  const lunchBox = demoStore.returnLunchBox(input.studentId, input.staffId);
  return { ok: true, lunchBox };
}
