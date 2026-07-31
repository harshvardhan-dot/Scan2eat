# HostelOS API Contract

## 1. Conventions

- Base path: /api/v1
- Authentication: JWT bearer token for admin and staff routes
- Response shape:
```ts
{
  success: boolean,
  data?: unknown,
  message?: string,
  error?: {
    code: string,
    details?: Record<string, unknown>
  }
}
```

## 2. Authentication

### POST /api/v1/auth/login
Request:
```ts
{
  email: string,
  password: string,
  role: 'admin' | 'mess_staff'
}
```

Response:
```ts
{
  token: string,
  user: {
    id: string,
    email: string,
    role: string,
    hostelId: string
  }
}
```

### GET /api/v1/auth/me
Returns the current authenticated user profile.

## 3. Staff Operations

### POST /api/v1/staff/scan
Validates a QR token and returns a student context.

Request:
```ts
{
  qrToken: string,
  mealType: 'breakfast' | 'lunch' | 'dinner'
}
```

Response:
```ts
{
  student: {
    id: string,
    name: string,
    roomNumber: string,
    rollNumber: string,
    photoUrl?: string
  },
  lunchBox: {
    id: string,
    currentStatus: 'issued' | 'returned' | 'pending' | 'lost'
  }
}
```

### POST /api/v1/staff/lunchboxes/issue
Issues a lunch box to a student.

Request:
```ts
{
  studentId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  sessionDate: string
}
```

Business rules:
- Reject if the student already has an active issued box.
- Create an audit log entry.

### POST /api/v1/staff/lunchboxes/return
Returns a lunch box.

Request:
```ts
{
  studentId: string,
  lunchBoxId?: string
}
```

Business rules:
- Reject if the box is already returned.
- Update status to returned and capture return time.

## 4. Admin Operations

### GET /api/v1/admin/dashboard
Returns dashboard metrics for the current hostel:
- total students
- issued today
- returned today
- outstanding
- lost
- collection percentage

### GET /api/v1/admin/students
Lists students with filters and pagination.

Query params:
- search
- roomNumber
- rollNumber
- status
- page
- limit

### POST /api/v1/admin/students
Creates a student profile and assigns a QR token.

### PUT /api/v1/admin/students/:id
Updates a student profile.

### DELETE /api/v1/admin/students/:id
Disables a student account and profile.

### GET /api/v1/admin/staff
Lists mess staff members for the hostel.

### POST /api/v1/admin/staff
Creates a staff account.

### GET /api/v1/admin/transactions
Returns transaction history for the hostel.

### GET /api/v1/admin/reports
Returns report summaries.

### GET /api/v1/admin/reports/export/csv
Exports report data as CSV.

## 5. Hostel Configuration

### GET /api/v1/hostels/:id
Returns hostel details and meal timing configuration.

### PUT /api/v1/hostels/:id
Updates hostel settings.

## 6. Shared / Platform

### GET /api/v1/health
Returns server health status.
