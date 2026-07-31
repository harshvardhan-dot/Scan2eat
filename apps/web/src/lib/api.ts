import axios from 'axios';

const envApiUrl = (import.meta as any).env?.VITE_API_URL;
const apiBase = envApiUrl
  ? `${envApiUrl.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hostelos-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export async function login(mobileNumber: string, password: string) {
  const { data } = await api.post('/auth/login', { mobileNumber, password });
  return data;
}

export async function firstTimeSetup(mobileNumber: string, newPassword: string) {
  const { data } = await api.post('/auth/first-time-setup', { mobileNumber, newPassword });
  return data;
}

export async function registerAdmin(payload: { name: string; email: string; phoneNumber: string; password: string }) {
  const { data } = await api.post('/auth/register-admin', payload);
  return data;
}

export async function requestPasswordReset(phone: string, note?: string) {
  const { data } = await api.post('/auth/request-password-reset', { phone, note });
  return data;
}

export async function resetPassword(phone: string, newPassword: string) {
  const { data } = await api.post('/auth/forgot-password', { phone, newPassword });
  return data;
}

export async function getMe(token: string) {
  const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function sendLoginOtp(phone: string) {
  const { data } = await api.post('/auth/otp/request', { phone });
  return data;
}

export async function sendForgotPasswordOtp(phone: string) {
  const { data } = await api.post('/auth/forgot-password/send-otp', { phone });
  return data;
}

export async function verifyForgotPasswordOtp(phone: string, otp: string, newPassword: string) {
  const { data } = await api.post('/auth/forgot-password/verify-otp', { phone, otp, newPassword });
  return data;
}

// Mess staff
export async function scanQr(qrToken: string, mealType: string) {
  const { data } = await api.post('/mess-staff/scan', { qrToken, mealType });
  return data;
}

export async function issueLunchBox(studentId: string, mealType: string, staffId: string) {
  const { data } = await api.post('/mess-staff/lunchboxes/issue', { studentId, mealType, staffId });
  return data;
}

export async function returnLunchBox(studentId: string, staffId: string) {
  const { data } = await api.post('/mess-staff/lunchboxes/return', { studentId, staffId });
  return data;
}

// ── NEW: Daily lunchbox summary (for staff + warden) ──────────────────────────
export async function getDailyLunchBoxSummary() {
  const { data } = await api.get('/admin/lunchboxes/today');
  return data;
}

// ── NEW: Student check-in for meal (time-gated) ───────────────────────────────
export async function studentCheckIn(studentId: string, mealType: string) {
  const { data } = await api.post(`/students/${studentId}/checkin`, { mealType });
  return data;
}

// Admin
export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

export async function getAdminReports() {
  const { data } = await api.get('/admin/reports');
  return data;
}

export async function getAdminStudents(search?: string) {
  const { data } = await api.get('/admin/students', { params: search ? { search } : {} });
  return data;
}

export async function registerStudent(payload: {
  name: string; email: string; phoneNumber?: string;
  roomNumber: string; rollNumber: string; mealPreference?: 'veg' | 'nonVeg' | 'vegan';
}) {
  const { data } = await api.post('/admin/students', payload);
  return data;
}

export async function deleteStudent(id: string) {
  const { data } = await api.delete(`/admin/students/${id}`);
  return data;
}

export async function bulkRegisterStudents(studentList: any[]) {
  const { data } = await api.post('/admin/students/bulk', studentList);
  return data;
}

export async function getPasswordResetRequests() {
  const { data } = await api.get('/admin/password-requests');
  return data;
}

export async function resolvePasswordResetRequest(id: string, newPassword: string) {
  const { data } = await api.post(`/admin/password-requests/${id}/resolve`, { newPassword });
  return data;
}

export async function adminResetStudentPassword(studentId: string, newPassword: string) {
  const { data } = await api.post(`/admin/students/${studentId}/reset-password`, { newPassword });
  return data;
}

export async function getVanDrivers() {
  const { data } = await api.get('/admin/van-drivers');
  return data;
}

export async function addVanDriver(payload: { driverName: string; vehicleNumber: string; phoneNumber: string; assignedRoute: string; licenseNumber?: string }) {
  const { data } = await api.post('/admin/van-drivers', payload);
  return data;
}

export async function deleteVanDriver(id: string) {
  const { data } = await api.delete(`/admin/van-drivers/${id}`);
  return data;
}

export async function getStudentVanDrivers() {
  const { data } = await api.get('/students/van-drivers');
  return data;
}

export async function getAdminComplaints() {
  const { data } = await api.get('/admin/complaints');
  return data;
}

export async function resolveComplaint(id: string, status: string, response: string) {
  const { data } = await api.patch(`/admin/complaints/${id}`, { status, response });
  return data;
}

export async function getAdminMenu() {
  const { data } = await api.get('/admin/menu');
  return data;
}

export async function updateDayMenu(day: string, meals: any[]) {
  const { data } = await api.put(`/admin/menu/${day}`, { meals });
  return data;
}

export async function uploadWeeklyMenuBulk(menuData: any[]) {
  const { data } = await api.post('/admin/menu/bulk', menuData);
  return data;
}

// Student
export async function getStudentStatus(studentId: string) {
  const { data } = await api.get(`/students/${studentId}/status`);
  return data;
}

export async function setMealOptIn(studentId: string, attending: boolean) {
  const { data } = await api.post(`/students/${studentId}/opt-in`, { attending });
  return data;
}

export async function getStudentHistory(studentId: string) {
  const { data } = await api.get(`/students/${studentId}/history`);
  return data;
}

export async function getWeeklyMenu() {
  const { data } = await api.get('/students/menu/weekly');
  return data;
}

export async function submitComplaint(payload: {
  studentId: string; studentName: string; roomNumber: string;
  category: string; subject: string; description: string; urgency: string;
}) {
  const { data } = await api.post('/students/complaints', payload);
  return data;
}

export async function getStudentComplaints(studentId: string) {
  const { data } = await api.get(`/students/${studentId}/complaints`);
  return data;
}

// Super Admin / Platform Owner
export async function getSuperAdminsList() {
  const { data } = await api.get('/admin/super/admins');
  return data;
}

export async function toggleSuperAdminStatus(id: string) {
  const { data } = await api.post(`/admin/super/admins/${id}/toggle`);
  return data;
}

export async function getSuperTenantsList() {
  const { data } = await api.get('/admin/super/tenants');
  return data;
}

export async function createHostelTenant(payload: {
  hostelName: string;
  organizationName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  plan?: string;
  maxStudents?: number;
  paymentStatus?: string;
  monthlyFee?: number;
  paymentReference?: string;
  nextRenewalDate?: string;
}) {
  const { data } = await api.post('/admin/super/tenants', payload);
  return data;
}

export async function getPendingWardensList() {
  const { data } = await api.get('/admin/super/wardens/pending');
  return data;
}

export async function approveWarden(id: string) {
  const { data } = await api.post(`/admin/super/wardens/${id}/approve`);
  return data;
}

export async function rejectWarden(id: string) {
  const { data } = await api.post(`/admin/super/wardens/${id}/reject`);
  return data;
}

export async function deleteWardenAccount(id: string) {
  const { data } = await api.delete(`/admin/super/admins/${id}`);
  return data;
}

export async function getHostelsWithStudentsList() {
  const { data } = await api.get('/admin/super/hostels-students');
  return data;
}

export async function getHostelFoodRankings() {
  const { data } = await api.get('/admin/super/food-rankings');
  return data;
}

export async function getSuperAdminReviewsList() {
  const { data } = await api.get('/admin/super/reviews');
  return data;
}

export async function getPublicTenantsList() {
  const { data } = await api.get('/auth/tenants');
  return data;
}

export async function submitFoodReview(studentId: string, payload: { rating: number; taste?: number; quantity?: number; freshness?: number; temperature?: number; comment?: string; returnCount?: number }) {
  const { data } = await api.post(`/students/${studentId}/review`, payload);
  return data;
}

export async function returnSecondLunchBox(studentId: string) {
  const { data } = await api.post(`/students/${studentId}/return-second-box`);
  return data;
}
