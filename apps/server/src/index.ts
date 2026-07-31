import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './modules/auth/auth.routes.js';
import { messRouter } from './modules/mess/mess.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { studentRouter } from './modules/student/student.routes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hostelos-server' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/mess-staff', messRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/students', studentRouter);

app.listen(port, () => {
  console.log(`HostelOS server listening on http://localhost:${port}`);
});
