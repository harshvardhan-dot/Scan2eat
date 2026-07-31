export type UserRole = 'student' | 'mess_staff' | 'admin' | 'super_admin';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type MealStatus = 'pending' | 'collected' | 'skipped';

export interface AuthUser {
  id: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  name: string;
  hostelId?: string;
  hostelName?: string;
}

export interface HostelTenant {
  id: string;
  hostelName: string;
  organizationName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  maxStudents: number;
  paymentStatus?: 'paid' | 'pending' | 'overdue';
  monthlyFee?: number;
  paymentReference?: string;
  nextRenewalDate?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  roomNumber: string;
  rollNumber: string;
  mealPreference: 'veg' | 'nonVeg' | 'vegan';
  photoUrl: string;
  qrToken: string;
  role: 'student';
}

export interface MessStaffProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'mess_staff';
  shift: MealType | 'all';
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'super_admin';
  hostelName?: string;
  hostelId?: string;
  status?: 'active' | 'disabled' | 'pending';
}

export interface MealSession {
  id: string;
  type: MealType;
  sessionDate: string;
  status: 'scheduled' | 'active' | 'closed';
}

export interface MealCollection {
  id: string;
  studentId: string;
  sessionId: string;
  collectedByStaffId: string;
  collectedAt: string;
  status: MealStatus;
}

export interface Review {
  id: string;
  studentId: string;
  studentName?: string;
  hostelName?: string;
  sessionId?: string;
  rating: number;
  taste: number;
  quantity: number;
  freshness: number;
  temperature: number;
  tags?: string[];
  comment?: string;
  createdAt?: string;
  returnCount?: number;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  category: 'Food Quality' | 'Hygiene' | 'Box Damaged' | 'Portion Size' | 'Staff Behavior' | 'Other';
  subject: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  response?: string;
}

export interface MenuItem {
  mealType: MealType;
  mainDish: string;
  sideDishes: string[];
  dietaryTags: Array<'Veg' | 'Non-Veg' | 'Vegan'>;
  timing: string;
}

export interface DayMenu {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dateStr?: string;
  meals: MenuItem[];
}

export interface LoginRequest {
  emailOrPhone: string;
  password?: string;
  otp?: string;
  loginMethod?: 'password' | 'otp';
}

export interface VanDriver {
  id: string;
  driverName: string;
  vehicleNumber: string;
  phoneNumber: string;
  assignedRoute: string;
  licenseNumber?: string;
  status: 'active' | 'on_break' | 'inactive';
}

export interface PasswordResetRequest {
  id: string;
  userId?: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  requestedAt: string;
  status: 'pending' | 'resolved';
  resolvedAt?: string;
  note?: string;
}

export interface ScanResult {
  student: StudentProfile;
  session: MealSession;
  status: MealStatus;
  collectedAt?: string;
}
