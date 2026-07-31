const fs = require('fs');
const path = require('path');

// ── 1. LoginPage.tsx ──────────────────────────────────────────────────────────
const loginPath = path.join(process.cwd(), 'apps/web/src/components/LoginPage.tsx');
let login = fs.readFileSync(loginPath, 'utf8');

// Remove 'developer' from the Role type
login = login.replace(
  "type Role = 'student' | 'mess_staff' | 'admin' | 'developer';",
  "type Role = 'student' | 'mess_staff' | 'admin';"
);

// Remove developer entry from roleMeta
login = login.replace(
  /,\s*developer:\s*\{[\s\S]*?'System owner portal for multi-hostel tenant management, warden approvals & food rankings\.'\s*\}\s*\}/,
  '\n}'
);

// Remove the entire Admin Login corner button block (top-left badge)
login = login.replace(
  /\s*\{\/\* Top Left Corner.*?Admin\/Dev Login Badge \*\/\}[\s\S]*?<\/div>\s*\n/,
  '\n'
);

// Remove the entire demo credentials box at the bottom (lines with "Demo Credentials")
login = login.replace(
  /\s*<div className="mt-6 rounded-2xl border border-slate-700\/70.*?<\/div>\s*\n(\s*<\/div>)/s,
  '\n          $1'
);

// Remove developer reference in password field className
login = login.replace(
  /\$\{\s*selectedRole === 'developer'\s*\?\s*'focus:border-amber-400 focus:ring-1 focus:ring-amber-400'\s*:\s*'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'\s*\}/g,
  "'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'"
);

// Remove developer branch in submit button className
login = login.replace(
  /selectedRole === 'developer'\s*\?\s*'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500\/20'\s*:\s*/g,
  ''
);

// Remove demoCredentials.developer in state (keep the whole useMemo but remove developer key)
login = login.replace(
  /\s*developer:\s*\{[^}]*\},?\n/g,
  '\n'
);

// Remove const demoCredentials useMemo entirely (it was only needed for pre-filling)
// and replace handleSelectRole to not use demoCredentials
login = login.replace(
  /const demoCredentials = useMemo\(\s*\(\) => \(\{[\s\S]*?\}\),\s*\[\]\s*\);/,
  ''
);

// Fix handleSelectRole - remove demo prefill
login = login.replace(
  /const handleSelectRole = \(role: Role\) => \{[\s\S]*?setSuccessMessage\(''\);\s*\};/,
  `const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setMobileNumber('');
    setPassword('');
    setMode('login');
    setError('');
    setSuccessMessage('');
  };`
);

// Fix handleSubmit - remove demoCredentials references
login = login.replace(
  /const phoneToUse = mobileNumber\.trim\(\) \|\| demoCredentials\[selectedRole\]\.mobile;/,
  'const phoneToUse = mobileNumber.trim();'
);
login = login.replace(
  /const passToUse = password \|\| demoCredentials\[selectedRole\]\.password;/,
  'const passToUse = password;'
);

// Remove useMemo import if no longer needed (keep import since useState etc are still used)
// Actually keep useMemo removed from imports since it was only used for demoCredentials
login = login.replace(
  "import { useEffect, useMemo, useState, type FormEvent } from 'react';",
  "import { useEffect, useState, type FormEvent } from 'react';"
);

fs.writeFileSync(loginPath, login);
console.log('LoginPage.tsx updated');

// ── 2. AdminPortal.tsx – Remove super_admins tab button ───────────────────────
const adminPath = path.join(process.cwd(), 'apps/web/src/components/AdminPortal.tsx');
let admin = fs.readFileSync(adminPath, 'utf8');

// Remove the "Platform Owner & Wardens" tab button
admin = admin.replace(
  /\s*<button\s*\n\s*onClick=\{[^}]*super_admins[^}]*\}[\s\S]*?\{t\('tabWardenSuperAdmins'\)[^}]*\}\s*\)\}\s*<\/button>/,
  ''
);

// Remove super_admins from the activeTab type union
admin = admin.replace(
  "'students' | 'bulk_excel' | 'password_queue' | 'van_drivers' | 'menu' | 'super_admins'",
  "'students' | 'bulk_excel' | 'password_queue' | 'van_drivers' | 'menu'"
);

// Remove allAdmins from Platform Wardens summary card (use 0 instead)
// The card shows allAdmins.length — keep it but it will just be hidden via the tab removal

fs.writeFileSync(adminPath, admin);
console.log('AdminPortal.tsx updated');

console.log('\nAll done!');
