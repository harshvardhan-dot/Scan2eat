import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Scan2Eat PostgreSQL Seeding...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'warden@sunrisehostel.com' },
    update: {},
    create: {
      id: 'admin-1',
      name: 'Dr. Vikram Malhotra',
      email: 'warden@sunrisehostel.com',
      phoneNumber: '9876543299',
      passwordHash,
      role: 'admin',
      hasPasswordSet: true
    }
  });

  await prisma.adminProfile.upsert({
    where: { email: 'warden@sunrisehostel.com' },
    update: {},
    create: {
      id: 'admin-1',
      name: 'Dr. Vikram Malhotra',
      email: 'warden@sunrisehostel.com',
      phoneNumber: '9876543299',
      role: 'admin',
      hostelName: 'Sunrise Student Residency',
      status: 'active'
    }
  });

  // 2. Seed Mess Staff
  await prisma.user.upsert({
    where: { email: 'ramesh.staff@scan2eat.local' },
    update: {},
    create: {
      id: 'staff-1',
      name: 'Ramesh Kumar (Mess Manager)',
      email: 'ramesh.staff@scan2eat.local',
      phoneNumber: '9876543220',
      passwordHash,
      role: 'mess_staff',
      hasPasswordSet: true
    }
  });

  await prisma.messStaffProfile.upsert({
    where: { email: 'ramesh.staff@scan2eat.local' },
    update: {},
    create: {
      id: 'staff-1',
      name: 'Ramesh Kumar (Mess Manager)',
      email: 'ramesh.staff@scan2eat.local',
      phoneNumber: '9876543220',
      role: 'mess_staff',
      shift: 'all'
    }
  });

  // 3. Seed Students
  const students = [
    { id: 'student-1', name: 'Aarav Sharma', email: 'aarav@scan2eat.local', phone: '9876543210', room: 'A-101', roll: 'R-2024-001', pref: 'veg', qr: 'qr-student-001' },
    { id: 'student-2', name: 'Ananya Verma', email: 'ananya@scan2eat.local', phone: '9876543211', room: 'A-102', roll: 'R-2024-002', pref: 'nonVeg', qr: 'qr-student-002' },
    { id: 'student-3', name: 'Rohan Gupta', email: 'rohan@scan2eat.local', phone: '9876543212', room: 'B-205', roll: 'R-2024-003', pref: 'veg', qr: 'qr-student-003' }
  ];

  for (const s of students) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        email: s.email,
        phoneNumber: s.phone,
        passwordHash,
        role: 'student',
        hasPasswordSet: true
      }
    });

    await prisma.studentProfile.upsert({
      where: { email: s.email },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        email: s.email,
        phoneNumber: s.phone,
        roomNumber: s.room,
        rollNumber: s.roll,
        mealPreference: s.pref as any,
        photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
        qrToken: s.qr,
        isAttending: s.id === 'student-1'
      }
    });
  }

  // 4. Seed 7-Day Weekly Menu
  const weeklyMenu = [
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
        { mealType: 'dinner', mainDish: 'Chicken Curry / Shahi Paneer', sideDishes: ['Rice', 'Naan', 'Kheer'], dietaryTags: ['Non-Veg'], timing: '07:30 - 09:30 PM' }
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
        { mealType: 'dinner', mainDish: 'Egg Curry / Dum Aloo', sideDishes: ['Rice', 'Roti', 'Custard'], dietaryTags: ['Non-Veg'], timing: '07:30 - 09:30 PM' }
      ]
    },
    {
      day: 'Friday',
      meals: [
        { mealType: 'breakfast', mainDish: 'Uttapam & Sambhar', sideDishes: ['Tea', 'Banana'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 AM' },
        { mealType: 'lunch', mainDish: 'South Indian Thali', sideDishes: ['Sambar', 'Rasam', 'Curd Rice', 'Payasam'], dietaryTags: ['Veg'], timing: '12:30 - 02:30 PM' },
        { mealType: 'dinner', mainDish: 'Butter Chicken / Paneer Tikka Masala', sideDishes: ['Jeera Rice', 'Garlic Naan', 'Ice Cream'], dietaryTags: ['Non-Veg'], timing: '07:30 - 09:30 PM' }
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
        { mealType: 'lunch', mainDish: 'Special Hyderabadi Biryani (Chicken/Veg)', sideDishes: ['Raita', 'Salad', 'Rasgulla'], dietaryTags: ['Non-Veg'], timing: '12:30 - 02:30 PM' },
        { mealType: 'dinner', mainDish: 'Light Khichdi & Aloo Bhorta', sideDishes: ['Curd', 'Papad'], dietaryTags: ['Veg'], timing: '07:30 - 09:30 PM' }
      ]
    }
  ];

  for (const m of weeklyMenu) {
    await prisma.weeklyDayMenu.upsert({
      where: { day: m.day },
      update: { mealsJson: JSON.stringify(m.meals) },
      create: { day: m.day, mealsJson: JSON.stringify(m.meals) }
    });
  }

  console.log('✅ Scan2Eat PostgreSQL Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
