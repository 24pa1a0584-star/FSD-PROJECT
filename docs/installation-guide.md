# VISHNUFIT — Installation & Setup Guide
**Smart Campus Gym Management System | Vishnu Institute of Technology, Bhimavaram**

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Tested on `v24.12.0`)
- **npm**: `v9.0.0` or higher (Tested on `11.6.2`)
- **MongoDB**: MongoDB Community Server 6.0+ (Tested on `v9.0.4`) or MongoDB Atlas Cloud URI
- **Git**: Installed for version control

---

## 2. Quick Start (Windows PowerShell)

### Step 1: Clone Repository
```powershell
git clone https://github.com/YOUR_USERNAME/vishnufit-campus-gym-management.git
cd vishnufit-campus-gym-management
```

### Step 2: Install Dependencies
```powershell
# Install root orchestration, server, and client dependencies
npm run install:all
```

### Step 3: Configure Environment Variables
Copy the example environment files:
```powershell
# In server directory
cp server/.env.example server/.env

# In client directory
cp client/.env.example client/.env
```

#### `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/vishnufit
JWT_SECRET=super_secure_jwt_secret_vishnufit_campus_gym_2025
CLIENT_URL=http://localhost:5173
```

#### `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 4: Seed Database with Demonstration Records
Ensure MongoDB is running locally (`Get-Service MongoDB` on Windows or `net start MongoDB`).
```powershell
npm run seed
```
This initializes:
- Campus settings & Two Gyms (**Vishnu Boys Gym** & **Vishnu Girls Gym**)
- Seeded Accounts:
  - **Super Admin**: `superadmin@vishnu.edu.in` / `SuperAdmin@123`
  - **Boys Gym Manager**: `manager.boys@vishnu.edu.in` / `ManagerBoys@123`
  - **Girls Gym Manager**: `manager.girls@vishnu.edu.in` / `ManagerGirls@123`
  - **Boys Trainer**: `trainer.boys@vishnu.edu.in` / `Trainer@123`
  - **Girls Trainer**: `trainer.girls@vishnu.edu.in` / `Trainer@123`
  - **Students**: Fictional demonstration students (`21PA1A0501`, `22PA1A0512`, `23PA1A0405`, `24PA1A0584`) with password `Student@123`
- Preloaded attendance records, equipment inventory, workout plans, and gym schedules.

### Step 5: Start Development Servers
```powershell
# Starts both Express API (:5000) and Vite Frontend (:5173) concurrently
npm run dev
```

Visit:
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 3. Alternative Linux / macOS / Bash Commands

```bash
# Install dependencies
npm run install:all

# Seed database
npm run seed

# Run concurrent dev server
npm run dev
```

---

## 4. Docker Compose Deployment (Optional)
If Docker is installed:
```bash
docker-compose up -d --build
```
This launches isolated containers for MongoDB, Express Backend, and React Frontend.

---

## 5. Verification & Testing
```powershell
# Run backend tests
npm test --prefix server
```
