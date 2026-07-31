import { demoStore } from '../../infrastructure/demoStore.js';

export interface StudentCreateInput {
  name: string;
  email: string;
  phoneNumber?: string;
  roomNumber: string;
  rollNumber: string;
  mealPreference?: 'veg' | 'nonVeg' | 'vegan';
}

export interface StaffCreateInput {
  name: string;
  email: string;
  shift?: 'breakfast' | 'lunch' | 'dinner' | 'all';
}

export async function listStudents(query: { search?: string; roomNumber?: string; rollNumber?: string } = {}) {
  const students = demoStore.listStudents();
  const normalized = query.search?.toLowerCase() ?? '';
  return students.filter((student) => {
    const matchesSearch = !normalized || [student.name, student.rollNumber, student.roomNumber, student.email, student.phoneNumber ?? ''].some((v) => v.toLowerCase().includes(normalized));
    const matchesRoom = !query.roomNumber || student.roomNumber.toLowerCase() === query.roomNumber.toLowerCase();
    const matchesRoll = !query.rollNumber || student.rollNumber.toLowerCase() === query.rollNumber.toLowerCase();
    return matchesSearch && matchesRoom && matchesRoll;
  });
}

export async function createStudent(input: StudentCreateInput) {
  const result = demoStore.createStudent(input);
  // result is either null or { student, notification }
  return result;
}

export async function updateStudent(studentId: string, input: Partial<StudentCreateInput>) {
  return demoStore.updateStudent(studentId, input);
}

export async function deleteStudent(studentId: string) {
  return demoStore.deleteStudent(studentId);
}

export async function listStaff() {
  return demoStore.listStaff();
}

export async function createStaff(input: StaffCreateInput) {
  return demoStore.createStaff(input);
}

export async function getReports() {
  return demoStore.getReports();
}
