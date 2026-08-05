import { Router } from 'express';
import { demoStore } from '../../infrastructure/demoStore.js';
import { issueLunchBox, returnLunchBox } from './mess.service.js';

export const messRouter = Router();

messRouter.post('/scan', (req, res) => {
  const { qrToken, mealType } = req.body;
  if (!qrToken) {
    return res.status(400).json({ message: 'QR token is required' });
  }

  const student = demoStore.getStudentByQrToken(qrToken);
  if (!student) {
    return res.status(404).json({ message: `No student record found matching QR token "${qrToken}".` });
  }

  const isAttending = demoStore.getMealOptIn(student.id);

  const activeSession =
    demoStore.listSessions().find((item) => item.type === mealType && item.status === 'active') ||
    demoStore.getActiveSession();

  const activeLunchBox = demoStore.getActiveLunchBoxForStudent(student.id);
  const status = !isAttending ? 'not_opted_in' : activeLunchBox ? 'issued' : 'pending';

  return res.json({
    student,
    session: activeSession || { id: 'session-1', type: mealType || 'lunch', sessionDate: new Date().toISOString(), status: 'active' },
    status,
    isAttending,
    lunchBox: activeLunchBox ?? null,
    message: !isAttending ? `⚠️ Student ${student.name} has NOT marked that they are going to college / attending today. QR pass is inactive!` : undefined
  });
});

messRouter.post('/lunchboxes/issue', async (req, res) => {
  const result = await issueLunchBox(req.body);
  if (!result.ok) {
    return res.status(409).json(result);
  }

  return res.json(result);
});

messRouter.post('/lunchboxes/return', async (req, res) => {
  const result = await returnLunchBox(req.body);
  if (!result.ok) {
    return res.status(409).json(result);
  }

  return res.json(result);
});

messRouter.get('/pending-meals', (_req, res) => {
  return res.json(demoStore.getPendingCollections());
});
