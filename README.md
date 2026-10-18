# VISHNUFIT — Smart Campus Gym Management System
### *Enterprise Multi-Facility Fitness Platform for Vishnu Institute of Technology, Bhimavaram*

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-10B981?style=for-the-badge&logo=mongodb&logoColor=white)](https://github.com/YOUR_USERNAME/vishnufit-campus-gym-management)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%207.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Server-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React + Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🏛️ Project Overview

**VISHNUFIT** is a full-stack, enterprise-grade campus gym management system engineered for **Vishnu Institute of Technology (VITB), Bhimavaram, Andhra Pradesh, India**. 

The platform addresses a fundamental collegiate campus requirement: managing two distinct physical fitness centers—**Vishnu Boys Gym** and **Vishnu Girls Gym**—under unified campus governance with shared database infrastructure, while enforcing strict backend logical isolation of operational records, check-ins, inventory, and staff permissions.

Designed according to Clean Architecture and Senior Full-Stack Engineering principles, **VISHNUFIT** eliminates manual ledger books, static unauthenticated spreadsheets, and credential sharing with an automated, real-time ecosystem featuring dynamic HMAC-signed QR cards, atomic concurrency check-in defenses, MongoDB aggregation analytics, and role-based access control.

---

## 🎯 Campus Problem Statement

Collegiate fitness centers at Vishnu Institute of Technology serve thousands of students daily across hostel and day-scholar demographics. Prior to VISHNUFIT, operations faced critical operational hurdles:
1. **Paper-Based Ledgers**: Slow manual queues at peak morning and evening hours causing congestion at entrance turnstiles.
2. **Dual-Facility Operational Segregation**: Boys Gym and Girls Gym operate under distinct physical staff and trainers. Storing data in separate ad-hoc systems led to fragmented campus reporting, while naive unified databases risked cross-facility data leakage.
3. **Card Sharing & Proxy Check-ins**: Static printed cards or shared QR screenshots enabled unauthorized entry and duplicate attendance entries.
4. **Uncoordinated Equipment Maintenance**: Equipment breakdowns were reported verbally, causing extended downtime on key weight stations and treadmills.
5. **Lack of Executive Analytics**: The Physical Education Directorate lacked real-time visibility into hourly peak loads, gender utilization ratios, and branch-wise engagement.

---

## ✨ Key System Features

### 1. Dual-Facility Multi-Tenant Architecture
- Centralized administration for Campus Super Admin (Physical Education Director).
- Facility-scoped portals for **Vishnu Boys Gym** (Student Activity Complex) and **Vishnu Girls Gym** (Women Amenities Complex).
- Enforced cross-facility boundary checks at the controller and middleware level; Managers cannot inspect or mutate records outside their assigned facility.

### 2. Smart Concurrency & Atomic Attendance
- **Manual Mode**: Instant roll-number lookup with active membership verification and duplicate active session prevention.
- **Dynamic QR Mode**: Generates cryptographically signed, 60-second time-sensitive tokens with nonce and HMAC verification.
- **Smart Tap Toggle**: Scanned once to check in; scanned again upon leaving to calculate workout duration automatically.
- **Atomic Concurrency Defense**: Indexed database constraints and atomic queries guarantee zero simultaneous active sessions per student across distributed scanning terminals.

### 3. Student Registration & Membership Lifecycle
- End-to-end approval pipeline (`PENDING` ➔ `APPROVED` ➔ `ACTIVE` ➔ `EXPIRED` / `SUSPENDED`).
- Issue digital membership cards with unique identifiers (e.g. `VITB-GYM-21PA1A0501-2025`).
- Configurable membership durations (1 Month Trial, 6 Months Semester Pass, 12 Months Annual Pass).

### 4. Interactive Aggregated Dashboards
- **Campus Super Admin Dashboard**: Real-time aggregated metrics powered by MongoDB aggregation pipelines (`$group`, `$match`, `$project`, `$facet`).
- **Interactive Recharts Visualizations**:
  - Monthly campus gym attendance trends.
  - Boys vs Girls Gym comparative utilization.
  - Student registrations categorized by engineering departments (CSE, ECE, IT, AI&DS, EEE, MECH, CIVIL, CSBS).
  - Peak hourly load distribution.
- **Facility Dashboards**: Live occupancy meters showing real-time capacity usage percentage and instant check-in feeds.

### 5. Equipment Asset & Maintenance Management
- Detailed equipment inventory (Cardio, Strength, Free Weights, Accessories).
- Condition meters (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`) and availability counts.
- Maintenance ticket dispatching with cost logging, vendor assignments, and automated status transition to `UNDER_MAINTENANCE`.

### 6. Trainer Rosters & Workout Programming
- Trainer profiles with specializations, certifications, bio, and student load tracking.
- Structured workout plans with day-by-day routines, target muscles, sets, repetitions, and rest intervals.

### 7. Real-Time Engine (Socket.IO)
- Dedicated authenticated rooms (`super_admin`, `gym_{gymId}`, `user_{userId}`).
- Instant push notifications for new registrations, approvals, check-ins, check-outs, and equipment maintenance alerts.
- Automated TanStack Query cache invalidation keeping frontend views synchronized without page reloads.

---

## 🛠️ Mandatory Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router v7, TanStack Query v5, React Hook Form, Zod, Recharts, Lucide React, Sonner, QRCode.react |
| **Backend** | Node.js (v24), Express.js (v4), Socket.IO (v4), bcryptjs, jsonwebtoken, cookie-parser, express-rate-limit, Helmet, CORS, Morgan |
| **Database** | MongoDB 7.0+ (Mongoose ODM v8) — *No SQL, No Prisma* |
| **Testing** | Vitest 2.1, Supertest 7.0 |
| **DevOps** | Docker, Docker Compose, Git, Postman Collection |

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    subgraph Client Layer [Modern React 18 + Vite]
        SA[Super Admin Portal]
        BM[Boys Gym Manager Portal]
        GM[Girls Gym Manager Portal]
        TR[Trainer / Coach Portal]
        ST[Student Self-Service Portal]
    end

    subgraph Security & API Gateway [Node.js + Express]
        HELMET[Helmet Security & CORS]
        AUTH[HttpOnly Cookie + JWT Auth]
        RBAC[Gym-Scoped RBAC Middleware]
        RATE[Rate Limiting & Input Sanitization]
        SOCKET[Socket.IO Real-Time Dispatcher]
    end

    subgraph Business Services Layer
        RegSvc[Registration & Verification]
        AttSvc[Atomic Attendance & QR Engine]
        MemSvc[Membership Lifecycle Engine]
        EquipSvc[Equipment & Maintenance Tracker]
        WorkSvc[Workout & Trainer Scheduling]
        AggrSvc[Campus Aggregation Pipelines]
    end

    subgraph Persistence Layer [MongoDB with Mongoose]
        GymCol[(gyms)]
        UserCol[(users)]
        StudentCol[(students)]
        RegCol[(gymRegistrations)]
        MemCol[(memberships)]
        AttCol[(attendance)]
        EquipCol[(equipment)]
        WorkCol[(workoutPlans)]
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
    AggrSvc --> StudentCol

    AttSvc -.-> SOCKET
    RegSvc -.-> SOCKET
```

---

## 📁 Repository Directory Structure

```text
vishnufit-campus-gym-management/
├── README.md                           # Master Project Documentation
├── LICENSE                             # MIT Open Source License
├── .gitignore                          # Git Exclusions
├── package.json                        # Monorepo Orchestration Scripts
├── docker-compose.yml                  # Multi-container Deployment Specification
│
├── client/                             # React + Vite Frontend Application
│   ├── package.json                    # Frontend Dependencies
│   ├── vite.config.js                  # Vite Build Configuration
│   ├── tailwind.config.js              # Theme Tokens & Palette Configuration
│   ├── postcss.config.js               # PostCSS Plugins
│   ├── index.html                      # HTML5 Entry Point with SEO Meta Tags
│   ├── .env.example                    # Client Environment Sample
│   └── src/
│       ├── main.jsx                    # React Mount Point
│       ├── App.jsx                     # Providers & Routing Entry
│       ├── context/                    # React Contexts (Auth, Theme, Socket)
│       ├── services/                   # Axios API & Socket.IO Clients
│       ├── components/
│       │   ├── Layout/                 # Navbar, Sidebar, AppLayout
│       │   └── Common/                 # StatCard, Badge, Modal, DataTable, etc.
│       ├── pages/                      # 19 Fully Integrated Application Pages
│       ├── routes/                     # Role-Based Route Definitions
│       └── styles/                     # Tailwind CSS & Glassmorphism Rules
│
├── server/                             # Node.js + Express Backend Service
│   ├── package.json                    # Backend Dependencies
│   ├── Dockerfile                      # Production Containerization Spec
│   ├── vitest.config.js                # Vitest Test Runner Config
│   ├── .env.example                    # Backend Environment Sample
│   ├── src/
│   │   ├── server.js                   # HTTP & Socket.IO Bootstrapper
│   │   ├── app.js                      # Express App Configuration & Route Mounts
│   │   ├── config/                     # Mongoose MongoDB Connection
│   │   ├── models/                     # 17 Mongoose Models & Schemas
│   │   ├── controllers/                # Business Logic Controllers
│   │   ├── middleware/                 # Auth, Gym Scope, Rate Limiter, Errors
│   │   ├── routes/                     # RESTful Route Modules
│   │   ├── validators/                 # Zod Request Validation Schemas
│   │   ├── sockets/                    # Socket.IO Event Rooms Handler
│   │   ├── seed/                       # Demonstration Database Seed Script
│   │   └── utils/                      # Cryptographic & QR Token Utilities
│   └── tests/                          # Automated Integration Test Suites
│
└── docs/                               # Comprehensive Technical Documentation
    ├── architecture.md                 # Deep Architectural Specification
    ├── mongodb-schema.md               # MongoDB Schema, Indexes & Mermaid ERD
    ├── api-documentation.md            # Detailed REST API Reference
    ├── installation-guide.md           # Step-by-Step Execution Guide
    └── VISHNUFIT.postman_collection.json # Ready-to-Import Postman API Collection
```

---

## 🔑 Pre-Seeded Demonstration Credentials

Run `npm run seed` to load fictional demonstration data into MongoDB. You can use these credentials directly or select them via the **1-Click Demo Selector** on the Login page:

| Role | Email | Password | Assigned Scope | Roll Number |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@vishnu.edu.in` | `SuperAdmin@123` | Campus-Wide (Both Gyms) | — |
| **Boys Gym Manager** | `manager.boys@vishnu.edu.in` | `ManagerBoys@123` | Vishnu Boys Gym | — |
| **Girls Gym Manager** | `manager.girls@vishnu.edu.in` | `ManagerGirls@123` | Vishnu Girls Gym | — |
| **Boys Gym Staff** | `staff.boys@vishnu.edu.in` | `Staff@123` | Vishnu Boys Gym | — |
| **Girls Gym Staff** | `staff.girls@vishnu.edu.in` | `Staff@123` | Vishnu Girls Gym | — |
| **Boys Coach** | `trainer.boys@vishnu.edu.in` | `Trainer@123` | Vishnu Boys Gym | — |
| **Girls Coach** | `trainer.girls@vishnu.edu.in` | `Trainer@123` | Vishnu Girls Gym | — |
| **Student (Male)** | `rahul.varma@vishnu.edu.in` | `Student@123` | Vishnu Boys Gym | `21PA1A0501` |
| **Student (Female)** | `ananya.reddy@vishnu.edu.in` | `Student@123` | Vishnu Girls Gym | `24PA1A0584` |

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Tested on `v24.12.0`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Community Server running locally on port `27017` or a MongoDB Atlas connection string.

### 1. Clone & Install Dependencies
Open **Windows PowerShell** or terminal:
```powershell
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vishnufit-campus-gym-management.git
cd vishnufit-campus-gym-management

# Install root, backend, and frontend dependencies in one step
npm run install:all
```

### 2. Configure Environment Variables
Copy the environment examples:
```powershell
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

Default settings in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/vishnufit
JWT_SECRET=super_secure_jwt_secret_vishnufit_campus_gym_2025_vitb_bhimavaram
CLIENT_URL=http://localhost:5173
QR_SECRET=vishnufit_smart_qr_campus_token_secret_vitb
```

### 3. Seed MongoDB with Demonstration Records
Ensure MongoDB is running locally (`Get-Service MongoDB` on Windows or `net start MongoDB`):
```powershell
npm run seed
```

### 4. Start the Application
Run both backend and frontend concurrently:
```powershell
npm run dev
```

Application endpoints:
- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **System Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing

All test suites verify real MongoDB interactions, role permissions, and atomic attendance concurrency:
```powershell
# Run backend tests
npm test
```

Test coverage includes:
- Authentication, invalid credential rejection, and HttpOnly JWT issuance.
- Role-based authorization & gym-scoped boundary defense (Boys Manager rejected on Girls Gym resources).
- Cross-facility check-in prevention.
- Atomic duplicate active check-in rejection (`409 Conflict`).
- Check-out duration computation in minutes.

---

## 🌐 Complete Free Cloud Deployment Guide (ONE Render Web Service + ONE MongoDB Atlas)

You can deploy the complete **VISHNUFIT** system online **100% free** using **one single Render Web Service** and **one MongoDB Atlas free database**. In this production setup, Express serves the compiled React application, all `/api` endpoints, and Socket.IO real-time WebSockets from the exact same URL: `https://your-app-name.onrender.com`.

---

### Step 1: Set Up Free MongoDB Atlas Database

1. **Sign Up / Log In**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. **Create a Free Cluster**:
   - Click **Create Deployment** or **Build a Database**.
   - Select the **M0 Free** tier (Free forever, 512 MB storage).
   - Choose a cloud provider and region close to you (e.g., **AWS / Mumbai (`ap-south-1`)** or Singapore).
   - Cluster Name: `Cluster0` (or leave default).
   - Click **Create Deployment**.
3. **Create Database User Credentials**:
   - In the **Security Quickstart** popup (or under **Security** ➔ **Database Access**):
     - **Authentication Method**: Password.
     - **Username**: e.g., `vishnu_admin`
     - **Password**: Click **Autogenerate Secure Password** or enter your own (e.g., `VishnuFit2025Secure`).
     - **Important**: Copy down this password! You will need it in your connection string.
     - Click **Create Database User**.
4. **Configure Network Access (Allow Render to Connect)**:
   - In the left sidebar, click **Network Access** under **Security**.
   - Click **+ Add IP Address**.
   - Click **Allow Access from Anywhere** (this adds `0.0.0.0/0`).
   - Click **Confirm**. *(Note: This allows your Render web service's dynamic cloud IP to connect securely with your database username and password).*
5. **Get Your Connection String**:
   - Go to **Database** (or **Clusters**) in the left sidebar.
   - Click the **Connect** button next to your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string under **3. Add your connection string into your application code**. It looks like:
     ```text
     mongodb+srv://vishnu_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.
   - Insert `/vishnufit` right before the `?` so it uses the `vishnufit` database:
     ```text
     mongodb+srv://vishnu_admin:VishnuFit2025Secure@cluster0.abcde.mongodb.net/vishnufit?retryWrites=true&w=majority
     ```

---

### Step 2: Push Your Code to GitHub

1. Open your terminal / PowerShell in `D:\fsd_project\FSD-PROJECT-1`.
2. Check Git status and commit any changes:
   ```powershell
   git add .
   git commit -m "Configure production single-service deployment for Render"
   ```
3. Create a new repository on [GitHub](https://github.com/new) named `vishnufit-campus-gym-management`.
4. Link and push your repository:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/vishnufit-campus-gym-management.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 3: Deploy on Render as ONE Web Service

1. Go to [Render.com](https://render.com/) and sign up or log in with your GitHub account.
2. In the Render Dashboard, click **New +** ➔ **Web Service**.
3. Select **Build and deploy from a Git repository** and click **Next**.
4. Choose your `vishnufit-campus-gym-management` repository.
5. Fill in the exact settings below:

| Setting Field | Exact Value to Enter | Notes |
| :--- | :--- | :--- |
| **Name** | `vishnufit` *(or `vishnufit-vitb`)* | Becomes your link: `https://vishnufit.onrender.com` |
| **Region** | `Singapore` *(or nearest to you)* | Fast latency for India & Asia |
| **Branch** | `main` | Production branch |
| **Root Directory** | *(Leave completely BLANK)* | Render will run from the repository root |
| **Runtime** | `Node` | Native Node.js execution |
| **Build Command** | `npm run build` | Installs server & client packages, compiles Vite SPA |
| **Start Command** | `npm start` | Executes `node server/src/server.js` |
| **Instance Type** | `Free` | Free 512 MB RAM instance |

6. Scroll down to **Environment Variables** and click **Add Environment Variable** for each of these:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production caching, static React serving, secure cookies |
| `MONGODB_URI` | `mongodb+srv://vishnu_admin:YOUR_PASSWORD@cluster0.abcde.mongodb.net/vishnufit?retryWrites=true&w=majority` | Your MongoDB Atlas connection string from Step 1 |
| `JWT_SECRET` | `super_secure_jwt_secret_vishnufit_campus_gym_2025_vitb_bhimavaram` | 32+ character key for secure JWT user sessions |
| `QR_SECRET` | `vishnufit_smart_qr_campus_token_secret_vitb` | HMAC key for 60-second dynamic attendance QR codes |
| `VITE_SHOW_DEMO_CREDS` | `false` | Set to `false` for secure institutional mode, or `true` for demo buttons |

7. Click **Create Web Service**.

---

### Step 4: Verification & Live Link

Render will start building your project:
1. It runs `npm run build` (installs server packages, installs client packages, compiles frontend into `client/dist`).
2. It starts the backend with `npm start` (`node server/src/server.js`).
3. Once the build completes, the status shows **Live** with a green badge!
4. Click your public URL:
   ```text
   https://vishnufit.onrender.com
   ```

**What to verify on your live deployment:**
- **Homepage & SPA**: The VISHNUFIT web application loads with full Vite/Tailwind styling.
- **Direct Navigation & Refresh**: Navigate to `/scanner` or `/student` and refresh the page (press `F5`) — it loads smoothly without 404 errors.
- **Backend Health Check**: Open `https://your-service.onrender.com/api/health` — returns JSON with `"status": "healthy"` and `"database": { "status": "Connected" }`.
- **Authentication**: Log in with your registered account or initial manager account.
- **Real-Time Sync**: Open two browser tabs; actions in one reflect instantly via Socket.IO WebSocket without page reloads.

---

### Step 5: Safe Initial Database Setup & Super Admin Bootstrap (Render Compatible)

When deploying to a fresh MongoDB Atlas database on Render's free tier (where interactive shell access is unavailable), use the **Safe Idempotent Bootstrap Mechanism**.

> [!IMPORTANT]
> Never run destructive seed scripts (`seed.js`) against your live production database. The server automatically initializes the core facilities (`BOYS_GYM`, `GIRLS_GYM`), standard membership plans (`SEMESTER`, `ANNUAL`, `MONTHLY`, `SPECIAL`), and campus operational settings on startup using safe Mongoose `$setOnInsert` operations without deleting or altering existing data.

#### How to Bootstrap Your First Administrator Account on Render:
1. **Go to your Render Dashboard** -> Click your **vishnufit** Web Service -> **Environment**.
2. Add the following environment variables:
   | Key | Example Value | Description |
   |---|---|---|
   | `INITIAL_SETUP_ENABLED` | `true` | Enables one-time administrator creation |
   | `BOOTSTRAP_ADMIN_NAME` | `Super Administrator` | Display name for Super Admin |
   | `BOOTSTRAP_ADMIN_EMAIL` | `superadmin@vishnu.edu.in` | Login email for Super Admin |
   | `BOOTSTRAP_ADMIN_PASSWORD` | `YourStrongAdminPassword@123` | Secure password (min 8 chars) |
   | `BOOTSTRAP_BOYS_MANAGER_EMAIL` | `manager.boys@vishnu.edu.in` | *(Optional)* Boys Gym Manager email |
   | `BOOTSTRAP_BOYS_MANAGER_PASSWORD` | `YourBoysManagerPassword@123` | *(Optional)* Boys Gym Manager password |
   | `BOOTSTRAP_GIRLS_MANAGER_EMAIL` | `manager.girls@vishnu.edu.in` | *(Optional)* Girls Gym Manager email |
   | `BOOTSTRAP_GIRLS_MANAGER_PASSWORD` | `YourGirlsManagerPassword@123` | *(Optional)* Girls Gym Manager password |
3. **Save Changes**: Render will automatically trigger a rolling redeployment.
4. **Log In**: Open `https://vishnufit.onrender.com/login` and log in with your bootstrap administrator credentials.
5. **Disable Bootstrap**: Return to Render **Environment**, set `INITIAL_SETUP_ENABLED` to `false` (or delete the bootstrap password variables), and save. Existing credentials are never overwritten or logged.

---

### Step 6: Running Automated Regression Tests

To run the full suite of 22 backend automated tests covering idempotent initialization, gym facility isolation, dynamic gym registration, server-side approval, and attendance concurrency:
```bash
npm test --prefix server
```

To run only the dedicated Faculty Demonstration suite:
```bash
npx vitest run tests/faculty-demonstration.test.js --dir server
```

---

## 📜 Disclaimer
This software is an independently developed academic full-stack project built for demonstration and evaluation at Vishnu Institute of Technology, Bhimavaram. It does not imply official campus administrative endorsement without explicit departmental authorization.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
