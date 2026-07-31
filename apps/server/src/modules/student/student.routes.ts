import { Router } from 'express';
import { getStudentProfile, getStudentStatus, getMealHistory } from './student.service.js';
import { demoStore } from '../../infrastructure/demoStore.js';

export const studentRouter = Router();

// Real-time meal box + opt-in status
studentRouter.get('/:studentId/status', (req, res) => {
  const status = getStudentStatus(req.params.studentId);
  if (!status) {
    return res.status(404).json({ message: 'Student not found' });
  }
  return res.json(status);
});

studentRouter.get('/:studentId/profile', (req, res) => {
  const profile = getStudentProfile(req.params.studentId);
  if (!profile) {
    return res.status(404).json({ message: 'Student not found' });
  }
  return res.json(profile);
});

studentRouter.get('/:studentId/history', (req, res) => {
  const history = getMealHistory(req.params.studentId);
  return res.json(history);
});

// Meal attendance opt-in toggle
studentRouter.post('/:studentId/opt-in', (req, res) => {
  const { attending } = req.body as { attending: boolean };
  const result = demoStore.setMealOptIn(req.params.studentId, attending);
  return res.json({ studentId: req.params.studentId, attending: result });
});

studentRouter.post('/:studentId/checkin', (req, res) => {
  const { mealType } = req.body as { mealType?: string };
  demoStore.setMealOptIn(req.params.studentId, true);
  return res.json({
    ok: true,
    message: `Successfully checked in for ${mealType || 'Lunch'}! Your QR pass is now active.`,
    checkedIn: true
  });
});

// Student complaints
studentRouter.get('/:studentId/complaints', (req, res) => {
  return res.json(demoStore.getStudentComplaints(req.params.studentId));
});

studentRouter.post('/complaints', (req, res) => {
  const complaint = demoStore.createComplaint(req.body);
  return res.status(201).json(complaint);
});

// Weekly menu (public - students can view)
studentRouter.get('/menu/weekly', (_req, res) => {
  return res.json(demoStore.getWeeklyMenu());
});

// Van Drivers list for students
studentRouter.get('/van-drivers', (_req, res) => {
  return res.json(demoStore.listVanDrivers());
});

// Second time lunch box return
studentRouter.post('/:studentId/return-second-box', (req: any, res: any) => {
  const result = demoStore.returnSecondLunchBox(req.params.studentId);
  return res.json(result);
});

// Submit food review after return
studentRouter.post('/:studentId/review', (req: any, res: any) => {
  const result = demoStore.createStudentReview(req.params.studentId, req.body);
  return res.json(result);
});
