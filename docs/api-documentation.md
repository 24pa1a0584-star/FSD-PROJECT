# VISHNUFIT — RESTful API Documentation
**Base URL:** `http://localhost:5000/api`

---

## 1. Authentication & Session Management
All authenticated requests use either:
- **HttpOnly Cookie**: `jwt`
- **Authorization Header**: `Bearer <token>` (supported for Postman and automation)

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Log in using email & password. Sets HttpOnly cookie. |
| `POST` | `/auth/register` | Public | Student self-registration (creates User + Student profile). |
| `POST` | `/auth/logout` | Authenticated | Clears auth cookie & invalidates session. |
| `GET` | `/auth/me` | Authenticated | Fetch current user session, profile, and gym assignments. |
| `PATCH` | `/auth/update-profile`| Authenticated | Update user name, phone, or avatar. |
| `PATCH` | `/auth/change-password`| Authenticated | Change current password with old password verification. |

---

## 2. Gym Management & Campus Overview
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/gyms` | Authenticated | List all campus gym facilities (Boys Gym, Girls Gym). |
| `GET` | `/gyms/:id` | Authenticated | Retrieve detailed gym info, capacity, and current status. |
| `PATCH` | `/gyms/:id` | `SUPER_ADMIN` | Update gym details, capacity, or operational status. |
| `GET` | `/gyms/:gymId/dashboard` | `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF` | Facility dashboard statistics (scoped by authorization). |
| `GET` | `/gyms/campus/dashboard` | `SUPER_ADMIN` | Campus-wide aggregated statistics for Super Admin. |

---

## 3. Student Gym Registrations & Approvals
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/registrations` | `STUDENT` | Submit a new gym registration application. |
| `GET` | `/registrations` | `SUPER_ADMIN`, `GYM_MANAGER` | View applications (auto-scoped to manager's gym). |
| `GET` | `/registrations/my` | `STUDENT` | View student's personal registration history. |
| `PATCH` | `/registrations/:id/approve` | `SUPER_ADMIN`, `GYM_MANAGER` | Approve application and generate active membership. |
| `PATCH` | `/registrations/:id/reject` | `SUPER_ADMIN`, `GYM_MANAGER` | Reject application with review remarks. |

---

## 4. Smart Attendance & QR Verification
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/attendance/check-in` | `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF` | Manual check-in by roll number and gym ID. |
| `POST` | `/attendance/check-out`| `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF` | Manual check-out by roll number or attendance ID. |
| `POST` | `/attendance/qr-token` | `STUDENT` | Generate signed, 60s dynamic QR payload for check-in. |
| `POST` | `/attendance/qr-scan` | `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF` | Scan student QR code; validates and performs atomic check-in/out. |
| `GET` | `/attendance` | `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF` | Query attendance logs with pagination, dates, and gym filter. |
| `GET` | `/attendance/today-summary` | `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF` | Real-time counts of currently inside students per gym. |
| `GET` | `/attendance/my-history` | `STUDENT` | Student's personal attendance history and duration. |

---

## 5. Memberships
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/memberships/types` | Public / Authenticated | List all active membership types. |
| `GET` | `/memberships` | `SUPER_ADMIN`, `GYM_MANAGER` | List memberships (scoped by gym). |
| `GET` | `/memberships/my-card`| `STUDENT` | Retrieve student's digital gym card and QR identifier. |
| `PATCH` | `/memberships/:id/renew` | `SUPER_ADMIN`, `GYM_MANAGER` | Renew or extend a student's gym membership. |
| `PATCH` | `/memberships/:id/status`| `SUPER_ADMIN`, `GYM_MANAGER` | Change membership status (ACTIVE, SUSPENDED, CANCELLED). |

---

## 6. Trainers & Workout Plans
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/trainers` | Authenticated | List trainers with gym filtering and availability. |
| `POST` | `/trainers` | `SUPER_ADMIN`, `GYM_MANAGER` | Add a new trainer and assign gym. |
| `PATCH` | `/trainers/:id` | `SUPER_ADMIN`, `GYM_MANAGER`, `TRAINER` | Update trainer specialization or availability. |
| `POST` | `/trainers/assign` | `SUPER_ADMIN`, `GYM_MANAGER` | Assign trainer to a student. |
| `GET` | `/workouts` | Authenticated | List workout plans (scoped by role/student). |
| `POST` | `/workouts` | `SUPER_ADMIN`, `GYM_MANAGER`, `TRAINER` | Create a workout plan for a student. |
| `PUT` | `/workouts/:id` | `SUPER_ADMIN`, `GYM_MANAGER`, `TRAINER` | Update exercises, sets, reps, and schedule. |
| `GET` | `/workouts/my-plan` | `STUDENT` | Fetch logged-in student's personal workout plan. |

---

## 7. Equipment & Maintenance
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/equipment` | Authenticated | List equipment inventory (scoped by gym). |
| `POST` | `/equipment` | `SUPER_ADMIN`, `GYM_MANAGER` | Add equipment item to inventory. |
| `PATCH` | `/equipment/:id` | `SUPER_ADMIN`, `GYM_MANAGER` | Update condition, status, quantity. |
| `POST` | `/equipment/:id/maintenance`| `SUPER_ADMIN`, `GYM_MANAGER`, `GYM_STAFF`| Report equipment issue or log maintenance. |
| `GET` | `/equipment/maintenance/logs` | `SUPER_ADMIN`, `GYM_MANAGER` | View maintenance history and service records. |

---

## 8. Schedules & Announcements
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/schedules` | Authenticated | Get weekly operational schedule for both gyms. |
| `PUT` | `/schedules/:gymId` | `SUPER_ADMIN`, `GYM_MANAGER` | Update timings or closure notice. |
| `GET` | `/announcements` | Authenticated | List announcements (filtered by target role/gym). |
| `POST` | `/announcements` | `SUPER_ADMIN`, `GYM_MANAGER` | Create gym-specific or campus-wide announcement. |
| `DELETE`| `/announcements/:id`| `SUPER_ADMIN`, `GYM_MANAGER` | Remove an announcement. |

---

## 9. Analytics & Reports
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/attendance` | `SUPER_ADMIN`, `GYM_MANAGER` | Monthly and weekly attendance aggregations. |
| `GET` | `/reports/gym-comparison`| `SUPER_ADMIN` | Boys Gym vs Girls Gym usage breakdown. |
| `GET` | `/reports/departments` | `SUPER_ADMIN`, `GYM_MANAGER` | Student registration distribution by branch. |
| `GET` | `/reports/equipment` | `SUPER_ADMIN`, `GYM_MANAGER` | Equipment condition and downtime analytics. |

---

## 10. Notifications & Health Check
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | Retrieve current user's unread notifications. |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark notification as read. |
| `GET` | `/health` | Public | System and database health status. |
