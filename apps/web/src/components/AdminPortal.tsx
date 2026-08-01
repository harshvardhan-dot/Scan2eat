import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useTranslation, Language } from '../lib/translations';
import {
  getAdminDashboard,
  getAdminReports,
  getAdminStudents,
  registerStudent,
  deleteStudent,
  getAdminMenu,
  updateDayMenu,
  bulkRegisterStudents,
  getPasswordResetRequests,
  resolvePasswordResetRequest,
  adminResetStudentPassword,
  getVanDrivers,
  addVanDriver,
  deleteVanDriver,
  uploadWeeklyMenuBulk,
  getSuperAdminsList,
  toggleSuperAdminStatus,
  getSuperTenantsList,
  createHostelTenant,
  getPendingWardensList,
  approveWarden,
  rejectWarden,
  deleteWardenAccount,
  getHostelsWithStudentsList,
  getHostelFoodRankings,
  getSuperAdminReviewsList,
  getDailyLunchBoxSummary,
  getAdminComplaints,
  resolveComplaint,
  assignWardenHostel
} from '../lib/api';

interface AdminPortalProps {
  user: { id?: string; name: string; role: string };
  isDark: boolean;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  roomNumber: string;
  rollNumber: string;
  mealPreference: string;
  qrToken?: string;
}

interface MenuItem {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  mainDish: string;
  sideDishes: string[];
  dietaryTags: Array<'Veg' | 'Non-Veg' | 'Vegan'>;
  timing: string;
}

interface DayMenu {
  day: string;
  meals: MenuItem[];
}

interface VanDriverItem {
  id: string;
  driverName: string;
  vehicleNumber: string;
  phoneNumber: string;
  assignedRoute: string;
  licenseNumber?: string;
  status: 'active' | 'on_break' | 'inactive';
}

interface PasswordResetReqItem {
  id: string;
  userId?: string;
  name: string;
  phoneNumber: string;
  role: string;
  requestedAt: string;
  status: string;
  note?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AdminPortal({ user, isDark }: AdminPortalProps) {
  const [lang, setLang] = useState<Language>('en');
  const t = useTranslation(lang);
  const [dashboard, setDashboard] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<DayMenu[]>([]);
  const [vanDrivers, setVanDrivers] = useState<VanDriverItem[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetReqItem[]>([]);

  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [editingMeals, setEditingMeals] = useState<MenuItem[]>([]);

  const [dailySummary, setDailySummary] = useState<any>(null);
  const [lunchBoxFilter, setLunchBoxFilter] = useState<'all' | 'issued' | 'returned' | 'not_issued'>('all');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Analytics loaded');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'lunchbox_tracker' | 'students' | 'bulk_excel' | 'password_queue' | 'van_drivers' | 'menu' | 'complaints'>('lunchbox_tracker');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [devTab, setDevTab] = useState<'hostels' | 'students' | 'wardens' | 'rankings' | 'menus_reviews'>('hostels');

  const handleToggleAdminStatus = async (adminId: string) => {
    setLoading(true);
    try {
      const res = await toggleSuperAdminStatus(adminId);
      setStatus(res.message);
      await loadData();
    } catch {
      setStatus('Failed to toggle admin status.');
    } finally {
      setLoading(false);
    }
  };

  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [pendingWardens, setPendingWardens] = useState<any[]>([]);
  const [hostelsWithStudents, setHostelsWithStudents] = useState<any[]>([]);
  const [foodRankings, setFoodRankings] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [selectedDevHostelFilter, setSelectedDevHostelFilter] = useState<string>('all');
  const [selectedDevHostelId, setSelectedDevHostelId] = useState<string>('');
  const [expandedHostelId, setExpandedHostelId] = useState<string | null>(null);

  // New Hostel Form State
  const [newHostelForm, setNewHostelForm] = useState({
    hostelName: '',
    organizationName: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'pro' as 'trial' | 'basic' | 'pro' | 'enterprise',
    maxStudents: 500,
    paymentStatus: 'paid' as 'paid' | 'pending' | 'overdue' | 'trial',
    monthlyFee: 12999,
    paymentReference: '',
    nextRenewalDate: '2026-09-01'
  });

  const handleApproveWarden = async (id: string) => {
    setLoading(true);
    try {
      const res = await approveWarden(id);
      setStatus(res.message);
      await loadData();
    } catch {
      setStatus('Failed to approve warden.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWarden = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this warden registration?')) return;
    setLoading(true);
    try {
      const res = await rejectWarden(id);
      setStatus(res.message);
      await loadData();
    } catch {
      setStatus('Failed to reject warden.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarden = async (id: string, name: string) => {
    const confirmFirst = window.confirm(`⚠️ Are you sure you want to permanently remove Warden "${name}"?`);
    if (!confirmFirst) return;

    const confirmSecond = window.confirm(`🚨 CRITICAL RE-CONFIRMATION:\nDeleting Warden "${name}" will revoke their login access immediately. Proceed with permanent deletion?`);
    if (!confirmSecond) return;

    setLoading(true);
    try {
      const res = await deleteWardenAccount(id);
      setStatus(res.message);
      await loadData();
    } catch {
      setStatus('Failed to delete warden account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWardenHostel = async (adminId: string, hostelName: string) => {
    setLoading(true);
    try {
      const res = await assignWardenHostel(adminId, hostelName);
      setStatus(res.message);
      await loadData();
    } catch {
      setStatus('Failed to assign warden to hostel.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createHostelTenant(newHostelForm);
      setStatus(`Added new hostel tenant: ${newHostelForm.hostelName} (${newHostelForm.plan.toUpperCase()} plan, Payment: ${newHostelForm.paymentStatus.toUpperCase()})!`);
      setNewHostelForm({
        hostelName: '',
        organizationName: '',
        location: '',
        contactEmail: '',
        contactPhone: '',
        plan: 'pro',
        maxStudents: 500,
        paymentStatus: 'paid',
        monthlyFee: 12999,
        paymentReference: '',
        nextRenewalDate: '2026-09-01'
      });
      await loadData();
    } catch {
      setStatus('Failed to add hostel tenant.');
    } finally {
      setLoading(false);
    }
  };

  // Single Student Registration Form State
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    roomNumber: '',
    rollNumber: '',
    mealPreference: 'veg' as 'veg' | 'nonVeg' | 'vegan'
  });

  // Bulk Excel/CSV Import State
  const [excelText, setExcelText] = useState('');
  const [importSummary, setImportSummary] = useState('');

  // Van Driver Form State
  const [driverForm, setDriverForm] = useState({
    driverName: '',
    vehicleNumber: '',
    phoneNumber: '',
    assignedRoute: '',
    licenseNumber: ''
  });

  // Bulk Menu JSON/CSV State
  const [menuUploadText, setMenuUploadText] = useState('');

  // Admin Direct Password Modal State
  const [editingPasswordUser, setEditingPasswordUser] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [customNewPassword, setCustomNewPassword] = useState('');

  const loadData = async () => {
    setLoading(true);
    setStatus('Fetching live data...');
    try {
      const [dash, reportData, studentList, menuData, driverList, pwReqs, adminsList, tenantList, pendingList, hostelStudentsList, rankingsList, reviewsList, summaryData, complaintsList] = await Promise.all([
        getAdminDashboard().catch(() => null),
        getAdminReports().catch(() => null),
        getAdminStudents(),
        getAdminMenu(),
        getVanDrivers(),
        getPasswordResetRequests(),
        getSuperAdminsList().catch(() => []),
        getSuperTenantsList().catch(() => []),
        getPendingWardensList().catch(() => []),
        getHostelsWithStudentsList().catch(() => []),
        getHostelFoodRankings().catch(() => []),
        getSuperAdminReviewsList().catch(() => []),
        getDailyLunchBoxSummary().catch(() => null),
        getAdminComplaints().catch(() => [])
      ]);
      setDashboard(dash);
      setReports(reportData);
      setStudents(studentList);
      setWeeklyMenu(menuData);
      setVanDrivers(driverList);
      setResetRequests(pwReqs);
      setAllAdmins(adminsList);
      setTenants(tenantList);
      setPendingWardens(pendingList);
      setHostelsWithStudents(hostelStudentsList);
      setFoodRankings(rankingsList);
      setAllReviews(reviewsList);
      if (summaryData) setDailySummary(summaryData);
      if (complaintsList) setComplaints(complaintsList);
      if (hostelStudentsList.length > 0) {
        setSelectedDevHostelId((prev) => prev || hostelStudentsList[0].id);
      }

      const currentDayMenu = menuData.find((d: DayMenu) => d.day === selectedDay);
      if (currentDayMenu) {
        setEditingMeals(JSON.parse(JSON.stringify(currentDayMenu.meals)));
      }

      setStatus('All administrative records loaded.');
    } catch (err) {
      console.error('Failed to load admin data', err);
      setStatus('Failed to load some admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadData();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentDayMenu = weeklyMenu.find((d) => d.day === selectedDay);
    if (currentDayMenu) {
      setEditingMeals(JSON.parse(JSON.stringify(currentDayMenu.meals)));
    }
  }, [selectedDay, weeklyMenu]);

  // Single Student Register
  const handleRegisterStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (!registrationForm.phoneNumber.trim()) {
      setStatus('Registration failed: Mobile number is required.');
      return;
    }

    setLoading(true);
    setStatus('Registering resident...');
    try {
      const result = await registerStudent(registrationForm);
      if (result) {
        setStatus(`Student registered: ${registrationForm.name} (${registrationForm.phoneNumber})`);
        setRegistrationForm({
          name: '',
          email: '',
          phoneNumber: '',
          roomNumber: '',
          rollNumber: '',
          mealPreference: 'veg'
        });
        await loadData();
      } else {
        setStatus('Registration failed: Mobile number, email, or roll number already exists.');
      }
    } catch {
      setStatus('Failed to register student.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Excel/CSV Parse & Import
  const handleBulkExcelRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (!excelText.trim()) {
      setStatus('Please paste or upload CSV/Excel data first.');
      return;
    }

    setLoading(true);
    setStatus('Parsing Excel/CSV student records...');
    try {
      const lines = excelText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      const parsedRecords: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('mobile')) {
          continue; // header line
        }

        const cols = line.split(/,|\t/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 4) {
          parsedRecords.push({
            name: cols[0],
            phoneNumber: cols[1],
            roomNumber: cols[2],
            rollNumber: cols[3],
            email: cols[4] || `${cols[3].toLowerCase()}@hostel.edu`,
            mealPreference: (cols[5]?.toLowerCase() === 'nonveg' ? 'nonVeg' : cols[5]?.toLowerCase() === 'vegan' ? 'vegan' : 'veg')
          });
        }
      }

      if (parsedRecords.length === 0) {
        setStatus('No valid records parsed. Ensure format is: Name, Mobile, Room, Roll, Email, Preference');
        setLoading(false);
        return;
      }

      const response = await bulkRegisterStudents(parsedRecords);
      setImportSummary(`Successfully imported ${response.createdCount} out of ${response.totalProcessed} students.`);
      setStatus(`Import complete! ${response.createdCount} students created.`);
      setExcelText('');
      await loadData();
    } catch {
      setStatus('Failed to import students from CSV/Excel.');
    } finally {
      setLoading(false);
    }
  };

  // Excel File Upload Handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setExcelText(content);
        setStatus(`Loaded file "${file.name}" (${content.split('\n').length} lines).`);
      }
    };
    reader.readAsText(file);
  };

  // Resolve Password Reset Request
  const handleResolvePasswordRequest = async (requestId: string, phone: string) => {
    const newPass = prompt(`Enter new password to assign for user (${phone}):`, 'password123');
    if (!newPass || !newPass.trim()) return;

    setLoading(true);
    try {
      const res = await resolvePasswordResetRequest(requestId, newPass.trim());
      if (res.ok) {
        setStatus(res.message);
        await loadData();
      } else {
        setStatus(res.message || 'Failed to update password.');
      }
    } catch {
      setStatus('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Admin Student Password Change
  const handleDirectPasswordChange = async () => {
    if (!editingPasswordUser || !customNewPassword.trim()) return;
    setLoading(true);
    try {
      const res = await adminResetStudentPassword(editingPasswordUser.id, customNewPassword.trim());
      if (res.ok) {
        setStatus(`Updated password for ${editingPasswordUser.name}!`);
        setEditingPasswordUser(null);
        setCustomNewPassword('');
        await loadData();
      } else {
        setStatus(res.message || 'Failed to update password.');
      }
    } catch {
      setStatus('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Add Van Driver
  const handleAddVanDriver = async (event: FormEvent) => {
    event.preventDefault();
    if (!driverForm.driverName || !driverForm.vehicleNumber || !driverForm.phoneNumber || !driverForm.assignedRoute) {
      setStatus('Driver name, vehicle number, mobile number, and route are required.');
      return;
    }

    setLoading(true);
    try {
      await addVanDriver(driverForm);
      setStatus(`Added Van Driver: ${driverForm.driverName} (${driverForm.vehicleNumber})`);
      setDriverForm({ driverName: '', vehicleNumber: '', phoneNumber: '', assignedRoute: '', licenseNumber: '' });
      await loadData();
    } catch {
      setStatus('Failed to add van driver.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVanDriver = async (id: string, name: string) => {
    if (!window.confirm(`Delete van driver record for "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteVanDriver(id);
      setStatus(`Driver "${name}" removed.`);
      await loadData();
    } catch {
      setStatus('Failed to delete van driver.');
    } finally {
      setLoading(false);
    }
  };

  // Save Single Day Menu
  const handleSaveMenu = async () => {
    setLoading(true);
    setStatus(`Updating ${selectedDay} menu...`);
    try {
      await updateDayMenu(selectedDay, editingMeals);
      setStatus(`Successfully updated ${selectedDay} menu!`);
      await loadData();
    } catch {
      setStatus('Failed to update menu.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Upload Weekly Menu (JSON or CSV)
  const handleBulkUploadMenu = async () => {
    if (!menuUploadText.trim()) return;
    setLoading(true);
    try {
      let parsedMenu: any[] = [];
      try {
        parsedMenu = JSON.parse(menuUploadText.trim());
      } catch {
        setStatus('Invalid JSON format for weekly menu import.');
        setLoading(false);
        return;
      }

      if (!Array.isArray(parsedMenu)) {
        setStatus('Weekly menu upload must be a JSON array of 7 days.');
        setLoading(false);
        return;
      }

      await uploadWeeklyMenuBulk(parsedMenu);
      setStatus('Full 7-day weekly menu uploaded successfully!');
      setMenuUploadText('');
      await loadData();
    } catch {
      setStatus('Failed to upload full weekly menu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteStudent(id);
      setStatus(`Resident "${name}" deleted.`);
      await loadData();
    } catch {
      setStatus('Failed to delete student.');
    } finally {
      setLoading(false);
    }
  };

  const handleMealChange = (index: number, field: keyof MenuItem, value: any) => {
    const updated = [...editingMeals];
    if (field === 'sideDishes' && typeof value === 'string') {
      updated[index].sideDishes = value.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (field === 'dietaryTags' && typeof value === 'string') {
      updated[index].dietaryTags = [value as any];
    } else {
      (updated[index] as any)[field] = value;
    }
    setEditingMeals(updated);
  };

  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'developer') {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 rounded-3xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-sm">Admin operations are restricted strictly to Hostel Administrators.</p>
      </div>
    );
  }

  const cardClass = isDark ? 'border-slate-700 bg-slate-900/70 text-slate-100' : 'border-violet-200 bg-white text-slate-900 shadow-md';
  const panelClass = isDark ? 'border-slate-700 bg-slate-900/60 text-slate-100' : 'border-violet-200 bg-white text-slate-900 shadow-md';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';
  const headText = isDark ? 'text-white' : 'text-slate-900';
  const subBoxBg = isDark ? 'bg-slate-950/70 border-slate-800 text-slate-100' : 'bg-violet-50/70 border-violet-200 text-slate-900';

  // -------------------------------------------------------------
  // DEDICATED DEVELOPER SYSTEM OWNER VIEW (super_admin / developer)
  // -------------------------------------------------------------
  if (user.role === 'super_admin' || user.role === 'developer') {
    const totalMRR = tenants.reduce(
      (acc, t) => acc + (t.plan === 'trial' ? 0 : (t.monthlyFee ?? (t.plan === 'basic' ? 4999 : t.plan === 'enterprise' ? 29999 : 12999))),
      0
    );

    const devFilteredStudents = students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.roomNumber.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.phoneNumber && s.phoneNumber.includes(q)) ||
        s.email.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Developer Header Banner */}
        <div className={`rounded-3xl border p-6 backdrop-blur ${panelClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400 border border-amber-500/20">
                👑 {t('devPortalTitle')}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">{t('devPortalTitle')}</h1>
              <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                {t('devPortalDesc')}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <button 
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 text-sm font-medium text-emerald-400 hover:bg-slate-800 transition"
              >
                {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
              </button>
              <button
                onClick={() => void loadData()}
                disabled={loading}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh Platform Data'}
              </button>
            </div>
          </div>
        </div>

          {/* Developer Navigation Tabs */}
          <div className="mt-6 flex gap-2 border-t border-slate-700/70 pt-4 overflow-x-auto pb-2 flex-nowrap sm:flex-wrap no-scrollbar">
            <button
              onClick={() => setDevTab('hostels')}
              className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                devTab === 'hostels'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                  : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
              }`}
            >
              🏫 Hostels & Payment Details ({tenants.length})
            </button>

            <button
              onClick={() => setDevTab('students')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                devTab === 'students'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                  : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
              }`}
            >
              {t('tabStudentsDir')} ({students.length})
            </button>

            <button
              onClick={() => setDevTab('wardens')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                devTab === 'wardens'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                  : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
              }`}
            >
              {t('tabWardens')} {pendingWardens.length > 0 ? `(${pendingWardens.length} Pending)` : ''}
            </button>

            <button
              onClick={() => setDevTab('rankings')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                devTab === 'rankings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                  : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
              }`}
            >
              {t('tabLeaderboard')}
            </button>

            <button
              onClick={() => setDevTab('menus_reviews')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                devTab === 'menus_reviews'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                  : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
              }`}
            >
              {t('tabMenus')} ({allReviews.length})
            </button>
          </div>


        {/* Status Notification */}
        {status ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-300 flex items-center justify-between">
            <span>ℹ️ {status}</span>
            <span className="text-[10px] opacity-70">HostelOS Super Admin Backend</span>
          </div>
        ) : null}

        {/* Developer Platform Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`rounded-3xl border p-5 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{t('subscribedHostels')}</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-400">{tenants.length}</p>
            <p className={`mt-1 text-xs ${mutedText}`}>{t('activeClientInst')}</p>
          </div>

          <div className={`rounded-3xl border p-5 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{t('monthlyRev')}</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">₹{totalMRR.toLocaleString()}</p>
            <p className={`mt-1 text-xs ${mutedText}`}>{t('monthlyActiveSubs')}</p>
          </div>

          <div className={`rounded-3xl border p-5 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{t('allHostelStudents')}</p>
            <p className="mt-2 text-3xl font-extrabold text-cyan-400">{students.length}</p>
            <p className={`mt-1 text-xs ${mutedText}`}>{t('acrossAllClients')}</p>
          </div>

          <div className={`rounded-3xl border p-5 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{t('platformWardens')}</p>
            <p className="mt-2 text-3xl font-extrabold text-violet-400">{allAdmins.length}</p>
            <p className={`mt-1 text-xs ${mutedText}`}>{pendingWardens.length} {t('awaitingAppr')}</p>
          </div>
        </div>

        {/* Real-Time Pending Warden Registration Approvals Queue */}
        {pendingWardens.length > 0 && (
          <div className="rounded-3xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 p-6 shadow-xl shadow-amber-500/10 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
                  <span>⏳</span> Real-Time Pending Warden Approval Requests ({pendingWardens.length})
                </h2>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  New hostel wardens signed up on the login screen and are waiting for your live developer authorization.
                </p>
              </div>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-xs font-bold animate-pulse">
                Action Required
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {pendingWardens.map((pw) => (
                <div key={pw.id} className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-slate-950/90 p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-white text-base">{pw.name}</p>
                      <span className="rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-semibold px-2 py-0.5">Applicant</span>
                    </div>
                    <p className="text-xs text-cyan-300 font-semibold mt-1">🏫 Hostel: {pw.hostelName || 'Hostel Residency'}</p>
                    <p className="text-xs text-slate-300 mt-0.5">📧 {pw.email}</p>
                    <p className="text-xs text-emerald-400 font-mono mt-0.5">📱 Mobile: {pw.phoneNumber}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleApproveWarden(pw.id)}
                      disabled={loading}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 transition shadow-md shadow-emerald-500/20"
                    >
                      ✓ Approve & Activate Warden
                    </button>
                    <button
                      onClick={() => handleRejectWarden(pw.id)}
                      disabled={loading}
                      className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEV TAB 1: HOSTELS, ANALYTICS & ONBOARDING */}
        {devTab === 'hostels' && (
          <div className="space-y-6">
            {/* All Onboarded Registered Hostels Cards Grid */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>🏫</span> All Onboarded Registered Client Hostels ({hostelsWithStudents.length})
                  </h2>
                  <p className={`text-xs ${mutedText} mt-0.5`}>
                    Browse client hostels with active subscription plans, assigned wardens, and click to view resident student details.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hostelsWithStudents.map((h) => {
                  const warden = h.wardens?.[0] || null;
                  const fee = h.plan === 'trial' ? 0 : (h.monthlyFee ?? (h.plan === 'basic' ? 4999 : h.plan === 'enterprise' ? 29999 : 12999));
                  const pStatus = h.paymentStatus || 'paid';
                  const isSelected = selectedDevHostelId === h.id;

                  return (
                    <div
                      key={h.id}
                      className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                          : isDark
                          ? 'border-slate-700 bg-slate-900/80 hover:border-slate-600'
                          : 'border-violet-200 bg-slate-50 hover:border-violet-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            h.plan === 'trial'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                              : h.plan === 'enterprise'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : h.plan === 'pro'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {h.plan === 'trial' ? '🎁 14-DAY TRIAL (₹0)' : `${h.plan ? h.plan.toUpperCase() : 'PRO'} PLAN (₹${fee.toLocaleString()}/mo)`}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            pStatus === 'trial'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : pStatus === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {pStatus === 'trial' ? '🎁 Active Trial' : pStatus === 'paid' ? '🟢 Active' : '🔴 Pending'}
                          </span>
                        </div>

                        <h3 className={`text-lg font-bold ${headText} mt-3`}>{h.hostelName}</h3>
                        <p className={`text-xs ${mutedText} mt-0.5`}>🏢 {h.organizationName} • 📍 {h.location}</p>

                        <div className={`mt-4 space-y-1.5 text-xs rounded-xl p-3 border ${subBoxBg}`}>
                          <p className="font-semibold text-violet-400 flex items-center justify-between">
                            <span>👮 Warden:</span>
                            <span className={`font-bold ${warden ? headText : 'text-amber-400'}`}>{warden ? warden.name : 'Unassigned'}</span>
                          </p>
                          <p className={`text-[11px] font-mono ${mutedText}`}>📱 Mobile: {warden ? warden.phoneNumber : 'N/A'}</p>
                          <p className="text-[11px] text-emerald-500 font-semibold flex items-center justify-between pt-1 border-t border-slate-700/40">
                            <span>👥 Residents:</span>
                            <span>{h.registeredStudentsCount ?? h.students?.length ?? 2} Students</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDevHostelId(h.id)}
                        className={`w-full rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : isDark
                            ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
                            : 'bg-violet-100 text-violet-900 hover:bg-violet-200 border border-violet-300'
                        }`}
                      >
                        <span>👁️</span> {isSelected ? 'Viewing Student Details Below' : 'Show Student Details & Roster'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Hostel Selector & Deep Warden Analytics */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>🏢</span> Client Hostel Deep Analytics & Student Details
                  </h2>
                  <p className={`text-sm ${mutedText} mt-1`}>
                    Select any onboarded hostel to inspect its assigned Warden details, analytics, and resident roster.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold uppercase ${mutedText}`}>Select Hostel:</span>
                  <select
                    value={selectedDevHostelId}
                    onChange={(e) => setSelectedDevHostelId(e.target.value)}
                    className={`rounded-2xl border px-4 py-2.5 text-sm font-bold outline-none focus:border-amber-400 ${
                      isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-violet-300 bg-white text-slate-900'
                    }`}
                  >
                    {hostelsWithStudents.map((h) => (
                      <option key={h.id} value={h.id}>
                        🏫 {h.hostelName} ({h.organizationName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Hostel Content */}
              {(() => {
                const targetHostel = hostelsWithStudents.find((h) => h.id === selectedDevHostelId) || hostelsWithStudents[0];
                if (!targetHostel) return <p className="text-xs text-slate-300">No client hostels found.</p>;

                const assignedWarden = targetHostel.wardens?.[0] || null;
                const fee = targetHostel.plan === 'trial' ? 0 : (targetHostel.monthlyFee ?? (targetHostel.plan === 'basic' ? 4999 : targetHostel.plan === 'enterprise' ? 29999 : 12999));
                const pStatus = targetHostel.paymentStatus || 'paid';
                const maxCap = targetHostel.maxStudents || 500;

                return (
                  <div className="space-y-6">
                    {/* Warden & Hostel Analytics Cards Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Assigned Warden Card */}
                      <div className={`rounded-2xl border p-4 space-y-1 sm:col-span-2 ${
                        isDark ? 'border-violet-500/30 bg-violet-500/10' : 'border-violet-300 bg-violet-50/80'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">👮 Assigned Warden Details</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            assignedWarden ? 'bg-violet-500/20 text-violet-600 border border-violet-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {assignedWarden ? 'Active Warden' : 'Unassigned'}
                          </span>
                        </div>
                        <p className={`text-lg font-extrabold ${assignedWarden ? headText : 'text-amber-400'} mt-1`}>
                          {assignedWarden ? assignedWarden.name : 'No Warden Assigned Yet'}
                        </p>
                        <p className={`text-xs ${mutedText}`}>
                          📧 {assignedWarden?.email || 'N/A'} • 📱 Mobile: <span className="font-mono text-cyan-500 font-bold">{assignedWarden?.phoneNumber || 'N/A'}</span>
                        </p>
                      </div>

                      {/* Total Registered Students / Capacity */}
                      <div className={`rounded-2xl border p-4 space-y-1 ${
                        isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50/80'
                      }`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">👥 Registered Students</span>
                        <p className={`text-2xl font-extrabold ${headText} mt-1`}>{targetHostel.registeredStudentsCount} <span className={`text-xs ${mutedText} font-normal`}>/ {maxCap} Limit</span></p>
                        <p className="text-[11px] text-emerald-600 font-semibold">{(targetHostel.registeredStudentsCount / maxCap * 100).toFixed(0)}% Occupancy Rate</p>
                      </div>

                      {/* Lunches Issued */}
                      <div className={`rounded-2xl border p-4 space-y-1 ${
                        isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-300 bg-amber-50/80'
                      }`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">🍱 Lunches Issued</span>
                        <p className={`text-2xl font-extrabold ${headText} mt-1`}>{targetHostel.totalLunchesIssued ?? 0}</p>
                        <p className="text-[11px] text-amber-600 font-semibold">Active Mess Deliveries</p>
                      </div>
                    </div>

                    {/* Subscription Payment Summary Banner */}
                    <div className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 text-xs ${
                      isDark ? 'border-slate-700 bg-slate-900/80' : 'border-violet-200 bg-violet-50/60'
                    }`}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-cyan-500 text-sm">💳 Subscription: {targetHostel.plan.toUpperCase()} Plan (₹{fee.toLocaleString()}/mo)</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                          pStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        }`}>
                          {pStatus === 'paid' ? '🟢 Subscription Active' : '🟡 Payment Pending'}
                        </span>
                      </div>
                      <div className={`flex flex-wrap items-center gap-3 font-mono text-[11px] ${mutedText}`}>
                        <span>Txn Ref: <strong className={headText}>{targetHostel.paymentReference || 'TXN-98214-UPI'}</strong></span>
                        <span>Renewal Date: <strong className="text-emerald-500 font-bold">{targetHostel.nextRenewalDate || '2026-09-01'}</strong></span>
                      </div>
                    </div>

                    {/* Student Details Roster Table for Selected Hostel */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-cyan-500 flex items-center gap-2">
                        <span>📋</span> Resident Student Details for {targetHostel.hostelName} ({targetHostel.students?.length ?? 0})
                      </h4>

                      <div className={`overflow-x-auto rounded-2xl border p-1 ${
                        isDark ? 'border-slate-700 bg-slate-900/80' : 'border-violet-200 bg-white'
                      }`}>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={`border-b font-semibold uppercase tracking-wider ${isDark ? 'border-slate-700 text-slate-300' : 'border-violet-200 text-slate-700 bg-violet-50'}`}>
                              <th className="py-3 px-4">Student Name</th>
                              <th className="py-3 px-4">Room No.</th>
                              <th className="py-3 px-4">Roll No.</th>
                              <th className="py-3 px-4">Mobile Number</th>
                              <th className="py-3 px-4">Meal Preference</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                            {targetHostel.students?.map((s: any) => (
                              <tr key={s.id} className={isDark ? 'hover:bg-slate-800/30 transition' : 'hover:bg-violet-50/60 transition'}>
                                <td className={`py-3 px-4 font-bold ${headText}`}>{s.name}</td>
                                <td className="py-3 px-4 font-mono text-cyan-500 font-semibold">🚪 {s.roomNumber}</td>
                                <td className={`py-3 px-4 font-mono ${mutedText}`}>{s.rollNumber}</td>
                                <td className="py-3 px-4 font-mono text-emerald-500 font-semibold">📱 {s.phoneNumber || 'N/A'}</td>
                                <td className="py-3 px-4 uppercase text-amber-500 font-bold">{s.mealPreference}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Add Hostel Client Form with Payment Details */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <span>➕</span> Register New Client Hostel & Subscription Plan
              </h2>
              <p className={`text-sm ${mutedText} mb-5`}>
                Onboard a new hostel institution with app subscription plan, student capacity limit, and payment details.
              </p>

              <form onSubmit={handleAddHostel} className="grid gap-4 sm:grid-cols-3 text-xs">
                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Hostel Name *</label>
                  <input
                    type="text"
                    required
                    value={newHostelForm.hostelName}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, hostelName: e.target.value })}
                    placeholder="e.g. St. Xavier Residency"
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Organization / Trust *</label>
                  <input
                    type="text"
                    required
                    value={newHostelForm.organizationName}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, organizationName: e.target.value })}
                    placeholder="e.g. Xavier Education Society"
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Location / City *</label>
                  <input
                    type="text"
                    required
                    value={newHostelForm.location}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, location: e.target.value })}
                    placeholder="e.g. Bangalore, KA"
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Contact Email (Optional)</label>
                  <input
                    type="email"
                    value={newHostelForm.contactEmail}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, contactEmail: e.target.value })}
                    placeholder="e.g. admin@xavierhostel.edu"
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newHostelForm.contactPhone}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, contactPhone: e.target.value })}
                    placeholder="e.g. 9845011223"
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>App Subscription Plan</label>
                  <select
                    value={newHostelForm.plan}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      const fee = p === 'trial' ? 0 : p === 'basic' ? 4999 : p === 'enterprise' ? 29999 : 12999;
                      const payStatus = p === 'trial' ? 'trial' : 'paid';
                      const ref = p === 'trial' ? 'FREE-TRIAL-14DAYS' : newHostelForm.paymentReference;
                      const trialDate = new Date();
                      trialDate.setDate(trialDate.getDate() + 14);
                      const nextRenewal = p === 'trial' ? trialDate.toISOString().split('T')[0] : newHostelForm.nextRenewalDate;
                      setNewHostelForm({
                        ...newHostelForm,
                        plan: p,
                        monthlyFee: fee,
                        paymentStatus: payStatus as any,
                        paymentReference: ref,
                        nextRenewalDate: nextRenewal
                      });
                    }}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  >
                    <option value="trial">🎁 14-Day Free Trial (₹0 - Full Pro Features)</option>
                    <option value="basic">Basic Plan (₹4,999/mo - Up to 200 Students)</option>
                    <option value="pro">Pro Plan (₹12,999/mo - Up to 500 Students)</option>
                    <option value="enterprise">Enterprise Plan (₹29,999/mo - Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Payment Status</label>
                  <select
                    value={newHostelForm.paymentStatus}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, paymentStatus: e.target.value as any })}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  >
                    <option value="trial">🎁 14-Day Free Trial (Active Trial Period)</option>
                    <option value="paid">🟢 Paid (Active Subscription)</option>
                    <option value="pending">🟡 Payment Pending</option>
                    <option value="overdue">🔴 Payment Overdue</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={newHostelForm.monthlyFee}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, monthlyFee: Number(e.target.value) })}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Transaction Ref ID</label>
                  <input
                    type="text"
                    value={newHostelForm.paymentReference}
                    onChange={(e) => setNewHostelForm({ ...newHostelForm, paymentReference: e.target.value })}
                    placeholder="e.g. TXN-98214-UPI"
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                </div>

                <div className="sm:col-span-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                  >
                    {loading ? 'Adding Hostel...' : '➕ Register & Onboard Client Hostel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DEV TAB 2: ALL HOSTELS STUDENTS DIRECTORY */}
        {devTab === 'students' && (
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>👥</span> Multi-Hostel Registered Students Roster
                </h2>
                <p className={`text-sm ${mutedText} mt-0.5`}>
                  Inspect and search student profiles across all onboarded client hostels.
                </p>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, room, roll, mobile or hostel..."
                className={`w-full sm:w-80 rounded-2xl border px-4 py-2.5 text-xs outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-semibold uppercase tracking-wider ${isDark ? 'border-slate-700 text-slate-300' : 'border-violet-200 text-violet-400'}`}>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Hostel Name</th>
                    <th className="py-3 px-4">Room No.</th>
                    <th className="py-3 px-4">Roll No.</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th className="py-3 px-4">Meal Pref.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {devFilteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4 font-semibold text-amber-300">{(s as any).hostelName || 'Registered Hostel'}</td>
                      <td className="py-3 px-4 font-mono text-cyan-300">{s.roomNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{s.rollNumber}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">📱 {s.phoneNumber || 'N/A'}</td>
                      <td className="py-3 px-4 uppercase text-amber-400 font-bold">{s.mealPreference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEV TAB 3: WARDENS DIRECTORY & ACCESS CONTROLS */}
        {devTab === 'wardens' && (
          <div className="space-y-6">
            {/* Pending Wardens Section */}
            {pendingWardens.length > 0 && (
              <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6">
                <h2 className="text-xl font-bold text-amber-300 mb-1 flex items-center gap-2">
                  <span>⏳</span> Pending Warden Registration Requests ({pendingWardens.length})
                </h2>
                <p className="text-xs text-amber-200/80 mb-4">
                  New wardens who registered themselves on the login page are awaiting your developer approval.
                </p>

                <div className="space-y-3">
                  {pendingWardens.map((pw) => (
                    <div key={pw.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4 text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{pw.name}</p>
                        <p className="text-slate-300">Hostel: <span className="text-cyan-300 font-semibold">{pw.hostelName || 'Hostel Residency'}</span></p>
                        <p className="text-slate-300">Email: {pw.email} • Mobile: <span className="font-mono text-emerald-400">{pw.phoneNumber}</span></p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveWarden(pw.id)}
                          disabled={loading}
                          className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          ✓ Approve Warden
                        </button>
                        <button
                          onClick={() => handleRejectWarden(pw.id)}
                          disabled={loading}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Wardens Directory */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <span>👮</span> Registered Hostel Wardens Directory & Status Controls
              </h2>
              <p className={`text-sm ${mutedText} mb-5`}>
                View, manage, or suspend warden accounts across all client hostels.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b font-semibold uppercase tracking-wider ${isDark ? 'border-slate-700 text-slate-300' : 'border-violet-200 text-violet-400'}`}>
                      <th className="py-3.5 px-4">Warden Name</th>
                      <th className="py-3.5 px-4">Assigned Hostel</th>
                      <th className="py-3.5 px-4">Mobile Number</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allAdmins.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <p>{adm.name}</p>
                          <p className={`text-xs font-normal ${mutedText}`}>{adm.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={adm.hostelName || ''}
                            onChange={(e) => {
                              const newHostel = e.target.value;
                              if (newHostel) {
                                void handleAssignWardenHostel(adm.id, newHostel);
                              }
                            }}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold outline-none cursor-pointer ${
                              isDark ? 'border-slate-700 bg-slate-950 text-cyan-400 focus:border-amber-400' : 'border-violet-300 bg-white text-slate-900 focus:border-violet-500'
                            }`}
                          >
                            <option value="">-- Assign Hostel --</option>
                            {hostelsWithStudents.map((h) => (
                              <option key={h.id} value={h.hostelName}>
                                🏫 {h.hostelName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400">📱 {adm.phoneNumber || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
                            adm.role === 'super_admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          }`}>
                            {adm.role === 'super_admin' ? 'developer_admin' : 'warden'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            adm.status === 'disabled'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : adm.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {adm.status === 'disabled' ? '🔴 Suspended' : adm.status === 'pending' ? '🟡 Pending Approval' : '🟢 Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {adm.role !== 'super_admin' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleAdminStatus(adm.id)}
                                disabled={loading}
                                className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                                  adm.status === 'disabled'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                }`}
                              >
                                {adm.status === 'disabled' ? 'Activate Warden' : 'Suspend Access'}
                              </button>

                              <button
                                onClick={() => handleDeleteWarden(adm.id, adm.name)}
                                disabled={loading}
                                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1"
                                title="Permanently remove warden account"
                              >
                                <span>🗑️ Delete</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-violet-400 italic font-semibold">Developer Owner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DEV TAB 4: FOOD QUALITY LEADERBOARD */}
        {devTab === 'rankings' && (
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <span>🏆</span> Inter-Hostel Food Quality Ranking Leaderboard
            </h2>
            <p className={`text-sm ${mutedText} mb-5`}>
              Inter-hostel food performance ranking calculated live from student meal ratings & reviews.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {foodRankings.map((fr) => (
                <div
                  key={fr.hostelName}
                  className={`rounded-2xl border p-5 transition hover:scale-[1.01] ${
                    fr.rank === 1
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-950/80 shadow-lg shadow-amber-500/10'
                      : isDark
                      ? 'border-slate-700 bg-slate-900/60'
                      : 'border-violet-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-bold">
                      {fr.badge}
                    </span>
                    <span className="text-2xl font-extrabold text-amber-400">⭐ {fr.avgRating} / 5</span>
                  </div>
                  <h3 className="font-bold text-base text-white mt-3">{fr.hostelName}</h3>
                  <p className={`text-xs ${mutedText} mt-0.5`}>Based on {fr.totalReviews} student reviews</p>

                  <div className="mt-4 pt-3 border-t border-slate-700/70 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-700">
                      <p className="text-[10px] text-slate-300 uppercase">Taste</p>
                      <p className="font-bold text-cyan-300 mt-0.5">{fr.avgTaste}★</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-700">
                      <p className="text-[10px] text-slate-300 uppercase">Quantity</p>
                      <p className="font-bold text-emerald-300 mt-0.5">{fr.avgQuantity}★</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-700">
                      <p className="text-[10px] text-slate-300 uppercase">Freshness</p>
                      <p className="font-bold text-violet-300 mt-0.5">{fr.avgFreshness}★</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEV TAB 5: HOSTEL MESS MENUS & STUDENT REVIEWS */}
        {devTab === 'menus_reviews' && (
          <div className="space-y-6">
            {/* Filter Header */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>📅</span> Hostel Mess Menus & Student Reviews
                  </h2>
                  <p className={`text-sm ${mutedText} mt-1`}>
                    Inspect the weekly mess menu and verified student reviews across all client hostels.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase text-slate-300">Select Hostel:</span>
                  <select
                    value={selectedDevHostelFilter}
                    onChange={(e) => setSelectedDevHostelFilter(e.target.value)}
                    className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="all">🏢 All Client Hostels</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.hostelName}>
                        🏫 {t.hostelName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Weekly Mess Menu Inspection */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-300">
                <span>🍽️</span> Weekly Mess Menu
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weeklyMenu.map((dayItem) => (
                  <div key={dayItem.day} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50'}`}>
                    <h4 className="font-bold text-base text-amber-400 border-b border-slate-700/70 pb-2 mb-3">
                      📅 {dayItem.day}
                    </h4>

                    <div className="space-y-3 text-xs">
                      {dayItem.meals.map((meal) => (
                        <div key={meal.mealType} className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-700/60">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase text-cyan-300">
                              {meal.mealType === 'breakfast' ? '🍳 Breakfast' : meal.mealType === 'lunch' ? '🍱 Lunch' : '🌙 Dinner'}
                            </span>
                            <span className="text-[10px] text-slate-300">{meal.timing}</span>
                          </div>
                          <p className="font-semibold text-white mt-1">{meal.mainDish}</p>
                          {meal.sideDishes && meal.sideDishes.length > 0 && (
                            <p className="text-[11px] text-slate-300 mt-0.5">Sides: {meal.sideDishes.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Reviews & Feedback Inspection */}
            <div className={`rounded-3xl border p-6 ${cardClass}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-amber-300">
                  <span>⭐</span> Resident Student Food Quality Reviews ({allReviews.filter((r) => selectedDevHostelFilter === 'all' || r.hostelName === selectedDevHostelFilter).length})
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {allReviews
                  .filter((r) => selectedDevHostelFilter === 'all' || r.hostelName === selectedDevHostelFilter)
                  .map((r) => (
                    <div key={r.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{r.studentName}</p>
                          <p className="text-xs text-cyan-400 font-medium">🏫 {r.hostelName || 'Registered Hostel'}</p>
                        </div>
                        <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-sm font-extrabold">
                          ⭐ {r.rating} / 5
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="rounded-lg bg-slate-900/80 p-1.5 border border-slate-700">
                          <p className="text-[9px] text-slate-300 uppercase">Taste</p>
                          <p className="font-bold text-cyan-300">{r.taste}★</p>
                        </div>
                        <div className="rounded-lg bg-slate-900/80 p-1.5 border border-slate-700">
                          <p className="text-[9px] text-slate-300 uppercase">Quantity</p>
                          <p className="font-bold text-emerald-300">{r.quantity}★</p>
                        </div>
                        <div className="rounded-lg bg-slate-900/80 p-1.5 border border-slate-700">
                          <p className="text-[9px] text-slate-300 uppercase">Freshness</p>
                          <p className="font-bold text-violet-300">{r.freshness}★</p>
                        </div>
                        <div className="rounded-lg bg-slate-900/80 p-1.5 border border-slate-700">
                          <p className="text-[9px] text-slate-300 uppercase">Temp</p>
                          <p className="font-bold text-amber-300">{r.temperature}★</p>
                        </div>
                      </div>

                      {r.comment && (
                        <p className="text-xs italic text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                          "{r.comment}"
                        </p>
                      )}

                      <p className="text-[10px] text-violet-400">Submitted: {new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.roomNumber.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      (s.phoneNumber && s.phoneNumber.includes(q)) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const summaryCards = [
    { label: t('totalStudents'), value: reports?.totalStudents ?? students.length, hint: 'Registered hostel residents' },
    { label: t('pendingResetReq'), value: resetRequests.length, hint: t('passwordReqQueue') },
    { label: t('activeDelVans'), value: vanDrivers.length, hint: t('tiffinVans') },
    { label: t('issuedTodayStr'), value: reports?.issuedToday ?? dashboard?.todaysMeals ?? '0', hint: t('boxesHandedOut') }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className={`rounded-3xl border p-6 backdrop-blur ${panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-400 border border-violet-500/20">
              {t('adminPortalTitle')}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{t('adminPortalTitle')}</h1>
            <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
              {t('adminPortalDesc')}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 text-sm font-medium text-emerald-400 hover:bg-slate-800 transition"
            >
              {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            </button>
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mt-6 flex gap-2 border-t border-slate-700/70 pt-4 overflow-x-auto pb-2 flex-nowrap sm:flex-wrap no-scrollbar">
          <button
            onClick={() => setActiveTab('lunchbox_tracker')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'lunchbox_tracker'
                ? 'bg-gradient-to-r from-violet-600 to-amber-500 text-white shadow-lg shadow-violet-500/25'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            🍱 Today's Lunch Box Tracker {dailySummary?.notReturnedCount > 0 ? `(⚠️ ${dailySummary.notReturnedCount} Outstanding)` : ''}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'students'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            👥 Student Directory ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk_excel')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'bulk_excel'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            📊 Excel Bulk Import
          </button>
          <button
            onClick={() => setActiveTab('password_queue')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'password_queue'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            🔑 Password Reset Requests {resetRequests.length > 0 ? `(${resetRequests.length})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('van_drivers')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'van_drivers'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            🚐 Van Drivers ({vanDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'menu'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            📅 Weekly Mess Menu
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-bold'
                : `border border-slate-700 ${isDark ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`
            }`}
          >
            📬 Student Complaints {complaints.length > 0 ? `(${complaints.length})` : ''}
          </button>
        </div>


      {/* Status Notification */}
      {status ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs font-medium text-cyan-300 flex items-center justify-between">
          <span>ℹ️ {status}</span>
          <span className="text-[10px] opacity-70">Realtime Express Node</span>
        </div>
      ) : null}

      {/* TAB: WARDEN LUNCH BOX TRACKER */}
      {activeTab === 'lunchbox_tracker' && (
        <div className="space-y-6">
          {/* Warden Summary Header Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-3xl border p-5 ${cardClass} bg-gradient-to-br from-violet-950/30 to-slate-900`}>
              <p className="text-xs uppercase font-bold text-violet-400">Total Resident Students</p>
              <p className="mt-2 text-3xl font-extrabold text-white">{dailySummary?.totalStudents ?? students.length}</p>
              <p className="mt-1 text-xs text-slate-300">Registered in hostel</p>
            </div>

            <div className={`rounded-3xl border p-5 ${cardClass} bg-gradient-to-br from-amber-950/30 to-slate-900`}>
              <p className="text-xs uppercase font-bold text-amber-400">Lunch Boxes Issued Today</p>
              <p className="mt-2 text-3xl font-extrabold text-amber-300">{dailySummary?.issuedCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-300">Handed over to students</p>
            </div>

            <div className={`rounded-3xl border p-5 ${cardClass} bg-gradient-to-br from-emerald-950/30 to-slate-900`}>
              <p className="text-xs uppercase font-bold text-emerald-400">Boxes Returned</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-300">{dailySummary?.returnedCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-300">Returned to mess counter</p>
            </div>

            <div className={`rounded-3xl border p-5 ${cardClass} bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/40`}>
              <p className="text-xs uppercase font-bold text-rose-400 flex items-center justify-between">
                <span>Not Returned</span>
                {dailySummary?.notReturnedCount > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-extrabold animate-pulse">Action Req</span>
                )}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-rose-400">{dailySummary?.notReturnedCount ?? 0}</p>
              <p className="mt-1 text-xs text-rose-300">Boxes currently outstanding</p>
            </div>
          </div>

          {/* Table & Filtering */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>🍱</span> Warden Daily Lunch Box & Resident Status Report
                </h2>
                <p className={`text-xs ${mutedText} mt-0.5`}>
                  Live tracking of issued meal boxes, returns, room numbers, and resident student ratings.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-300 uppercase mr-1">Filter:</span>
                <button
                  onClick={() => setLunchBoxFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    lunchBoxFilter === 'all'
                      ? 'bg-violet-500 text-white shadow-md'
                      : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  All ({dailySummary?.studentDetails?.length ?? students.length})
                </button>
                <button
                  onClick={() => setLunchBoxFilter('issued')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    lunchBoxFilter === 'issued'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Issued ({dailySummary?.studentDetails?.filter((s: any) => s.status === 'issued').length ?? 0})
                </button>
                <button
                  onClick={() => setLunchBoxFilter('returned')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    lunchBoxFilter === 'returned'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Returned ({dailySummary?.studentDetails?.filter((s: any) => s.status === 'returned').length ?? 0})
                </button>
                <button
                  onClick={() => setLunchBoxFilter('not_issued')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    lunchBoxFilter === 'not_issued'
                      ? 'bg-slate-600 text-white shadow-md'
                      : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Not Issued ({dailySummary?.studentDetails?.filter((s: any) => s.status === 'not_issued').length ?? 0})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase tracking-wider ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-violet-100 text-violet-900'}`}>
                  <tr>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5">Room & Roll</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Box Status</th>
                    <th className="px-4 py-3.5">Timings</th>
                    <th className="px-4 py-3.5">Food Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {(dailySummary?.studentDetails ?? [])
                    .filter((student: any) => {
                      if (lunchBoxFilter === 'all') return true;
                      return student.status === lunchBoxFilter;
                    })
                    .map((student: any) => (
                      <tr key={student.id} className={`transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-violet-50/50'}`}>
                        <td className="px-4 py-3.5 font-bold text-white">
                          {student.name}
                          {student.isCheckedIn && (
                            <span className="ml-2 rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                              Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300">
                            {student.roomNumber}
                          </span>
                          <span className="ml-2 text-xs text-slate-300 font-mono">{student.rollNumber}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300">{student.phoneNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                            student.status === 'issued'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : student.status === 'returned'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {student.status === 'issued' ? '🍱 Box Issued (Outstanding)' : student.status === 'returned' ? '🔄 Box Returned' : '⏳ Not Issued'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300">
                          {student.issuedAt ? (
                            <div>
                              <span>Issued: {new Date(student.issuedAt).toLocaleTimeString()}</span>
                              {student.returnedAt && (
                                <div className="text-emerald-400 mt-0.5">
                                  Returned: {new Date(student.returnedAt).toLocaleTimeString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">No activity today</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          {student.review ? (
                            <div>
                              <span className="font-extrabold text-amber-400">⭐ {student.review.rating} / 5</span>
                              {student.review.comment && (
                                <p className="text-[11px] text-slate-300 italic mt-0.5 truncate max-w-xs font-sans">
                                  "{student.review.comment}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[11px] italic">No review submitted yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-3xl border p-5 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-violet-400">{card.value}</p>
            <p className={`mt-1 text-xs ${mutedText}`}>{card.hint}</p>
          </div>
        ))}
      </div>

      {/* TAB 1: STUDENT DIRECTORY & SINGLE REGISTRATION */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Registration Form */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <span>➕</span> Register Student (Mobile Pre-Registration)
            </h2>
            <p className={`text-sm ${mutedText} mb-5`}>
              Pre-register a resident's mobile number. The student can complete <strong>First Time Setup</strong> on the login screen to set their password.
            </p>

            <form onSubmit={handleRegisterStudent} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1.5`}>Full Name *</label>
                <input
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1.5`}>Mobile Number (For Login) *</label>
                <input
                  value={registrationForm.phoneNumber}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, phoneNumber: e.target.value })}
                  placeholder="e.g. 9876543219"
                  type="tel"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1.5`}>Room Number *</label>
                <input
                  value={registrationForm.roomNumber}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, roomNumber: e.target.value })}
                  placeholder="e.g. B-204"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1.5`}>Roll Number *</label>
                <input
                  value={registrationForm.rollNumber}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, rollNumber: e.target.value })}
                  placeholder="e.g. R-105"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1.5`}>Email Address (Optional)</label>
                <input
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                  placeholder="e.g. rahul@example.com (optional)"
                  type="email"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1.5`}>Meal Preference</label>
                <select
                  value={registrationForm.mealPreference}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, mealPreference: e.target.value as any })}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                >
                  <option value="veg">Vegetarian</option>
                  <option value="nonVeg">Non-Veg</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              <div className="md:col-span-2 xl:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 font-bold text-white shadow-lg hover:scale-[1.005] transition disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Pre-Register Mobile Number'}
                </button>
              </div>
            </form>
          </div>

          {/* Student Table */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>📋</span> Student Roster Directory
                </h2>
                <p className={`text-xs ${mutedText} mt-1`}>Registered hostel residents with room and mobile numbers.</p>
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search name, room, mobile..."
                  className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-slate-700 text-slate-300' : 'border-violet-200 text-violet-400'}`}>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Room No.</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th className="py-3 px-4">Roll No.</th>
                    <th className="py-3 px-4">Meal Pref.</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className={`transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="py-3.5 px-4 font-semibold">
                        <p>{s.name}</p>
                        <p className={`text-xs font-normal ${mutedText}`}>{s.email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-cyan-400">
                        <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 border border-cyan-500/20">🚪 {s.roomNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">📱 {s.phoneNumber || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">{s.rollNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {s.mealPreference}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 flex gap-2">
                        <button
                          onClick={() => setEditingPasswordUser({ id: s.id, name: s.name, phone: s.phoneNumber || '' })}
                          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
                        >
                          🔑 Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL / CSV BULK STUDENT IMPORT */}
      {activeTab === 'bulk_excel' && (
        <div className={`rounded-3xl border p-6 ${cardClass}`}>
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <span>📊</span> Bulk Register Students from Excel / CSV
          </h2>
          <p className={`text-sm ${mutedText} mb-5`}>
            Upload an Excel (.csv / .txt) file or paste comma/tab-separated values to register multiple hostel residents at once.
          </p>

          {importSummary ? (
            <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              ✅ {importSummary}
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={`block text-xs font-semibold uppercase ${mutedText} mb-2`}>File Upload (.csv or .txt)</label>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className={`w-full rounded-2xl border p-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
              />

              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-xs space-y-2">
                <p className="font-bold text-cyan-300 uppercase tracking-wider">CSV Format Specification:</p>
                <p className="font-mono text-slate-300">Name, Mobile, Room, Roll, Email, Preference</p>
                <p className="text-slate-300 leading-relaxed">
                  Example:<br />
                  <code className="text-emerald-400">Amit Kumar, 9876543220, B-101, R-201, amit@example.com, veg</code><br />
                  <code className="text-emerald-400">Pooja Sharma, 9876543221, A-304, R-202, pooja@example.com, nonVeg</code>
                </p>
              </div>
            </div>

            <form onSubmit={handleBulkExcelRegister} className="flex flex-col justify-between space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-2`}>Paste CSV / Excel Data</label>
                <textarea
                  rows={8}
                  value={excelText}
                  onChange={(e) => setExcelText(e.target.value)}
                  placeholder="Name, Mobile, Room, Roll, Email, Preference&#10;Amit Kumar, 9876543220, B-101, R-201, amit@example.com, veg"
                  className={`w-full rounded-2xl border p-4 font-mono text-xs outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 font-bold text-white shadow-lg hover:scale-[1.005] transition disabled:opacity-50"
              >
                {loading ? 'Processing Import...' : 'Import Students from Excel Data'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: PASSWORD RESET REQUESTS QUEUE */}
      {activeTab === 'password_queue' && (
        <div className={`rounded-3xl border p-6 ${cardClass}`}>
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <span>🔑</span> Pending Password Reset Requests ({resetRequests.length})
          </h2>
          <p className={`text-sm ${mutedText} mb-5`}>
            Password reset requests submitted by students or staff. Admins can verify and assign new passwords directly.
          </p>

          {resetRequests.length > 0 ? (
            <div className="space-y-3">
              {resetRequests.map((req) => (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{req.name}</span>
                      <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold capitalize">
                        {req.role}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-mono text-emerald-400">📱 Mobile: {req.phoneNumber}</p>
                    <p className={`text-xs ${mutedText} mt-0.5`}>Requested at: {new Date(req.requestedAt).toLocaleString()}</p>
                    {req.note ? <p className="mt-1 text-xs text-slate-200 italic">"{req.note}"</p> : null}
                  </div>

                  <button
                    onClick={() => handleResolvePasswordRequest(req.id, req.phoneNumber)}
                    disabled={loading}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 font-bold text-slate-950 shadow-md hover:scale-[1.02] transition"
                  >
                    Set New Password & Resolve
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-violet-400 text-sm">
              ✨ No pending password reset requests in the queue!
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VAN DRIVERS MANAGEMENT */}
      {activeTab === 'van_drivers' && (
        <div className="space-y-6">
          {/* Add Van Driver Form */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <span>🚐</span> Add Tiffin Delivery Van Driver
            </h2>
            <p className={`text-sm ${mutedText} mb-5`}>
              Register tiffin van drivers and vehicle details so residents can view delivery contact information.
            </p>

            <form onSubmit={handleAddVanDriver} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Driver Name *</label>
                <input
                  value={driverForm.driverName}
                  onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Vehicle Number *</label>
                <input
                  value={driverForm.vehicleNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH-12-AB-4567"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Mobile Number *</label>
                <input
                  value={driverForm.phoneNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, phoneNumber: e.target.value })}
                  placeholder="e.g. 9822011223"
                  type="tel"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Assigned Delivery Route *</label>
                <input
                  value={driverForm.assignedRoute}
                  onChange={(e) => setDriverForm({ ...driverForm, assignedRoute: e.target.value })}
                  placeholder="e.g. Hostel Block A & B"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>License Number</label>
                <input
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                  placeholder="e.g. DL-2022-88741"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                />
              </div>

              <div className="md:col-span-2 xl:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-bold text-slate-950 shadow-lg hover:scale-[1.005] transition disabled:opacity-50"
                >
                  Add Van Driver Details
                </button>
              </div>
            </form>
          </div>

          {/* Van Drivers Table */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🚐</span> Active Tiffin Delivery Van Fleet
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {vanDrivers.map((driver) => (
                <div key={driver.id} className={`rounded-2xl border p-5 flex justify-between items-start ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-lg font-bold">{driver.driverName}</h3>
                    <p className="text-sm font-mono text-cyan-400 font-semibold mt-0.5">🚚 {driver.vehicleNumber}</p>
                    <p className="text-xs font-mono text-emerald-400 mt-1">📱 {driver.phoneNumber}</p>
                    <p className={`text-xs ${mutedText} mt-2`}>Route: <span className="font-semibold text-slate-200">{driver.assignedRoute}</span></p>
                    {driver.licenseNumber ? <p className={`text-[11px] ${mutedText}`}>License: {driver.licenseNumber}</p> : null}
                  </div>

                  <button
                    onClick={() => handleDeleteVanDriver(driver.id, driver.driverName)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEEKLY MENU & BULK MENU UPLOAD */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Bulk Menu Upload Box */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <span>📤</span> Bulk Upload Weekly Menu (JSON)
            </h2>
            <p className={`text-sm ${mutedText} mb-4`}>
              Paste a full 7-day menu JSON array to update the complete weekly mess schedule at once.
            </p>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={menuUploadText}
                onChange={(e) => setMenuUploadText(e.target.value)}
                placeholder='[{"day": "Monday", "meals": [{"mealType": "lunch", "mainDish": "Paneer Masala", "sideDishes": ["Rice", "Dal"], "dietaryTags": ["Veg"], "timing": "12:30 PM"}]}]'
                className={`w-full rounded-2xl border p-4 font-mono text-xs outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
              ></textarea>

              <button
                onClick={handleBulkUploadMenu}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 font-bold text-slate-950 shadow-md transition hover:scale-[1.01]"
              >
                Upload Full Weekly Menu
              </button>
            </div>
          </div>

          {/* Single Day Editor */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>✏️</span> Edit Day Menu ({selectedDay})
                </h2>
                <p className={`text-xs ${mutedText} mt-1`}>Configure main dishes, sides, and timings for {selectedDay}.</p>
              </div>
              <button
                onClick={handleSaveMenu}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-bold text-slate-950 shadow-lg hover:scale-[1.01] transition"
              >
                💾 Save {selectedDay} Menu
              </button>
            </div>

            {/* Day Selector */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700 pb-4">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    selectedDay === day
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : `border border-slate-700 ${isDark ? 'bg-slate-950 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {editingMeals.map((meal, index) => (
                <div key={meal.mealType} className={`rounded-2xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-violet-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                      {meal.mealType === 'breakfast' ? '🍳 Breakfast' : meal.mealType === 'lunch' ? '🍱 Lunch' : '🌙 Dinner'}
                    </span>
                    <input
                      type="text"
                      value={meal.timing}
                      onChange={(e) => handleMealChange(index, 'timing', e.target.value)}
                      placeholder="e.g. 07:30 - 09:30 AM"
                      className={`rounded-xl border px-3 py-1 text-xs outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Main Dish</label>
                      <input
                        type="text"
                        value={meal.mainDish}
                        onChange={(e) => handleMealChange(index, 'mainDish', e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Side Dishes (comma separated)</label>
                      <input
                        type="text"
                        value={meal.sideDishes ? meal.sideDishes.join(', ') : ''}
                        onChange={(e) => handleMealChange(index, 'sideDishes', e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold uppercase ${mutedText} mb-1`}>Dietary Tag</label>
                      <select
                        value={meal.dietaryTags?.[0] ?? 'Veg'}
                        onChange={(e) => handleMealChange(index, 'dietaryTags', e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      >
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: STUDENT COMPLAINTS BOX */}
      {activeTab === 'complaints' && (
        <div className={`rounded-3xl border p-6 ${cardClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>📬</span> Student Complaint Box ({complaints.length})
              </h2>
              <p className={`text-xs ${mutedText} mt-1`}>
                Official warden desk to review and resolve student meal, box damage, and facility complaints in real-time.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map((c: any) => (
                <div key={c.id} className={`rounded-2xl border p-5 space-y-3 ${
                  isDark ? 'border-slate-700 bg-slate-900/80' : 'border-violet-200 bg-slate-50'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`font-extrabold text-base ${headText}`}>{c.studentName || 'Resident Student'}</span>
                      <span className="font-mono text-xs text-cyan-500 font-semibold">🚪 Room: {c.roomNumber || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.urgency === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : c.urgency === 'Urgent'
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40'
                      }`}>
                        {c.urgency || 'Normal'}
                      </span>

                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {c.status === 'Resolved' ? '🟢 Resolved' : '🟡 Open / Action Required'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="rounded-md bg-violet-500/20 text-violet-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {c.category || 'General'}
                    </span>
                    <h3 className="text-sm font-bold text-amber-400 mt-2">{c.subject}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>{c.description}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Submitted: {c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Today'}</p>
                  </div>

                  {c.response ? (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs">
                      <p className="font-bold text-emerald-500">✓ Warden Response Provided:</p>
                      <p className={`mt-0.5 ${headText}`}>{c.response}</p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-700/50 flex items-center justify-end">
                      <button
                        onClick={() => {
                          const resp = window.prompt(`Respond to ${c.studentName}'s complaint:\n"${c.subject}"`);
                          if (resp) {
                            void resolveComplaint(c.id, 'Resolved', resp).then(() => loadData());
                          }
                        }}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-md"
                      >
                        ✏️ Write Official Response & Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className={`text-xs ${mutedText} text-center py-8`}>No student complaints filed yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Admin Password Reset Modal */}
      {editingPasswordUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${cardClass}`}>
            <h3 className="text-xl font-bold text-white mb-1">Reset Student Password</h3>
            <p className="text-xs text-slate-300 mb-4">
              Assign a new password for <span className="font-semibold text-cyan-300">{editingPasswordUser.name}</span> ({editingPasswordUser.phone}).
            </p>

            <div className="space-y-4">
              <input
                type="password"
                value={customNewPassword}
                onChange={(e) => setCustomNewPassword(e.target.value)}
                placeholder="Enter new password (e.g. pass1234)"
                className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleDirectPasswordChange}
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition"
                >
                  Save Password
                </button>
                <button
                  onClick={() => setEditingPasswordUser(null)}
                  className="rounded-2xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

