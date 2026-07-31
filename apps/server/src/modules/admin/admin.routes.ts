import { Router } from 'express';
import { demoStore } from '../../infrastructure/demoStore.js';
import { verifyToken } from '../auth/auth.service.js';
import { createStaff, createStudent, deleteStudent, getReports, listStaff, listStudents, updateStudent } from './admin.service.js';

export const adminRouter = Router();

// Middleware: Strict Admin Authorization Check
adminRouter.use((req, res, next) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string ?? '');
  const user = verifyToken(token);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Access denied. Admin analytics and controls are accessible ONLY by logged-in administrators.' });
  }

  (req as any).user = user;
  next();
});

adminRouter.get('/dashboard', (_req, res) => {
  return res.json(demoStore.getAnalytics());
});

adminRouter.get('/students', async (req, res) => {
  const students = await listStudents(req.query as any);
  return res.json(students);
});

adminRouter.post('/students', async (req, res) => {
  const result = await createStudent(req.body);
  if (!result) {
    return res.status(409).json({ message: 'Student with this email or roll number already exists' });
  }
  // result = { student, notification }
  return res.json(result);
});

adminRouter.put('/students/:id', async (req, res) => {
  const updated = await updateStudent(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ message: 'Student not found' });
  }
  return res.json(updated);
});

adminRouter.delete('/students/:id', async (req, res) => {
  const deleted = await deleteStudent(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Student not found' });
  }
  return res.json({ ok: true });
});

adminRouter.get('/staff', async (_req, res) => {
  const staff = await listStaff();
  return res.json(staff);
});

adminRouter.post('/staff', async (req, res) => {
  const created = await createStaff(req.body);
  return res.json(created);
});

adminRouter.get('/meals', (_req, res) => {
  return res.json(demoStore.listSessions());
});

adminRouter.get('/reports', async (_req, res) => {
  const reports = await getReports();
  return res.json(reports);
});

adminRouter.get('/lunchboxes/today', (_req, res) => {
  return res.json(demoStore.getDailyLunchBoxSummary());
});

// Complaint management (admin)
adminRouter.get('/complaints', (_req, res) => {
  return res.json(demoStore.getAllComplaints());
});

adminRouter.patch('/complaints/:id', (req, res) => {
  const { status, response } = req.body as { status?: string; response?: string };
  const updated = demoStore.updateComplaintStatus(req.params.id, status as any, response);
  if (!updated) {
    return res.status(404).json({ message: 'Complaint not found' });
  }
  return res.json(updated);
});

adminRouter.post('/students/bulk', async (req, res) => {
  const studentList = req.body as Array<{ name: string; email: string; phoneNumber?: string; roomNumber: string; rollNumber: string; mealPreference?: 'veg' | 'nonVeg' | 'vegan' }>;
  if (!Array.isArray(studentList)) {
    return res.status(400).json({ message: 'Expected an array of student records' });
  }

  let createdCount = 0;
  const errors: string[] = [];

  for (const item of studentList) {
    if (!item.name || !item.roomNumber || !item.rollNumber) continue;
    const studentEmail = (item.email || '').trim() || `${item.rollNumber}@scan2eat.local`;
    const result = await createStudent({
      name: item.name,
      email: studentEmail,
      phoneNumber: item.phoneNumber,
      roomNumber: item.roomNumber,
      rollNumber: item.rollNumber,
      mealPreference: item.mealPreference ?? 'veg'
    });
    if (result) {
      createdCount++;
    } else {
      errors.push(`${item.name} (${item.rollNumber})`);
    }
  }

  return res.json({ createdCount, totalProcessed: studentList.length, skippedDuplicates: errors });
});

adminRouter.post('/students/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }
  const student = demoStore.getStudentById(req.params.id);
  if (!student || !student.phoneNumber) {
    return res.status(404).json({ message: 'Student not found' });
  }
  const result = await demoStore.firstTimeStudentPasswordSetup(student.phoneNumber, newPassword);
  return res.json(result);
});

// Password Reset Requests Queue
adminRouter.get('/password-requests', (_req, res) => {
  return res.json(demoStore.getPendingPasswordResetRequests());
});

adminRouter.post('/password-requests/:id/resolve', async (req, res) => {
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }
  const result = await demoStore.resolvePasswordResetRequest(req.params.id, newPassword);
  if (!result.ok) return res.status(400).json(result);
  return res.json(result);
});

// Van Drivers Management
adminRouter.get('/van-drivers', (_req, res) => {
  return res.json(demoStore.listVanDrivers());
});

adminRouter.post('/van-drivers', (req, res) => {
  const { driverName, vehicleNumber, phoneNumber, assignedRoute, licenseNumber } = req.body;
  if (!driverName || !vehicleNumber || !phoneNumber || !assignedRoute) {
    return res.status(400).json({ message: 'Driver name, vehicle number, phone number, and route are required.' });
  }
  const driver = demoStore.addVanDriver({ driverName, vehicleNumber, phoneNumber, assignedRoute, licenseNumber });
  return res.json(driver);
});

adminRouter.delete('/van-drivers/:id', (req, res) => {
  const deleted = demoStore.deleteVanDriver(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Driver not found' });
  return res.json({ ok: true });
});

// Weekly menu management
adminRouter.get('/menu', (_req, res) => {
  return res.json(demoStore.getWeeklyMenu());
});

adminRouter.put('/menu/:day', (req, res) => {
  const updated = demoStore.updateDayMenu(req.params.day, req.body.meals);
  if (!updated) {
    return res.status(404).json({ message: 'Day not found' });
  }
  return res.json(updated);
});

adminRouter.post('/menu/bulk', (req, res) => {
  const menuArray = req.body as Array<{ day: string; meals: any[] }>;
  if (!Array.isArray(menuArray)) {
    return res.status(400).json({ message: 'Expected an array of day menu items' });
  }
  for (const item of menuArray) {
    if (item.day && Array.isArray(item.meals)) {
      demoStore.updateDayMenu(item.day, item.meals);
    }
  }
  return res.json({ ok: true, message: 'Full weekly menu updated successfully!' });
});

// Super Admin Platform Owner Controls
adminRouter.get('/super/admins', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  return res.json(demoStore.listAllAdmins());
});

adminRouter.post('/super/admins/:id/toggle', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  const result = demoStore.toggleAdminStatus(req.params.id);
  if (!result.ok) return res.status(404).json(result);
  return res.json(result);
});

adminRouter.delete('/super/admins/:id', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  const result = demoStore.deleteWarden(req.params.id);
  if (!result.ok) return res.status(400).json(result);
  return res.json(result);
});

adminRouter.get('/super/tenants', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  return res.json(demoStore.listTenants());
});

adminRouter.post('/super/tenants', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  const { hostelName, organizationName, location, contactEmail, contactPhone, plan, maxStudents, paymentStatus, monthlyFee, paymentReference, nextRenewalDate } = req.body;
  if (!hostelName || !organizationName || !location || !contactPhone) {
    return res.status(400).json({ message: 'Hostel name, organization name, location, and contact phone are required.' });
  }
  const emailVal = (contactEmail || '').trim() || `contact@${hostelName.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`;
  const tenant = demoStore.addHostelTenant({ hostelName, organizationName, location, contactEmail: emailVal, contactPhone, plan, maxStudents, paymentStatus, monthlyFee, paymentReference, nextRenewalDate });
  return res.json(tenant);
});

adminRouter.get('/super/wardens/pending', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  return res.json(demoStore.listPendingWardens());
});

adminRouter.post('/super/wardens/:id/approve', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  const result = demoStore.approveWarden(req.params.id);
  if (!result.ok) return res.status(404).json(result);
  return res.json(result);
});

adminRouter.post('/super/wardens/:id/reject', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  const result = demoStore.rejectWarden(req.params.id);
  if (!result.ok) return res.status(404).json(result);
  return res.json(result);
});

adminRouter.post('/super/admins/:id/assign-hostel', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  const { hostelName } = req.body;
  if (!hostelName) {
    return res.status(400).json({ message: 'Hostel name is required' });
  }
  const result = demoStore.assignWardenHostel(req.params.id, hostelName);
  return res.json(result);
});

adminRouter.get('/super/hostels-students', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  return res.json(demoStore.getHostelsWithStudents());
});

adminRouter.get('/super/food-rankings', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  return res.json(demoStore.getHostelFoodRankings());
});

adminRouter.get('/super/reviews', (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  return res.json(demoStore.getAllReviews());
});
