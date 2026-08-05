import bcrypt from 'bcrypt';
import type { AdminProfile, Complaint, DayMenu, MealCollection, MealSession, MessStaffProfile, Review, StudentProfile, UserRole } from '../shared/types.js';

interface LunchBoxRecord {
  id: string;
  studentId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  currentStatus: 'issued' | 'returned' | 'lost' | 'pending';
  issuedAt: string;
  issuedByStaffId: string;
  returnedAt?: string;
  returnedByStaffId?: string;
}

const defaultPasswordHash = '$2b$10$6pKoHAPwGI0orB5UrFdS1e36neeDp0QnFMIrXuSkL.DjHGBq/yQDq'; // password123

class DemoStore {
  private students: StudentProfile[] = [];
  private messStaff: MessStaffProfile[] = [];
  private admins: AdminProfile[] = [];
  private sessions: MealSession[] = [];
  private collections: MealCollection[] = [];
  private reviews: Review[] = [];
  private complaints: Complaint[] = [];
  private weeklyMenu: DayMenu[] = [];
  private users: Array<{ id: string; email: string; phoneNumber?: string; passwordHash: string; role: UserRole; name: string; hasPasswordSet?: boolean }> = [];
  private lunchBoxes: LunchBoxRecord[] = [];
  private otpStore: Map<string, string> = new Map(); // phone -> OTP
  private mealOptIns: Map<string, boolean> = new Map(); // studentId -> attending status
  private vanDrivers: Array<{ id: string; driverName: string; vehicleNumber: string; phoneNumber: string; assignedRoute: string; licenseNumber?: string; status: 'active' | 'on_break' | 'inactive' }> = [];
  private passwordResetRequests: Array<{ id: string; userId?: string; name: string; phoneNumber: string; role: UserRole; requestedAt: string; status: 'pending' | 'resolved'; resolvedAt?: string; note?: string }> = [];

  constructor() {
    this.seed();
  }

  private seed() {
    this.lunchBoxes = [];
    this.collections = [];
    this.reviews = [];
    this.complaints = [];
    this.passwordResetRequests = [];
    this.vanDrivers = [];
    this.students = [];
    this.messStaff = [];
    this.admins = [];

    const today = new Date().toISOString();

    this.sessions = [
      { id: 'session-1', type: 'breakfast', sessionDate: today, status: 'active' },
      { id: 'session-2', type: 'lunch', sessionDate: today, status: 'active' },
      { id: 'session-3', type: 'dinner', sessionDate: today, status: 'scheduled' }
    ];

    this.students = [
      {
        id: 'student-1',
        name: 'Aarav Sharma',
        email: 'aarav@scan2eat.local',
        phoneNumber: '9876543210',
        roomNumber: 'A-101',
        rollNumber: 'R-2024-001',
        mealPreference: 'veg',
        photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
        qrToken: 'qr-student-001',
        role: 'student'
      },
      {
        id: 'student-2',
        name: 'Ananya Verma',
        email: 'ananya@scan2eat.local',
        phoneNumber: '9876543211',
        roomNumber: 'A-102',
        rollNumber: 'R-2024-002',
        mealPreference: 'nonVeg',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        qrToken: 'qr-student-002',
        role: 'student'
      },
      {
        id: 'student-3',
        name: 'Rohan Gupta',
        email: 'rohan@scan2eat.local',
        phoneNumber: '9876543212',
        roomNumber: 'B-205',
        rollNumber: 'R-2024-003',
        mealPreference: 'veg',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        qrToken: 'qr-student-003',
        role: 'student'
      }
    ];

    this.messStaff = [
      {
        id: 'staff-1',
        name: 'Ramesh Kumar (Mess Manager)',
        email: 'ramesh.staff@scan2eat.local',
        role: 'mess_staff',
        shift: 'all'
      }
    ];

    this.admins = [
      {
        id: 'admin-1',
        name: 'Dr. Vikram Malhotra',
        email: 'warden@sunrisehostel.com',
        phoneNumber: '9876543299',
        role: 'admin',
        hostelName: 'Sunrise Student Residency',
        status: 'active'
      },
      {
        id: 'admin-super',
        name: 'Developer System Admin',
        email: 'developer@hostelos.com',
        phoneNumber: '0000000000',
        role: 'super_admin',
        hostelName: 'Global Platform Control',
        status: 'active'
      }
    ];

    this.users = [
      { id: 'student-1', email: 'aarav@scan2eat.local', phoneNumber: '9876543210', passwordHash: defaultPasswordHash, role: 'student', name: 'Aarav Sharma', hasPasswordSet: true },
      { id: 'staff-1', email: 'ramesh.staff@scan2eat.local', phoneNumber: '9876543220', passwordHash: defaultPasswordHash, role: 'mess_staff', name: 'Ramesh Kumar (Mess Manager)', hasPasswordSet: true },
      { id: 'admin-1', email: 'warden@sunrisehostel.com', phoneNumber: '9876543299', passwordHash: defaultPasswordHash, role: 'admin', name: 'Dr. Vikram Malhotra', hasPasswordSet: true },
      { id: 'admin-super', email: 'developer@hostelos.com', phoneNumber: '0000000000', passwordHash: defaultPasswordHash, role: 'super_admin', name: 'Developer System Admin', hasPasswordSet: true },
      { id: 'admin-dev-phone', email: 'dev@scan2eat.local', phoneNumber: 'DEV9999', passwordHash: defaultPasswordHash, role: 'super_admin', name: 'Harsh (Developer Owner)', hasPasswordSet: true }
    ];

    this.tenants = [
      {
        id: 'hostel-1',
        hostelName: 'Sunrise Student Residency',
        organizationName: 'Sunrise Group of Institutions',
        location: 'North Campus, Delhi',
        contactEmail: 'contact@sunrisehostel.com',
        contactPhone: '9876543299',
        plan: 'pro',
        status: 'active',
        createdAt: '2025-01-15',
        maxStudents: 500,
        paymentStatus: 'paid',
        monthlyFee: 12999,
        paymentReference: 'TXN-98712-UPI',
        nextRenewalDate: '2026-12-31'
      },
      {
        id: 'hostel-2',
        hostelName: 'St. Xavier Boys Hostel',
        organizationName: 'St. Xavier Educational Society',
        location: 'Civil Lines, Jaipur',
        contactEmail: 'admin@stxavierhostel.org',
        contactPhone: '9811223344',
        plan: 'basic',
        status: 'active',
        createdAt: '2025-02-01',
        maxStudents: 350,
        paymentStatus: 'paid',
        monthlyFee: 4999,
        paymentReference: 'TXN-45123-NEFT',
        nextRenewalDate: '2026-11-30'
      }
    ];

    // Seed 1 active lunchbox for student-1
    this.lunchBoxes = [
      {
        id: 'box-demo-1',
        studentId: 'student-1',
        mealType: 'lunch',
        currentStatus: 'issued',
        issuedAt: new Date().toISOString(),
        issuedByStaffId: 'staff-1'
      }
    ];

    this.mealOptIns.set('student-1', true);

    this.weeklyMenu = [
      {
        day: 'Monday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Puri Bhaji', sideDishes: ['Tea', 'Fruit Bowl'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'Paneer Butter Masala & Roti', sideDishes: ['Jeera Rice', 'Dal Tadka', 'Gulab Jamun'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Kadhai Veg & Paratha', sideDishes: ['Rice', 'Mix Veg Soup'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 PM' }
        ]
      },
      {
        day: 'Tuesday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Aloo Paratha & Curd', sideDishes: ['Coffee', 'Butter'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'Rajma Chawal', sideDishes: ['Roti', 'Boondi Raita', 'Salad'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Chicken Curry / Shahi Paneer', sideDishes: ['Rice', 'Naan', 'Kheer'], dietaryTags: ['Non-Veg', 'Veg'], timing: '07:30 - 09:30 PM' }
        ]
      },
      {
        day: 'Wednesday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Idli Sambhar & Chutney', sideDishes: ['Filter Coffee'], dietaryTags: ['Vegan'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'Veg Biryani & Mirchi Salan', sideDishes: ['Raita', 'Papad'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Dal Makhani & Butter Roti', sideDishes: ['Jeera Rice', 'Moong Dal Halwa'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 PM' }
        ]
      },
      {
        day: 'Thursday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Poha & Jalebi', sideDishes: ['Tea', 'Sprouts'], dietaryTags: ['Vegan'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'Chole Bhature', sideDishes: ['Pickle', 'Lassi', 'Onion Salad'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Egg Curry / Dum Aloo', sideDishes: ['Rice', 'Roti', 'Custard'], dietaryTags: ['Non-Veg', 'Veg'], timing: '07:30 - 09:30 PM' }
        ]
      },
      {
        day: 'Friday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Uttapam & Sambhar', sideDishes: ['Tea', 'Banana'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'South Indian Thali', sideDishes: ['Sambar', 'Rasam', 'Curd Rice', 'Payasam'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Butter Chicken / Paneer Tikka Masala', sideDishes: ['Jeera Rice', 'Garlic Naan', 'Ice Cream'], dietaryTags: ['Non-Veg', 'Veg'], timing: '07:30 - 09:30 PM' }
        ]
      },
      {
        day: 'Saturday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Masala Dosa', sideDishes: ['Coconut Chutney', 'Tea'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'Kadhi Pakoda & Chawal', sideDishes: ['Aloo Fry', 'Papad'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Pav Bhaji & Pulao', sideDishes: ['Salad', 'Brownie'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 PM' }
        ]
      },
      {
        day: 'Sunday',
        meals: [
          { mealType: 'breakfast', mainDish: 'Chole Kulche', sideDishes: ['Tea', 'Fruit Juice'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 AM' },
          { mealType: 'lunch', mainDish: 'Special Hyderabadi Biryani (Chicken/Veg)', sideDishes: ['Raita', 'Salad', 'Rasgulla'], dietaryTags: ['Non-Veg', 'Veg'], timing: '12:30 - 02:30 PM' },
          { mealType: 'dinner', mainDish: 'Light Khichdi & Aloo Bhorta', sideDishes: ['Curd', 'Papad'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 PM' }
        ]
      }
    ];
  }

  reset() {
    this.seed();
  }

  getUserByPhone(phone: string) {
    const raw = phone.trim();
    const digits = raw.replace(/\D/g, '');
    return this.users.find((user) => {
      if (!user.phoneNumber) return false;
      const userDigits = user.phoneNumber.replace(/\D/g, '');
      return user.phoneNumber === raw || (digits.length >= 10 && userDigits.endsWith(digits));
    });
  }

  getUserByEmailOrPhone(query: string) {
    const q = query.trim().toLowerCase();
    return this.users.find((user) => user.email.toLowerCase() === q || (user.phoneNumber && user.phoneNumber === q));
  }

  getStudentById(studentId: string) {
    let found = this.students.find((student) => student.id === studentId);
    if (!found) {
      const user = this.users.find((u) => u.id === studentId || u.phoneNumber === studentId || u.email === studentId);
      if (user && user.role === 'student') {
        found = {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '9876543210',
          roomNumber: 'A-101',
          rollNumber: `R-${user.id.slice(-4)}`,
          mealPreference: 'veg',
          photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
          qrToken: `qr-${user.id}`,
          role: 'student'
        };
        this.students.push(found);
      }
    }
    return found;
  }

  getStudentByQrToken(token: string) {
    if (!token) return undefined;
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

    const q = raw.toLowerCase();
    const qWithoutPrefix = q.replace(/^qr-/, '');
    const digits = raw.replace(/\D/g, '');

    return this.students.find((student) => {
      const sQr = (student.qrToken || '').toLowerCase();
      const sId = student.id.toLowerCase();
      const sIdWithoutPrefix = sId.replace(/^student-/, '');
      const sRoll = student.rollNumber.toLowerCase();

      if (sQr === q || sQr === `qr-${q}` || sQr === `qr-${qWithoutPrefix}`) return true;
      if (sId === q || sId === `student-${qWithoutPrefix}` || sIdWithoutPrefix === qWithoutPrefix) return true;
      if (sRoll === q) return true;
      if (student.phoneNumber) {
        const pDigits = student.phoneNumber.replace(/\D/g, '');
        if (digits.length >= 10 && pDigits.endsWith(digits)) return true;
      }
      return false;
    });
  }


  async createAdminUser(input: { name: string; email: string; phoneNumber: string; passwordHash: string; hostelName?: string; isDeveloperCreated?: boolean }) {
    const existing = this.getUserByPhone(input.phoneNumber) || this.getUserByEmailOrPhone(input.email);
    if (existing) {
      return { ok: false, message: 'An account with this mobile number or email already exists.' };
    }

    const adminId = `admin-${Date.now()}`;
    const initialStatus = input.isDeveloperCreated ? 'active' : 'pending';

    const adminProfile: AdminProfile = {
      id: adminId,
      name: input.name,
      email: input.email,
      phoneNumber: input.phoneNumber,
      role: 'admin',
      hostelName: input.hostelName || 'Hostel Residency',
      status: initialStatus
    };

    this.admins.push(adminProfile);
    const userObj = {
      id: adminId,
      email: input.email,
      phoneNumber: input.phoneNumber,
      passwordHash: input.passwordHash,
      role: 'admin' as const,
      name: input.name,
      hasPasswordSet: true
    };
    this.users.push(userObj);

    return { ok: true, admin: adminProfile, user: userObj, isPending: !input.isDeveloperCreated };
  }

  getActiveSession() {
    return this.sessions.find((session) => session.status === 'active') ?? this.sessions[0];
  }

  getStudentMealHistory(studentId: string) {
    return this.collections.filter((collection) => collection.studentId === studentId);
  }

  getPendingCollections() {
    return this.collections.filter((collection) => collection.status === 'pending');
  }

  getActiveLunchBoxForStudent(studentId: string) {
    return this.lunchBoxes.find((entry) => entry.studentId === studentId && entry.currentStatus === 'issued');
  }

  getLatestLunchBoxForStudent(studentId: string) {
    return this.lunchBoxes.filter((entry) => entry.studentId === studentId).at(-1) ?? null;
  }

  // Meal Attendance Opt-in
  setMealOptIn(studentId: string, attending: boolean) {
    this.mealOptIns.set(studentId, attending);
    return attending;
  }

  getMealOptIn(studentId: string) {
    return this.mealOptIns.get(studentId) ?? false;
  }

  // OTP Management
  sendOtp(phone: string) {
    const mockOtp = '123456';
    this.otpStore.set(phone.trim(), mockOtp);
    return { ok: true, message: `OTP 123456 generated for ${phone}` };
  }

  verifyOtp(phone: string, otp: string): boolean {
    const stored = this.otpStore.get(phone.trim());
    return stored !== undefined && stored === otp.trim();
  }


  async resetPasswordWithOtp(phone: string, otp: string, newPassword: string) {
    const storedOtp = this.otpStore.get(phone.trim());
    if (!storedOtp || storedOtp !== otp.trim()) {
      return { ok: false, message: 'Invalid or expired OTP. Please use demo OTP 123456.' };
    }

    const user = this.users.find((u) => u.phoneNumber === phone.trim());
    if (!user) {
      return { ok: false, message: 'No account found with this phone number.' };
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    this.otpStore.delete(phone.trim());
    return { ok: true, message: 'Password updated successfully. You can now log in.' };
  }

  createLunchBox(input: { studentId: string; mealType: 'breakfast' | 'lunch' | 'dinner'; issuedByStaffId: string }) {
    const created: LunchBoxRecord = {
      id: `lunchbox-${Date.now()}`,
      studentId: input.studentId,
      mealType: input.mealType,
      currentStatus: 'issued',
      issuedAt: new Date().toISOString(),
      issuedByStaffId: input.issuedByStaffId
    };
    this.lunchBoxes.push(created);
    return created;
  }

  returnLunchBox(studentId: string, staffId: string) {
    const active = this.lunchBoxes.find((entry) => entry.studentId === studentId && entry.currentStatus === 'issued');
    if (!active) {
      return null;
    }

    active.currentStatus = 'returned';
    active.returnedAt = new Date().toISOString();
    active.returnedByStaffId = staffId;
    return active;
  }

  createStudent(input: { name: string; email?: string; phoneNumber?: string; roomNumber: string; rollNumber: string; mealPreference?: 'veg' | 'nonVeg' | 'vegan'; initialPassword?: string }) {
    const studentEmail = (input.email || '').trim().toLowerCase() || `${input.rollNumber.trim().toLowerCase()}@scan2eat.local`;
    const normalizedRoll = input.rollNumber.trim().toLowerCase();
    const phone = input.phoneNumber?.trim() ?? `98765${Math.floor(10000 + Math.random() * 90000)}`;

    const duplicateEmail = studentEmail.endsWith('@scan2eat.local') ? false : this.students.some((entry) => entry.email.trim().toLowerCase() === studentEmail);
    const duplicateRoll = this.students.some((entry) => entry.rollNumber.trim().toLowerCase() === normalizedRoll);

    if (duplicateEmail || duplicateRoll) {
      return null;
    }

    const studentId = `student-${Date.now()}`;
    const createdStudent: StudentProfile = {
      id: studentId,
      name: input.name,
      email: studentEmail,
      phoneNumber: phone,
      roomNumber: input.roomNumber,
      rollNumber: input.rollNumber,
      mealPreference: input.mealPreference ?? 'veg',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      qrToken: `qr-${Date.now()}`,
      role: 'student'
    };

    // Register user into authentication store so they can log in immediately!
    this.students.push(createdStudent);
    this.users.push({
      id: studentId,
      email: studentEmail,
      phoneNumber: phone,
      passwordHash: defaultPasswordHash,
      role: 'student',
      name: input.name
    });

    return {
      student: createdStudent,
      notification: `Login credentials sent to SMS (+91-${phone}). Password: password123`
    };
  }

  getAnalytics() {
    const total = this.collections.length;
    const collected = this.collections.filter((entry) => entry.status === 'collected').length;
    const skipped = this.collections.filter((entry) => entry.status === 'skipped').length;
    const pending = this.collections.filter((entry) => entry.status === 'pending').length;
    const averageRating = this.reviews.length
      ? this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length
      : 0;

    return {
      todaysMeals: total,
      deliveredMeals: collected,
      pendingMeals: pending,
      skippedMeals: skipped,
      averageRating: Number(averageRating.toFixed(1)),
      peakCollectionTime: '07:30',
      mostCommonComplaint: (this.reviews[0] as any)?.tags?.[0] ?? 'No complaints yet',
      mostLovedDish: 'Paneer Butter Masala',
      foodWasteEstimate: '12%'
    };
  }

  updateStudent(studentId: string, input: Partial<{ name: string; email: string; roomNumber: string; rollNumber: string; mealPreference: 'veg' | 'nonVeg' | 'vegan' }>) {
    const student = this.students.find((entry) => entry.id === studentId);
    if (!student) {
      return null;
    }

    Object.assign(student, input);
    return student;
  }

  deleteStudent(studentId: string) {
    const index = this.students.findIndex((entry) => entry.id === studentId);
    if (index === -1) {
      return false;
    }

    this.students.splice(index, 1);
    return true;
  }

  createStaff(input: { name: string; email: string; shift?: 'breakfast' | 'lunch' | 'dinner' | 'all' }) {
    const created: MessStaffProfile = {
      id: `staff-${Date.now()}`,
      name: input.name,
      email: input.email,
      role: 'mess_staff',
      shift: input.shift ?? 'all'
    };
    this.messStaff.push(created);
    return created;
  }

  skipMeal(studentId: string, sessionId: string) {
    const existing = this.collections.find((entry) => entry.studentId === studentId && entry.sessionId === sessionId);
    if (existing) {
      return { ok: false, message: 'Meal already recorded' };
    }

    const skipped: MealCollection = {
      id: `collection-${Date.now()}`,
      studentId,
      sessionId,
      collectedByStaffId: 'system',
      collectedAt: new Date().toISOString(),
      status: 'skipped'
    };

    this.collections.push(skipped);
    return { ok: true, collection: skipped };
  }

  createReview(studentId: string, sessionId: string, review: Omit<Review, 'id' | 'studentId' | 'sessionId'>) {
    const created: Review = {
      id: `review-${Date.now()}`,
      studentId,
      sessionId,
      ...review
    };
    this.reviews.push(created);
    return created;
  }

  getWeeklyMenu() {
    return this.weeklyMenu;
  }

  updateDayMenu(day: string, meals: DayMenu['meals']) {
    const dayItem = this.weeklyMenu.find((item) => item.day.toLowerCase() === day.toLowerCase());
    if (dayItem) {
      dayItem.meals = meals;
      return dayItem;
    }
    return null;
  }

  createComplaint(input: Omit<Complaint, 'id' | 'createdAt' | 'status'>) {
    const complaint: Complaint = {
      id: `complaint-${Date.now()}`,
      ...input,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    this.complaints.unshift(complaint);
    return complaint;
  }

  getStudentComplaints(studentId: string) {
    return this.complaints.filter((c) => c.studentId === studentId);
  }

  getAllComplaints() {
    return this.complaints;
  }

  updateComplaintStatus(id: string, status: Complaint['status'], response?: string) {
    const item = this.complaints.find((c) => c.id === id);
    if (!item) return null;
    item.status = status;
    if (response) item.response = response;
    return item;
  }

  getReports() {
    const issuedCount = this.lunchBoxes.filter((l) => l.currentStatus === 'issued' || l.currentStatus === 'returned').length;
    const returnedCount = this.lunchBoxes.filter((l) => l.currentStatus === 'returned').length;
    const outstandingCount = this.lunchBoxes.filter((l) => l.currentStatus === 'issued').length;

    return {
      totalStudents: this.students.length,
      issuedToday: issuedCount,
      returnedToday: returnedCount,
      outstanding: outstandingCount,
      lost: 0,
      collectionPercentage: issuedCount ? Number(((returnedCount / issuedCount) * 100).toFixed(1)) : 100,
      recentTransactions: this.lunchBoxes.slice(-5).map((l) => ({ id: l.id, studentId: l.studentId, status: l.currentStatus }))
    };
  }

  getDailyLunchBoxSummary() {
    const totalStudents = this.students.length;
    const checkedInCount = Array.from(this.mealOptIns.values()).filter(Boolean).length;
    const issuedCount = this.lunchBoxes.filter((l) => l.currentStatus === 'issued' || l.currentStatus === 'returned').length;
    const returnedCount = this.lunchBoxes.filter((l) => l.currentStatus === 'returned').length;
    const notReturnedCount = this.lunchBoxes.filter((l) => l.currentStatus === 'issued').length;

    // Staff forecast: number of lunch boxes to be made today
    const lunchBoxesToBeMade = Math.max(checkedInCount, issuedCount, totalStudents);

    const studentDetails = this.students.map((student) => {
      const activeBox = this.lunchBoxes.find((l) => l.studentId === student.id && l.currentStatus === 'issued');
      const latestBox = this.getLatestLunchBoxForStudent(student.id);
      const isCheckedIn = this.getMealOptIn(student.id);
      
      let status: 'not_issued' | 'issued' | 'returned' = 'not_issued';
      if (activeBox) {
        status = 'issued';
      } else if (latestBox && latestBox.currentStatus === 'returned') {
        status = 'returned';
      }

      const review = this.reviews.find((r) => r.studentId === student.id);

      return {
        id: student.id,
        name: student.name,
        roomNumber: student.roomNumber,
        rollNumber: student.rollNumber,
        phoneNumber: student.phoneNumber,
        mealPreference: student.mealPreference,
        isCheckedIn,
        status,
        issuedAt: activeBox?.issuedAt || latestBox?.issuedAt || null,
        returnedAt: latestBox?.returnedAt || null,
        review: review ? { rating: review.rating, comment: review.comment } : null
      };
    });

    return {
      totalStudents,
      checkedInCount,
      lunchBoxesToBeMade,
      issuedCount,
      returnedCount,
      notReturnedCount,
      studentDetails
    };
  }

  listStudents() {
    return this.students;
  }

  listStaff() {
    return this.messStaff;
  }

  listSessions() {
    return this.sessions;
  }

  // Van Driver Management
  listVanDrivers() {
    return this.vanDrivers;
  }

  addVanDriver(input: { driverName: string; vehicleNumber: string; phoneNumber: string; assignedRoute: string; licenseNumber?: string }) {
    const driver = {
      id: `driver-${Date.now()}`,
      driverName: input.driverName,
      vehicleNumber: input.vehicleNumber,
      phoneNumber: input.phoneNumber,
      assignedRoute: input.assignedRoute,
      licenseNumber: input.licenseNumber,
      status: 'active' as const
    };
    this.vanDrivers.push(driver);
    return driver;
  }

  deleteVanDriver(id: string) {
    const idx = this.vanDrivers.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.vanDrivers.splice(idx, 1);
    return true;
  }

  // Password Reset Requests Queue
  requestPasswordReset(phoneNumber: string, note?: string) {
    const user = this.getUserByPhone(phoneNumber);
    if (!user) {
      return { ok: false, message: 'This mobile number is not registered. Please contact hostel admin.' };
    }

    const existingPending = this.passwordResetRequests.find((r) => r.phoneNumber === user.phoneNumber && r.status === 'pending');
    if (existingPending) {
      return { ok: true, message: 'A password reset request for this mobile number is already pending with Admin.' };
    }

    const request = {
      id: `pwreq-${Date.now()}`,
      userId: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber ?? phoneNumber,
      role: user.role,
      requestedAt: new Date().toISOString(),
      status: 'pending' as const,
      note: note || 'Password reset requested via mobile portal.'
    };

    this.passwordResetRequests.unshift(request);
    return { ok: true, message: 'Password reset request submitted successfully to Admin for approval.' };
  }

  getPendingPasswordResetRequests() {
    return this.passwordResetRequests.filter((r) => r.status === 'pending');
  }

  async resolvePasswordResetRequest(requestId: string, newPassword: string) {
    const req = this.passwordResetRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, message: 'Reset request not found' };

    const user = this.users.find((u) => u.id === req.userId || u.phoneNumber === req.phoneNumber);
    if (!user) return { ok: false, message: 'Associated user account not found' };

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.hasPasswordSet = true;
    req.status = 'resolved';
    req.resolvedAt = new Date().toISOString();

    return { ok: true, message: `Password updated for ${user.name} (${user.phoneNumber}).` };
  }

  // First Time Student Setup
  async firstTimeStudentPasswordSetup(phoneNumber: string, newPassword: string) {
    const user = this.getUserByPhone(phoneNumber);
    if (!user) {
      return { ok: false, message: 'Mobile number not found in admin registration records. Contact admin first.' };
    }

    if (user.role !== 'student') {
      return { ok: false, message: 'First time setup is for registered hostel students only.' };
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.hasPasswordSet = true;

    return { ok: true, message: `Account activated for ${user.name}! You can now sign in with your mobile number and password.` };
  }

  private tenants: Array<{
    id: string;
    hostelName: string;
    organizationName: string;
    location: string;
    contactEmail: string;
    contactPhone: string;
    plan: 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'disabled';
    createdAt: string;
    maxStudents: number;
    paymentStatus: 'paid' | 'pending' | 'overdue';
    monthlyFee: number;
    paymentReference: string;
    nextRenewalDate: string;
  }> = [];

  // Developer / Super Admin Platform Management
  listAllAdmins() {
    return this.admins.map((a) => ({
      ...a,
      status: a.status ?? 'active'
    }));
  }

  listPendingWardens() {
    return this.admins.filter((a) => a.status === 'pending');
  }

  approveWarden(adminId: string) {
    const warden = this.admins.find((a) => a.id === adminId);
    if (!warden) return { ok: false, message: 'Warden not found' };
    warden.status = 'active';
    return { ok: true, message: `Warden registration for ${warden.name} has been APPROVED! They can now sign in.`, warden };
  }

  rejectWarden(adminId: string) {
    const idx = this.admins.findIndex((a) => a.id === adminId);
    if (idx === -1) return { ok: false, message: 'Warden not found' };
    const warden = this.admins[idx];
    this.admins.splice(idx, 1);
    const userIdx = this.users.findIndex((u) => u.id === adminId);
    if (userIdx !== -1) this.users.splice(userIdx, 1);
    return { ok: true, message: `Warden registration for ${warden.name} rejected and removed.` };
  }

  deleteWarden(adminId: string) {
    const idx = this.admins.findIndex((a) => a.id === adminId);
    if (idx === -1) return { ok: false, message: 'Warden account not found' };
    const warden = this.admins[idx];
    if (warden.role === 'super_admin') {
      return { ok: false, message: 'System Developer Super Admin cannot be removed.' };
    }
    this.admins.splice(idx, 1);
    const userIdx = this.users.findIndex((u) => u.id === adminId || u.phoneNumber === warden.phoneNumber);
    if (userIdx !== -1) this.users.splice(userIdx, 1);
    return { ok: true, message: `Warden account for ${warden.name} (${warden.hostelName}) has been permanently removed.` };
  }

  toggleAdminStatus(adminId: string) {
    const admin = this.admins.find((a) => a.id === adminId);
    if (!admin) return { ok: false, message: 'Admin not found' };
    admin.status = admin.status === 'disabled' ? 'active' : 'disabled';
    return { ok: true, message: `Admin account for ${admin.name} is now ${admin.status}.`, status: admin.status };
  }

  listTenants() {
    return this.tenants;
  }

  addHostelTenant(input: {
    hostelName: string;
    organizationName: string;
    location: string;
    contactEmail: string;
    contactPhone: string;
    plan?: 'trial' | 'basic' | 'pro' | 'enterprise';
    maxStudents?: number;
    paymentStatus?: 'paid' | 'pending' | 'overdue' | 'trial';
    monthlyFee?: number;
    paymentReference?: string;
    nextRenewalDate?: string;
  }) {
    const isTrial = input.plan === 'trial';
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 14);
    const tenant = {
      id: `hostel-${Date.now()}`,
      hostelName: input.hostelName,
      organizationName: input.organizationName,
      location: input.location,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      plan: input.plan || ('pro' as const),
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0],
      maxStudents: input.maxStudents || (isTrial ? 250 : 500),
      paymentStatus: isTrial ? 'trial' : (input.paymentStatus || 'paid'),
      monthlyFee: isTrial ? 0 : (input.monthlyFee ?? (input.plan === 'basic' ? 4999 : input.plan === 'enterprise' ? 29999 : 12999)),
      paymentReference: isTrial ? 'FREE-TRIAL-14DAYS' : (input.paymentReference || `TXN-${Math.floor(10000 + Math.random() * 90000)}-UPI`),
      nextRenewalDate: input.nextRenewalDate || trialDate.toISOString().split('T')[0]
    };
    this.tenants.push(tenant as any);
    return tenant;
  }

  toggleTenantPaymentStatus(tenantId: string) {
    const tenant = this.tenants.find((t) => t.id === tenantId);
    if (!tenant) return null;
    (tenant as any).paymentStatus = tenant.paymentStatus === 'paid' ? 'pending' : 'paid';
    return tenant;
  }

  deleteTenant(tenantId: string) {
    const idx = this.tenants.findIndex((t) => t.id === tenantId);
    if (idx === -1) return false;
    this.tenants.splice(idx, 1);
    return true;
  }

  assignWardenHostel(adminId: string, hostelName: string) {
    const admin = this.admins.find((a) => a.id === adminId);
    if (!admin) return { ok: false, message: 'Warden not found' };
    admin.hostelName = hostelName;
    return { ok: true, message: `Warden ${admin.name} assigned to ${hostelName} successfully.`, admin };
  }

  getHostelsWithStudents() {
    const lunchesCount = this.lunchBoxes.filter((l) => l.currentStatus === 'issued' || l.currentStatus === 'returned').length;
    return this.tenants.map((tenant, idx) => {
      const wardens = this.admins.filter((a) => {
        if (!a.hostelName) return false;
        const hName = a.hostelName.trim().toLowerCase();
        const tName = tenant.hostelName.trim().toLowerCase();
        return hName === tName || hName.includes(tName) || tName.includes(hName);
      });

      const activeWardens = wardens.length > 0 ? wardens : (this.admins[idx] ? [this.admins[idx]] : (this.admins[0] ? [this.admins[0]] : []));
      const registeredStudents = this.students;
      return {
        ...tenant,
        wardens: activeWardens,
        registeredStudentsCount: registeredStudents.length,
        totalLunchesIssued: lunchesCount,
        students: registeredStudents
      };
    });
  }

  getDeveloperUser() {
    return {
      id: 'admin-dev',
      name: 'Harsh (Developer Owner)',
      email: 'harshdev@scan2eat.com',
      phoneNumber: 'harshdev',
      role: 'super_admin' as const
    };
  }

  returnSecondLunchBox(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return { ok: false, message: 'Student not found' };

    const activeBox = this.getActiveLunchBoxForStudent(studentId);
    if (activeBox) {
      activeBox.currentStatus = 'returned';
      activeBox.returnedAt = new Date().toISOString();
    }

    const record: LunchBoxRecord = {
      id: `box-return2-${Date.now()}`,
      studentId,
      mealType: 'lunch',
      currentStatus: 'returned',
      issuedAt: new Date().toISOString(),
      issuedByStaffId: 'staff-1',
      returnedAt: new Date().toISOString(),
      returnedByStaffId: 'staff-1'
    };
    this.lunchBoxes.push(record);
    return { ok: true, message: 'Second time lunch box return recorded successfully! Please rate your meal below.', record };
  }

  createStudentReview(studentId: string, input: { rating: number; taste?: number; quantity?: number; freshness?: number; temperature?: number; comment?: string; returnCount?: number }) {
    const student = this.getStudentById(studentId);
    const hostelName = 'Sunrise Student Residency';
    const review: Review = {
      id: `rev-${Date.now()}`,
      studentId,
      studentName: student?.name || 'Resident Student',
      hostelName,
      sessionId: 'session-2',
      rating: input.rating || 5,
      taste: input.taste || input.rating || 5,
      quantity: input.quantity || input.rating || 5,
      freshness: input.freshness || input.rating || 5,
      temperature: input.temperature || input.rating || 5,
      comment: input.comment || '',
      createdAt: new Date().toISOString(),
      returnCount: input.returnCount || 1
    };
    this.reviews.unshift(review);
    return { ok: true, message: 'Thank you! Your meal review and feedback have been saved.', review };
  }

  getAllReviews() {
    return this.reviews;
  }

  getHostelFoodRankings() {
    const hostelMap: Record<string, { totalRating: number; count: number; taste: number; quantity: number; freshness: number }> = {};

    for (const r of this.reviews) {
      const name = r.hostelName || 'Sunrise Student Residency';
      if (!hostelMap[name]) {
        hostelMap[name] = { totalRating: 0, count: 0, taste: 0, quantity: 0, freshness: 0 };
      }
      hostelMap[name].totalRating += r.rating;
      hostelMap[name].taste += r.taste || r.rating;
      hostelMap[name].quantity += r.quantity || r.rating;
      hostelMap[name].freshness += r.freshness || r.rating;
      hostelMap[name].count += 1;
    }

    const rankings = Object.keys(hostelMap).map((hostelName) => {
      const data = hostelMap[hostelName];
      const avgRating = Number((data.totalRating / data.count).toFixed(1));
      const avgTaste = Number((data.taste / data.count).toFixed(1));
      const avgQuantity = Number((data.quantity / data.count).toFixed(1));
      const avgFreshness = Number((data.freshness / data.count).toFixed(1));
      return {
        hostelName,
        avgRating,
        avgTaste,
        avgQuantity,
        avgFreshness,
        totalReviews: data.count
      };
    });

    rankings.sort((a, b) => b.avgRating - a.avgRating);
    return rankings.map((r, index) => ({
      rank: index + 1,
      badge: index === 0 ? '🥇 Rank 1' : index === 1 ? '🥈 Rank 2' : index === 2 ? '🥉 Rank 3' : `#${index + 1}`,
      ...r
    }));
  }
}

export const demoStore = new DemoStore();
