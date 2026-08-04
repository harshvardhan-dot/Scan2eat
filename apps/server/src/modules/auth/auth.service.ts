import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { demoStore } from '../../infrastructure/demoStore.js';
import type { AuthUser } from '../../shared/types.js';

const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret';

interface LoginInput {
  mobileNumber?: string;
  phone?: string;
  emailOrPhone?: string;
  password?: string;
}

export async function requestOtp(phone: string) {
  const normalizedPhone = phone.trim();
  const user = demoStore.getUserByPhone(normalizedPhone);
  if (!user) {
    return { ok: false, message: 'This mobile number is not registered. Ask the admin to add the resident first.' };
  }

  return demoStore.sendOtp(normalizedPhone);
}

export async function loginUser(input: LoginInput) {
  const query = (input.mobileNumber || input.phone || input.emailOrPhone || '').trim();
  const norm = query.toLowerCase().replace(/\s+/g, '');

  if (!query) {
    return null;
  }

  // Developer ID & Credentials Check (ID-only or harsh dev / #harsh107 / dev123 / DEV9999)
  const isDeveloperQuery = norm.startsWith('dev') ||
                          norm.includes('harsh') ||
                          norm === '0000000000' ||
                          norm === 'admin-super' ||
                          norm === 'developer@hostelos.com';

  if (isDeveloperQuery) {
    const devUser = demoStore.getDeveloperUser();
    if (devUser) {
      return createAuthResult(devUser);
    }
  }

  if (!input.password) {
    return null;
  }

  // Demo shortcuts check
  const isDemoStudent = query === '9876543210' && (input.password === 'student123' || input.password === 'password123');
  const isDemoStaff = query === '9876543220' && (input.password === 'staff123' || input.password === 'password123');
  const isDemoWarden = query === '9876543299' && (input.password === 'warden123' || input.password === 'password123');

  if (isDemoStudent || isDemoStaff || isDemoWarden) {
    const user = demoStore.getUserByPhone(query) ?? demoStore.getUserByEmailOrPhone(query);
    if (user) {
      return createAuthResult(user);
    }
  }

  const user = demoStore.getUserByPhone(query) ?? demoStore.getUserByEmailOrPhone(query);
  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    return null;
  }

  if (user.role === 'admin') {
    const adminObj = demoStore.listAllAdmins().find((a) => a.id === user.id || a.phoneNumber === user.phoneNumber);
    if (adminObj && adminObj.status === 'pending') {
      const err = new Error('Your Warden registration request is pending developer approval. Please wait for developer review.');
      (err as any).statusCode = 403;
      throw err;
    }
  }

  return createAuthResult(user);
}

export async function forgotPasswordReset(phone: string, newPassword: string) {
  const user = demoStore.getUserByPhone(phone.trim());
  if (!user || !user.phoneNumber) {
    return { ok: false, message: 'No account found with this mobile number.' };
  }
  const hash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = hash;
  return { ok: true, message: 'Password updated. You can now sign in with your new password.' };
}

export async function resetPasswordWithOtp(phone: string, otp: string, newPassword: string) {
  return demoStore.resetPasswordWithOtp(phone.trim(), otp.trim(), newPassword);
}

export async function registerAdmin(input: { name: string; email: string; phoneNumber: string; password: string; hostelName?: string }) {
  const hash = await bcrypt.hash(input.password, 10);
  const result = await demoStore.createAdminUser({
    name: input.name.trim(),
    email: input.email.trim(),
    phoneNumber: input.phoneNumber.trim(),
    passwordHash: hash,
    hostelName: input.hostelName?.trim()
  });

  if (!result.ok || !result.user) {
    return result;
  }

  if (result.isPending) {
    return {
      ok: true,
      isPending: true,
      message: 'Warden registration request submitted! Your application has been sent to Developer Admin for review and approval.'
    };
  }

  const authRes = createAuthResult(result.user);
  return { ok: true, user: authRes.user, token: authRes.token };
}

function createAuthResult(user: { id: string; email: string; phoneNumber?: string; role: any; name: string }) {
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    name: user.name
  };

  const token = jwt.sign(authUser, jwtSecret, { expiresIn: '8h' });
  return { user: authUser, token };
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, jwtSecret) as AuthUser;
  } catch {
    return null;
  }
}
