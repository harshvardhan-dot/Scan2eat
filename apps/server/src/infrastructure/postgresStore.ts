import { prisma, isDatabaseConnected } from './prisma.js';
import type { AdminProfile, Complaint, DayMenu, MealCollection, MealSession, MessStaffProfile, Review, StudentProfile, UserRole, VanDriver } from '../shared/types.js';

export class PostgresStore {
  async getStudentByQrToken(token: string): Promise<StudentProfile | null> {
    if (!isDatabaseConnected() || !token) return null;
    let raw = token.trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1).trim();
    }
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.qrToken) raw = parsed.qrToken;
        else if (parsed.token) raw = parsed.token;
        else if (parsed.studentId) raw = parsed.studentId;
        else if (parsed.id) raw = parsed.id;
      }
    } catch {}

    if (raw.includes('://')) {
      try {
        const url = new URL(raw);
        const tokenParam = url.searchParams.get('qrToken') || url.searchParams.get('token') || url.pathname.split('/').filter(Boolean).pop();
        if (tokenParam) raw = tokenParam;
      } catch {}
    }

    const q = raw.trim();

    const record = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { qrToken: { equals: q, mode: 'insensitive' } },
          { id: { equals: q, mode: 'insensitive' } },
          { rollNumber: { equals: q, mode: 'insensitive' } },
          { phoneNumber: { equals: q } }
        ]
      }
    });

    if (!record) return null;

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phoneNumber: record.phoneNumber ?? undefined,
      roomNumber: record.roomNumber,
      rollNumber: record.rollNumber,
      mealPreference: record.mealPreference as any,
      photoUrl: record.photoUrl,
      qrToken: record.qrToken,
      role: 'student'
    };
  }

  async getStudentById(id: string): Promise<StudentProfile | null> {
    if (!isDatabaseConnected()) return null;
    const record = await prisma.studentProfile.findUnique({ where: { id } });
    if (!record) return null;

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phoneNumber: record.phoneNumber ?? undefined,
      roomNumber: record.roomNumber,
      rollNumber: record.rollNumber,
      mealPreference: record.mealPreference as any,
      photoUrl: record.photoUrl,
      qrToken: record.qrToken,
      role: 'student'
    };
  }

  async setMealOptIn(studentId: string, attending: boolean): Promise<boolean> {
    if (!isDatabaseConnected()) return attending;
    try {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: { isAttending: attending }
      });
      return attending;
    } catch {
      return attending;
    }
  }

  async getMealOptIn(studentId: string): Promise<boolean> {
    if (!isDatabaseConnected()) return false;
    const record = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { isAttending: true }
    });
    return record?.isAttending ?? false;
  }

  async createLunchBox(input: { studentId: string; mealType: string; issuedByStaffId: string }) {
    if (!isDatabaseConnected()) return null;
    return prisma.lunchBoxRecord.create({
      data: {
        studentId: input.studentId,
        mealType: input.mealType,
        currentStatus: 'issued',
        issuedByStaffId: input.issuedByStaffId,
        issuedAt: new Date()
      }
    });
  }

  async returnLunchBox(studentId: string, staffId: string) {
    if (!isDatabaseConnected()) return null;
    const activeBox = await prisma.lunchBoxRecord.findFirst({
      where: { studentId, currentStatus: 'issued' }
    });

    if (!activeBox) return null;

    return prisma.lunchBoxRecord.update({
      where: { id: activeBox.id },
      data: {
        currentStatus: 'returned',
        returnedAt: new Date(),
        returnedByStaffId: staffId
      }
    });
  }

  async getWeeklyMenu(): Promise<DayMenu[]> {
    if (!isDatabaseConnected()) return [];
    const dbMenus = await prisma.weeklyDayMenu.findMany();
    return dbMenus.map((m) => ({
      day: m.day as any,
      meals: JSON.parse(m.mealsJson)
    }));
  }

  async updateDayMenu(day: string, meals: any[]): Promise<DayMenu | null> {
    if (!isDatabaseConnected()) return null;
    const updated = await prisma.weeklyDayMenu.upsert({
      where: { day },
      update: { mealsJson: JSON.stringify(meals) },
      create: { day, mealsJson: JSON.stringify(meals) }
    });

    return {
      day: updated.day as any,
      meals: JSON.parse(updated.mealsJson)
    };
  }

  async createReview(studentId: string, review: Omit<Review, 'id' | 'studentId'>) {
    if (!isDatabaseConnected()) return null;
    return prisma.review.create({
      data: {
        studentId,
        rating: review.rating,
        taste: review.taste ?? 5,
        quantity: review.quantity ?? 5,
        freshness: review.freshness ?? 5,
        temperature: review.temperature ?? 5,
        tags: review.tags ? review.tags.join(',') : undefined,
        comment: review.comment,
        returnCount: review.returnCount ?? 1
      }
    });
  }

  async createComplaint(input: Omit<Complaint, 'id' | 'createdAt' | 'status'>) {
    if (!isDatabaseConnected()) return null;
    return prisma.complaint.create({
      data: {
        studentId: input.studentId,
        studentName: input.studentName,
        roomNumber: input.roomNumber,
        category: input.category,
        subject: input.subject,
        description: input.description,
        urgency: input.urgency as any,
        status: 'Open'
      }
    });
  }
}

export const postgresStore = new PostgresStore();
