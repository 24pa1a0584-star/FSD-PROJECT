# VISHNUFIT — System Architecture Documentation
**Smart Campus Gym Management System | Vishnu Institute of Technology, Bhimavaram**

---

## 1. Executive Summary
**VISHNUFIT** is an enterprise-grade, centralized gym management platform tailored specifically for collegiate campuses. Built for **Vishnu Institute of Technology (VITB), Bhimavaram, Andhra Pradesh**, the platform solves the critical operational challenge of managing two distinct physical fitness centers:
- **Boys Gym Facility** (Capacity: 120 students/slot)
- **Girls Gym Facility** (Capacity: 100 students/slot)

While both facilities operate under unified campus governance, administrative authority, and shared database infrastructure, their daily operations—access verification, check-in flows, equipment logs, and trainer assignments—are strictly isolated at the database query and authorization middleware layers.

---

## 2. Multi-Tenant / Dual-Facility Architectural Model

```mermaid
graph TD
    subgraph Client Layer [Modern React 18 + Vite Frontend]
        SA[Super Admin Portal]
        BM[Boys Gym Manager Portal]
        GM[Girls Gym Manager Portal]
        TR[Trainer / Staff Portal]
        ST[Student Self-Service Portal]
    end

    subgraph API Gateway & Security Layer [Express.js Backend]
        CORS[CORS & Helmet Security]
        AUTH[JWT HttpOnly Cookie Auth]
        RBAC[Role & Gym-Scoped RBAC Middleware]
        RATE[Rate Limiting & Input Sanitization]
        SOCKET[Socket.IO Real-time Engine]
    end

    subgraph Business Logic Layer [Services & Controllers]
        RegSvc[Registration & Verification Service]
        AttSvc[Atomic Attendance & QR Token Engine]
        MemSvc[Membership Lifecycle Engine]
        EquipSvc[Equipment & Maintenance Tracker]
        WorkSvc[Workout & Trainer Scheduling Engine]
        AggrSvc[Campus Analytics & Aggregation Engine]
    end

    subgraph Persistence Layer [MongoDB 7.0+ with Mongoose ODM]
        GymCol[(gyms)]
        UserCol[(users & students)]
        RegCol[(gymRegistrations)]
        MemCol[(memberships)]
        AttCol[(attendance)]
        EquipCol[(equipment & equipmentMaintenance)]
        WorkCol[(workoutPlans)]
        AuditCol[(auditLogs)]
    end

    SA --> AUTH
    BM --> AUTH
    GM --> AUTH
    TR --> AUTH
    ST --> AUTH

    AUTH --> RBAC
    RBAC --> RegSvc
    RBAC --> AttSvc
    RBAC --> MemSvc
    RBAC --> EquipSvc
    RBAC --> WorkSvc
    RBAC --> AggrSvc

    RegSvc --> RegCol
    AttSvc --> AttCol
    MemSvc --> MemCol
    EquipSvc --> EquipCol
    WorkSvc --> WorkCol
    AggrSvc --> AttCol
    AggrSvc --> UserCol

    AttSvc -.-> SOCKET
    RegSvc -.-> SOCKET
```

### 2.1 Role-Based Access Control (RBAC) Matrix

| User Role | Campus Overview | Assigned Gym Operations | Cross-Gym Access | Student Self-Service | Equipment Maintenance |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SUPER_ADMIN` | Full (All Facilities) | Full | Full Override | Read-Only | Read / Write |
| `GYM_MANAGER` | Scope Locked to Facility | Full (Assigned Gym Only) | Strictly Forbidden | Approvals Only | Full for Assigned Gym |
| `GYM_STAFF` | Facility Operational View | Check-in / Out & Attendance | Strictly Forbidden | No | Report Issues |
| `TRAINER` | Assigned Trainees Only | View Schedules & Trainees | Strictly Forbidden | Workout Assignment | View Only |
| `STUDENT` | No Admin Access | Own Assigned Gym Only | Strictly Forbidden | Self Profile, QR Card, History | View Schedules Only |

---

## 3. Data Isolation Strategy
1. **Gym Document Reference**: All facility-scoped entities (`attendance`, `gymRegistrations`, `memberships`, `equipment`, `trainers`, `schedules`) store an explicit `gymId` foreign key referencing the `Gym` collection.
2. **Backend Enforcement**:
   - The authorization middleware `authorizeGymAccess` extracts the authenticated user's `role` and `assignedGym`.
   - If the user is `SUPER_ADMIN`, access to any gym resource or aggregated data is allowed.
   - If the user is `GYM_MANAGER` or `GYM_STAFF`, the middleware injects or verifies `gymId === req.user.assignedGym`. Any attempt to query or mutate an unauthorized gym ID returns HTTP `403 Forbidden`.
   - Never relies on client-side state, URL query strings, or unverified frontend tabs.

---

## 4. Smart Attendance & Atomic QR Verification Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Staff as Gym Staff / Scanner
    participant Client as Frontend (Vite)
    participant Server as Node.js / Express
    participant DB as MongoDB

    Note over Student, Client: Dynamic QR Generation
    Student->>Client: Open "Digital Gym Card"
    Client->>Server: POST /api/attendance/qr-token (Auth Cookie)
    Server->>Server: Generate HMAC-signed token (Roll No + StudentId + GymId + Nonce + Expiry 60s)
    Server-->>Client: { qrToken, expiresAt }
    Client->>Client: Render dynamic dynamic QR Code (auto-refreshes every 45s)

    Note over Staff, Server: Atomic QR Scan & Check-in / Check-out
    Staff->>Client: Scan Student QR / Roll Number
    Client->>Server: POST /api/attendance/qr-scan { qrToken, gymId }
    Server->>Server: Verify token signature & expiration window
    Server->>Server: Verify Student's Assigned Gym matches Staff Gym
    Server->>DB: Check active attendance session { studentId, status: 'ACTIVE' }
    
    alt Active Session Exists (Check-Out Flow)
        Server->>DB: findOneAndUpdate({ studentId, status: 'ACTIVE' }, { status: 'COMPLETED', checkOutTime: NOW, durationMinutes: calc })
        Server->>Server: Emit Socket.IO 'attendance:checkout'
        Server-->>Client: 200 OK (Checked out successfully with duration)
    else No Active Session (Check-In Flow)
        Server->>DB: Verify active membership { studentId, gymId, status: 'ACTIVE', endDate > NOW }
        Server->>DB: insertOne({ studentId, gymId, checkInTime: NOW, status: 'ACTIVE' })
        Server->>Server: Emit Socket.IO 'attendance:checkin'
        Server-->>Client: 201 Created (Checked in successfully)
    end
```

---

## 5. Real-Time Engine (Socket.IO Architecture)
Real-time events prevent stale concurrent records across staff scanning terminals and campus dashboards.

### Socket.IO Rooms
- `room:super_admin`: Receives live attendance count increments, new registration requests, and high-priority maintenance alerts campus-wide.
- `room:gym_{gymId}`: Receives check-in / check-out updates, pending approvals, and schedule notices specific to Boys Gym or Girls Gym.
- `room:user_{userId}`: Receives personal notifications (e.g., membership approved, trainer workout plan assigned).

### TanStack Query Invalidation
When the client receives a socket event (e.g., `attendance:updated`), TanStack Query automatically invalidates cache keys `['attendance', 'live']` and `['dashboard', gymId]`, triggering seamless, non-blocking UI refetches.

---

## 6. Security & Hardening Measures
- **HttpOnly Cookies**: JWT authentication tokens are signed with high-entropy secrets and transmitted via strict `HttpOnly`, `SameSite=Lax` cookies, neutralizing XSS credential theft.
- **CSRF & CORS Defense**: Server enforces explicit client origin (`http://localhost:5173` or production domain) with credential authorization.
- **Rate Limiting**: `express-rate-limit` prevents brute-force login attempts and attendance flooding.
- **MongoDB NoSQL Injection Protection**: Zod schema validation strips unpermitted operator payloads (`$gt`, `$ne`, etc.) before queries reach Mongoose.
