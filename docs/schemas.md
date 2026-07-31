# HostelOS Database Design

## 1. Collection Strategy

The first release uses MongoDB with Mongoose and a set of strongly typed collections that support both operational workflows and reporting.

## 2. Core Collections

### User
```ts
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  role: 'admin' | 'mess_staff' | 'student',
  hostelId: ObjectId,
  isActive: boolean,
  lastLoginAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### StudentProfile
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  hostelId: ObjectId,
  studentId: string,
  fullName: string,
  rollNumber: string,
  roomNumber: string,
  photoUrl?: string,
  qrToken: string,
  qrVersion: number,
  status: 'active' | 'inactive' | 'suspended',
  createdAt: Date,
  updatedAt: Date
}
```

### StaffProfile
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  hostelId: ObjectId,
  employeeId: string,
  fullName: string,
  assignedShift: 'breakfast' | 'lunch' | 'dinner' | 'all',
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### AdminProfile
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  hostelId: ObjectId,
  fullName: string,
  permissions: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Hostel
```ts
{
  _id: ObjectId,
  name: string,
  code: string,
  address: string,
  adminIds: ObjectId[],
  mealTimings: {
    breakfastStart: string,
    breakfastEnd: string,
    lunchStart: string,
    lunchEnd: string,
    dinnerStart: string,
    dinnerEnd: string
  },
  skipDeadlineMinutes: number,
  createdAt: Date,
  updatedAt: Date
}
```

### LunchBox
```ts
{
  _id: ObjectId,
  hostelId: ObjectId,
  studentId: ObjectId,
  currentStatus: 'issued' | 'returned' | 'lost' | 'pending',
  issuedAt?: Date,
  issuedByStaffId?: ObjectId,
  returnedAt?: Date,
  returnedByStaffId?: ObjectId,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  sessionDate: Date,
  lastTransactionId?: ObjectId,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```ts
{
  _id: ObjectId,
  hostelId: ObjectId,
  lunchBoxId: ObjectId,
  studentId: ObjectId,
  staffId: ObjectId,
  action: 'issue' | 'return' | 'mark_lost' | 'mark_missing' | 'skip',
  status: 'success' | 'failed',
  occurredAt: Date,
  metadata: {
    mealType?: string,
    qrToken?: string,
    ipAddress?: string,
    userAgent?: string
  },
  createdAt: Date
}
```

### Report
```ts
{
  _id: ObjectId,
  hostelId: ObjectId,
  type: 'daily' | 'weekly' | 'monthly',
  generatedAt: Date,
  summary: {
    totalStudents: number,
    issuedToday: number,
    returnedToday: number,
    outstanding: number,
    lost: number,
    collectionPercentage: number
  },
  createdAt: Date
}
```

### AuditLog
```ts
{
  _id: ObjectId,
  hostelId: ObjectId,
  actorId: ObjectId,
  actorRole: 'admin' | 'mess_staff',
  action: string,
  targetType: string,
  targetId: ObjectId,
  details?: Record<string, unknown>,
  createdAt: Date
}
```

## 3. Data Relationships

- One User can be linked to one StudentProfile, one StaffProfile, or one AdminProfile.
- Each LunchBox belongs to one student and one hostel.
- Each Transaction references one lunch box, one student, and one staff actor.
- AuditLog records all state-changing actions for compliance.

## 4. Recommended Indexes

- User: index email and hostelId
- StudentProfile: index qrToken, rollNumber, roomNumber, hostelId
- LunchBox: index studentId + sessionDate + currentStatus
- Transaction: index hostelId + occurredAt, and lunchBoxId
- AuditLog: index hostelId + createdAt

## 5. Business Rules Enforced by Schema and Service Layer

- A student can have only one active lunch box lifecycle record per session.
- Duplicate issue for the same active lunch box is rejected.
- Duplicate return is rejected if the box is already returned.
- Lost or missing boxes are tracked separately from normal lifecycle transitions.
