const fs = require('fs');
const path = require('path');

const adminPortalPath = path.join(process.cwd(), 'apps/web/src/components/AdminPortal.tsx');
let adminPortal = fs.readFileSync(adminPortalPath, 'utf8');

const translationsPath = path.join(process.cwd(), 'apps/web/src/lib/translations.ts');
let translationsFile = fs.readFileSync(translationsPath, 'utf8');

// The replacements for AdminPortal
const replacements = [
  { eng: "🏢 Hostels, Subscriptions & Analytics", key: "tabHostels" },
  { eng: "👥 All Hostels Student Directory", key: "tabStudentsDir" },
  { eng: "👮 Warden Directory & Approvals", key: "tabWardens" },
  { eng: "🏆 Food Quality Leaderboard", key: "tabLeaderboard" },
  { eng: "📅 Hostel Menus & Reviews", key: "tabMenus" },
  { eng: "Subscribed Hostels", key: "subscribedHostels" },
  { eng: "Active client institutions", key: "activeClientInst" },
  { eng: "Monthly Platform Revenue", key: "monthlyRev" },
  { eng: "Monthly active subscriptions", key: "monthlyActiveSubs" },
  { eng: "All Hostel Students", key: "allHostelStudents" },
  { eng: "Across all client hostels", key: "acrossAllClients" },
  { eng: "Platform Wardens", key: "platformWardens" },
  { eng: "awaiting approval", key: "awaitingAppr" },
  { eng: "Select a hostel to view operations", key: "selectHostelView" },
  { eng: "Pending Reset Reqs", key: "pendingResetReq" },
  { eng: "Password requests queue", key: "passwordReqQueue" },
  { eng: "Active Delivery Vans", key: "activeDelVans" },
  { eng: "Tiffin van drivers", key: "tiffinVans" },
  { eng: "Issued Today", key: "issuedTodayStr" },
  { eng: "Lunch boxes handed out", key: "boxesHandedOut" },
  { eng: "👥 Student Directory & Approvals", key: "tabWardenStudents" },
  { eng: "📦 Inventory & Supply Chain", key: "tabWardenInventory" },
  { eng: "🚚 Tiffin Van Drivers", key: "tabWardenVans" },
  { eng: "📅 Weekly Mess Menu", key: "tabWardenMenu" },
  { eng: "👑 Platform Owner & Wardens", key: "tabWardenSuperAdmins" },
];

const hindiDict = {
  tabHostels: "🏢 छात्रावास, सदस्यता और एनालिटिक्स",
  tabStudentsDir: "👥 सभी छात्रावास छात्र निर्देशिका",
  tabWardens: "👮 वार्डन निर्देशिका और अनुमोदन",
  tabLeaderboard: "🏆 खाद्य गुणवत्ता लीडरबोर्ड",
  tabMenus: "📅 छात्रावास मेनू और समीक्षाएं",
  subscribedHostels: "सदस्यता प्राप्त छात्रावास",
  activeClientInst: "सक्रिय ग्राहक संस्थान",
  monthlyRev: "मासिक प्लेटफ़ॉर्म राजस्व",
  monthlyActiveSubs: "मासिक सक्रिय सदस्यताएँ",
  allHostelStudents: "सभी छात्रावास छात्र",
  acrossAllClients: "सभी ग्राहक छात्रावासों में",
  platformWardens: "प्लेटफ़ॉर्म वार्डन",
  awaitingAppr: "अनुमोदन की प्रतीक्षा में",
  selectHostelView: "संचालन देखने के लिए छात्रावास का चयन करें",
  pendingResetReq: "लंबित रीसेट अनुरोध",
  passwordReqQueue: "पासवर्ड अनुरोध कतार",
  activeDelVans: "सक्रिय डिलीवरी वैन",
  tiffinVans: "टिफिन वैन ड्राइवर",
  issuedTodayStr: "आज जारी किया गया",
  boxesHandedOut: "लंच बॉक्स वितरित किए गए",
  tabWardenStudents: "👥 छात्र निर्देशिका और अनुमोदन",
  tabWardenInventory: "📦 इन्वेंटरी और आपूर्ति श्रृंखला",
  tabWardenVans: "🚚 टिफिन वैन ड्राइवर",
  tabWardenMenu: "📅 साप्ताहिक मेस मेनू",
  tabWardenSuperAdmins: "👑 प्लेटफ़ॉर्म के मालिक और वार्डन"
};

// Add to translations.ts
const enEntries = replacements.map(r => `    ${r.key}: "${r.eng}",`).join('\n');
const hiEntries = replacements.map(r => `    ${r.key}: "${hindiDict[r.key]}",`).join('\n');

translationsFile = translationsFile.replace(/en: {/, `en: {\n${enEntries}`);
translationsFile = translationsFile.replace(/hi: {/, `hi: {\n${hiEntries}`);
fs.writeFileSync(translationsPath, translationsFile);

// Replace in AdminPortal.tsx
for (const r of replacements) {
  // Try to find the exact string as a child node or attribute
  // e.g., >String< or "String" or `String`
  
  // As a JSX text node
  adminPortal = adminPortal.split(`>
              ${r.eng}`).join(`>
              {t('${r.key}')}`);
  
  adminPortal = adminPortal.split(`>${r.eng}<`).join(`>{t('${r.key}')}<`);
  adminPortal = adminPortal.split(`"${r.eng}"`).join(`{t('${r.key}')}`);
  adminPortal = adminPortal.split(`'${r.eng}'`).join(`{t('${r.key}')}`);
}

// Some special cases
adminPortal = adminPortal.replace(/👥 All Hostels Student Directory \(\{students.length\}\)/g, "{t('tabStudentsDir')} ({students.length})");
adminPortal = adminPortal.replace(/👮 Warden Directory & Approvals \{pendingWardens.length > 0 \? `\(\$\{pendingWardens.length\} Pending\)` : ''\}/g, "{t('tabWardens')} {pendingWardens.length > 0 ? `(${pendingWardens.length} Pending)` : ''}");
adminPortal = adminPortal.replace(/📅 Hostel Menus & Reviews \(\{allReviews.length\}\)/g, "{t('tabMenus')} ({allReviews.length})");
adminPortal = adminPortal.replace(/👑 Platform Owner & Wardens \(\{allAdmins.length\}\)/g, "{t('tabWardenSuperAdmins')} ({allAdmins.length})");
adminPortal = adminPortal.replace(/\{pendingWardens.length\} awaiting approval/g, "{pendingWardens.length} {t('awaitingAppr')}");
adminPortal = adminPortal.replace(/\{label: 'Total Students', value: reports\?\.totalStudents \?\? students\.length, hint: 'Registered hostel residents'\}/g, "{label: t('totalStudents'), value: reports?.totalStudents ?? students.length, hint: 'Registered hostel residents'}");
adminPortal = adminPortal.replace(/\{label: 'Pending Reset Reqs', value: resetRequests\.length, hint: 'Password requests queue'\}/g, "{label: t('pendingResetReq'), value: resetRequests.length, hint: t('passwordReqQueue')}");
adminPortal = adminPortal.replace(/\{label: 'Active Delivery Vans', value: vanDrivers\.length, hint: 'Tiffin van drivers'\}/g, "{label: t('activeDelVans'), value: vanDrivers.length, hint: t('tiffinVans')}");
adminPortal = adminPortal.replace(/\{label: 'Issued Today', value: reports\?\.issuedToday \?\? dashboard\?\.todaysMeals \?\? '0', hint: 'Lunch boxes handed out'\}/g, "{label: t('issuedTodayStr'), value: reports?.issuedToday ?? dashboard?.todaysMeals ?? '0', hint: t('boxesHandedOut')}");

fs.writeFileSync(adminPortalPath, adminPortal);

console.log("Translations added to AdminPortal and translations.ts updated.");
