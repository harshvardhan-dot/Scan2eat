import { demoStore } from '../../infrastructure/demoStore.js';
import type { Review } from '../../shared/types.js';

export function getStudentProfile(studentId: string) {
  return demoStore.getStudentById(studentId);
}

export function getStudentQr(studentId: string) {
  const student = demoStore.getStudentById(studentId);
  if (!student) return null;
  return {
    qrToken: student.qrToken,
    qrValue: student.qrToken,
    studentName: student.name,
    roomNumber: student.roomNumber
  };
}

export function getStudentStatus(studentId: string) {
  // fallback to first student so the demo student always resolves
  const student = demoStore.getStudentById(studentId) ?? demoStore.listStudents()[0];
  if (!student) return null;

  const activeLunchBox = demoStore.getActiveLunchBoxForStudent(student.id);
  const latestLunchBox = demoStore.getLatestLunchBoxForStudent(student.id);
  const activeSession = demoStore.getActiveSession();
  const isAttending = demoStore.getMealOptIn(student.id);

  return {
    student,
    activeSession,
    activeLunchBox: activeLunchBox ?? null,
    latestLunchBox: latestLunchBox ?? null,
    isAttending,
    status: activeLunchBox
      ? 'issued'
      : latestLunchBox?.currentStatus === 'returned'
        ? 'returned'
        : 'pending'
  };
}

export function getMealHistory(studentId: string) {
  return demoStore.getStudentMealHistory(studentId);
}

export function skipMeal(studentId: string, sessionId: string) {
  return demoStore.skipMeal(studentId, sessionId);
}

export function submitReview(
  studentId: string,
  sessionId: string,
  payload: Omit<Review, 'id' | 'studentId' | 'sessionId'>
) {
  return demoStore.createReview(studentId, sessionId, payload);
}
