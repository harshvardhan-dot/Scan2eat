# HostelOS Architecture Blueprint

## 1. Product Scope

HostelOS is a commercial SaaS platform for hostel owners that starts with a QR-based lunch box lifecycle workflow. The first release covers:

- secure admin authentication
- staff QR scanning and issue/return actions
- student record management and QR assignment
- lunch box lifecycle tracking and auditability
- admin dashboards and reporting

The architecture is intentionally modular so the product can expand later to payments, visitor management, maintenance, marketplace, and hostel discovery without a major rewrite.

## 2. Architectural Approach

This system follows a clean, layered architecture with strong separation of concerns:

- Presentation Layer
  - React + TypeScript
  - Tailwind CSS for a polished SaaS UI
  - React Router for role-based views
  - React Query for server state and caching

- Application Layer
  - Express route handlers
  - service modules that encapsulate business rules
  - validation and authorization middleware

- Domain Layer
  - core rules such as duplicate issue prevention, duplicate return prevention, and audit-safe transitions
  - domain entities for students, staff, admins, lunch boxes, transactions, and reports

- Infrastructure Layer
  - MongoDB + Mongoose
  - JWT-based authentication
  - password hashing with bcrypt
  - logging, error handling, and future notification/email integrations

- Shared Layer
  - DTOs, response contracts, enums, validation schemas, and role definitions

## 3. Core System Flows

### Admin Flow

1. Admin logs in securely.
2. Admin manages students, staff, hostel configuration, and reports.
3. Admin views metrics such as issued, returned, outstanding, lost, and collection percentage.

### Staff Flow

1. Staff logs in.
2. Staff scans a student QR.
3. The backend validates the token and returns student context.
4. Staff clicks Issue Lunch Box or Return Lunch Box.
5. The backend writes an auditable transaction and prevents duplicates.

### Student Flow

1. Student presents a QR code.
2. Staff scans it.
3. Staff performs the action.
4. The system records the lifecycle event without requiring the student to log in.

## 4. Security Model

- JWT authentication for admin and staff.
- Role-based access control for admin, mess staff, and future student accounts.
- QR tokens are opaque and non-identifying.
- Every scan and mutation is validated server-side.
- Audit logs record who initiated each action and when.
- Duplicate issue and duplicate return actions are blocked by idempotency checks.

## 5. Recommended Monorepo Structure

```text
hostellunch/
├─ apps/
│  ├─ web/                     # React frontend
│  │  └─ src/
│  │     ├─ app/               # routing, app shell, providers
│  │     ├─ features/          # feature modules: auth, admin, staff, dashboard
│  │     ├─ shared/            # shared UI utilities, types, hooks
│  │     └─ styles/            # Tailwind and global styling
│  └─ server/                  # Express backend
│     └─ src/
│        ├─ bootstrap/         # app setup, env config, db connection
│        ├─ modules/           # auth, students, staff, admin, reports
│        ├─ middleware/        # auth, validation, error handling
│        ├─ shared/            # DTOs, enums, constants, helpers
│        └─ infrastructure/     # repositories, mongo models, external services
├─ shared/                     # cross-app types and contracts
├─ docs/                       # architecture, schemas, API specs, roadmap
├─ scripts/                    # seed data, migrations, reporting utilities
└─ package.json
```

## 6. Design Principles

- Prefer explicit services over thin controllers.
- Keep business rules in the service layer.
- Treat each lunch box action as a state transition with validation.
- Keep QR payloads opaque and non-personal.
- Require auditability for all administrative actions.
- Favor strong TypeScript contracts and shared validation schemas.

## 7. Operational Readiness

The implementation plan is designed for production readiness with:

- structured logging
- centralized error responses
- request validation
- role-based route protection
- metrics-friendly data models for analytics
- extension points for future modules and AI-driven insights
