require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Gym = require('../models/Gym');
const User = require('../models/User');
const Student = require('../models/Student');
const GymStaffAssignment = require('../models/GymStaffAssignment');
const GymRegistration = require('../models/GymRegistration');
const MembershipType = require('../models/MembershipType');
const Membership = require('../models/Membership');
const Trainer = require('../models/Trainer');
const TrainerAssignment = require('../models/TrainerAssignment');
const Attendance = require('../models/Attendance');
const WorkoutPlan = require('../models/WorkoutPlan');
const Equipment = require('../models/Equipment');
const EquipmentMaintenance = require('../models/EquipmentMaintenance');
const GymSchedule = require('../models/GymSchedule');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const CampusGymSettings = require('../models/CampusGymSettings');

const seedData = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
      console.error('❌ Safety Guard: Database seeding is blocked in production to prevent accidental data loss.');
      console.error('If you intentionally want to seed a production database, set ALLOW_PRODUCTION_SEED=true.');
      process.exit(1);
    }

    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishnufit';
    const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`[Seed] Connecting to MongoDB: ${maskedUri}`);
    await mongoose.connect(uri);

    console.log('[Seed] Cleaning old records...');
    await Promise.all([
      Gym.deleteMany({}),
      User.deleteMany({}),
      Student.deleteMany({}),
      GymStaffAssignment.deleteMany({}),
      GymRegistration.deleteMany({}),
      MembershipType.deleteMany({}),
      Membership.deleteMany({}),
      Trainer.deleteMany({}),
      TrainerAssignment.deleteMany({}),
      Attendance.deleteMany({}),
      WorkoutPlan.deleteMany({}),
      Equipment.deleteMany({}),
      EquipmentMaintenance.deleteMany({}),
      GymSchedule.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      CampusGymSettings.deleteMany({}),
    ]);

    console.log('[Seed] 1. Initializing Campus Settings & Gym Facilities...');
    await CampusGymSettings.create({
      campusName: 'Vishnu Institute of Technology, Bhimavaram',
      boysGymOpen: true,
      girlsGymOpen: true,
      allowSelfRegistration: true,
      feeManagementEnabled: false,
      qrTokenExpirySeconds: 60,
      defaultMembershipDurationMonths: 6,
      announcementNotice:
        'Welcome to VISHNUFIT! Please keep digital membership card ready and adhere to campus safety guidelines.',
    });

    const boysGym = await Gym.create({
      name: 'Vishnu Boys Gym',
      code: 'BOYS_GYM',
      location: 'Student Activity Complex, Ground Floor, VITB Campus',
      capacity: 120,
      isActive: true,
      operatingHours: { open: '06:00', close: '21:00' },
      contactPhone: '+91 8816 251333',
      contactEmail: 'boysgym@vishnu.edu.in',
      description: 'Fully equipped multi-station strength and athletic conditioning center for male students.',
    });

    const girlsGym = await Gym.create({
      name: 'Vishnu Girls Gym',
      code: 'GIRLS_GYM',
      location: 'Women Amenities Complex, 1st Floor, VITB Campus',
      capacity: 100,
      isActive: true,
      operatingHours: { open: '06:00', close: '21:00' },
      contactPhone: '+91 8816 251334',
      contactEmail: 'girlsgym@vishnu.edu.in',
      description: 'Dedicated modern cardiovascular and functional wellness center for female students.',
    });

    console.log('[Seed] 2. Creating Membership Types...');
    const memTypes = await MembershipType.create([
      {
        name: 'Semester',
        code: 'SEMESTER',
        durationMonths: 6,
        feeAmount: 0,
        description: 'Standard 6-month academic semester gym membership for enrolled students.',
        isActive: true,
      },
      {
        name: 'Academic Year',
        code: 'ANNUAL',
        durationMonths: 12,
        feeAmount: 0,
        description: 'Full 1-year academic term fitness access.',
        isActive: true,
      },
      {
        name: 'Monthly',
        code: 'MONTHLY',
        durationMonths: 1,
        feeAmount: 0,
        description: 'One month temporary trial fitness access.',
        isActive: true,
      },
      {
        name: 'Special Approved Access',
        code: 'SPECIAL',
        durationMonths: 6,
        feeAmount: 0,
        description: 'Designated varsity athletic team access with custom hours.',
        isActive: true,
      },
    ]);
    const semesterType = memTypes.find((t) => t.code === 'SEMESTER');

    console.log('[Seed] 3. Creating Administrative & Staff Users...');
    const salt = await bcrypt.genSalt(10);
    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', salt);
    const managerBoysPassword = await bcrypt.hash('ManagerBoys@123', salt);
    const managerGirlsPassword = await bcrypt.hash('ManagerGirls@123', salt);
    const staffPassword = await bcrypt.hash('Staff@123', salt);
    const trainerPassword = await bcrypt.hash('Trainer@123', salt);
    const studentPassword = await bcrypt.hash('Student@123', salt);

    // Super Admin
    const superAdmin = await User.create({
      name: 'Dr. K. Srinivasa Rao (Director of Physical Education)',
      email: 'superadmin@vishnu.edu.in',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      phone: '+91 9440123456',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    // Boys Gym Manager
    const managerBoys = await User.create({
      name: 'Sri M. Ranga Raju (Boys Gym Incharge)',
      email: 'manager.boys@vishnu.edu.in',
      passwordHash: managerBoysPassword,
      role: 'GYM_MANAGER',
      assignedGym: boysGym._id,
      phone: '+91 9848011223',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    // Girls Gym Manager
    const managerGirls = await User.create({
      name: 'Smt. P. Lakshmi Devi (Girls Gym Incharge)',
      email: 'manager.girls@vishnu.edu.in',
      passwordHash: managerGirlsPassword,
      role: 'GYM_MANAGER',
      assignedGym: girlsGym._id,
      phone: '+91 9848022334',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    // Staff
    const staffBoys = await User.create({
      name: 'V. Naresh (Boys Gym Desk Staff)',
      email: 'staff.boys@vishnu.edu.in',
      passwordHash: staffPassword,
      role: 'GYM_STAFF',
      assignedGym: boysGym._id,
      phone: '+91 9849112233',
    });

    const staffGirls = await User.create({
      name: 'K. Bhavani (Girls Gym Desk Staff)',
      email: 'staff.girls@vishnu.edu.in',
      passwordHash: staffPassword,
      role: 'GYM_STAFF',
      assignedGym: girlsGym._id,
      phone: '+91 9849223344',
    });

    // Staff Assignments
    await GymStaffAssignment.create([
      { userId: managerBoys._id, gymId: boysGym._id, staffRole: 'MANAGER', shift: 'FULL_DAY' },
      { userId: managerGirls._id, gymId: girlsGym._id, staffRole: 'MANAGER', shift: 'FULL_DAY' },
      { userId: staffBoys._id, gymId: boysGym._id, staffRole: 'DESK_STAFF', shift: 'MORNING' },
      { userId: staffGirls._id, gymId: girlsGym._id, staffRole: 'DESK_STAFF', shift: 'MORNING' },
    ]);

    console.log('[Seed] 4. Creating Trainers...');
    const trainerUserBoys = await User.create({
      name: 'Coach Vikram Varma',
      email: 'trainer.boys@vishnu.edu.in',
      passwordHash: trainerPassword,
      role: 'TRAINER',
      assignedGym: boysGym._id,
      phone: '+91 9123456780',
      avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150',
    });

    const trainerBoys = await Trainer.create({
      userId: trainerUserBoys._id,
      gymId: boysGym._id,
      specialization: ['Hypertrophy & Strength', 'Powerlifting', 'Sports Agility'],
      certifications: ['ISSA Certified Fitness Trainer', 'CrossFit Level 1 Coach'],
      experienceYears: 6,
      bio: 'Head Strength Coach with 6 years experience mentoring collegiate athletes at VITB.',
      maxStudents: 30,
      isAvailable: true,
      rating: 4.9,
    });

    const trainerUserGirls = await User.create({
      name: 'Coach Sneha Reddy',
      email: 'trainer.girls@vishnu.edu.in',
      passwordHash: trainerPassword,
      role: 'TRAINER',
      assignedGym: girlsGym._id,
      phone: '+91 9123456781',
      avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150',
    });

    const trainerGirls = await Trainer.create({
      userId: trainerUserGirls._id,
      gymId: girlsGym._id,
      specialization: ['Cardio Endurance', 'Core Conditioning & Pilates', 'HIIT Circuit Training'],
      certifications: ['ACE Certified Personal Trainer', 'Pilates Mat Certification'],
      experienceYears: 5,
      bio: 'Functional fitness specialist helping female students build stamina and functional tone.',
      maxStudents: 25,
      isAvailable: true,
      rating: 4.8,
    });

    console.log('[Seed] 5. Creating Student Profiles & Approved Memberships...');
    const studentSeedData = [
      {
        name: 'Rahul Varma',
        email: 'rahul.varma@vishnu.edu.in',
        rollNumber: '21PA1A0501',
        department: 'CSE',
        academicYear: 4,
        section: 'A',
        contactNumber: '+91 9988776655',
        studentType: 'Hosteller',
        gym: boysGym,
        trainer: trainerBoys,
        status: 'APPROVED',
      },
      {
        name: 'Sai Teja Mandava',
        email: 'sai.teja@vishnu.edu.in',
        rollNumber: '22PA1A0512',
        department: 'ECE',
        academicYear: 3,
        section: 'B',
        contactNumber: '+91 9876543210',
        studentType: 'Day Scholar',
        gym: boysGym,
        trainer: trainerBoys,
        status: 'APPROVED',
      },
      {
        name: 'Karthik Raju',
        email: 'karthik.raju@vishnu.edu.in',
        rollNumber: '23PA1A0545',
        department: 'IT',
        academicYear: 2,
        section: 'A',
        contactNumber: '+91 9765432109',
        studentType: 'Hosteller',
        gym: boysGym,
        trainer: null,
        status: 'APPROVED',
      },
      {
        name: 'Harshitha Rao',
        email: 'harshitha.rao@vishnu.edu.in',
        rollNumber: '23PA1A0405',
        department: 'IT',
        academicYear: 2,
        section: 'B',
        contactNumber: '+91 9654321098',
        studentType: 'Hosteller',
        gym: girlsGym,
        trainer: trainerGirls,
        status: 'APPROVED',
      },
      {
        name: 'Ananya Reddy',
        email: 'ananya.reddy@vishnu.edu.in',
        rollNumber: '24PA1A0584',
        department: 'CSE',
        academicYear: 1,
        section: 'C',
        contactNumber: '+91 9543210987',
        studentType: 'Day Scholar',
        gym: girlsGym,
        trainer: trainerGirls,
        status: 'APPROVED',
      },
      {
        name: 'Pooja Sri',
        email: 'pooja.sri@vishnu.edu.in',
        rollNumber: '22PA1A0210',
        department: 'EEE',
        academicYear: 3,
        section: 'A',
        contactNumber: '+91 9432109876',
        studentType: 'Hosteller',
        gym: girlsGym,
        trainer: null,
        status: 'APPROVED',
      },
      // Pending requests for testing approval workflow
      {
        name: 'Dinesh Kumar',
        email: 'dinesh.kumar@vishnu.edu.in',
        rollNumber: '23PA1A0599',
        department: 'MECH',
        academicYear: 2,
        section: 'A',
        contactNumber: '+91 9321098765',
        studentType: 'Hosteller',
        gym: boysGym,
        trainer: null,
        status: 'PENDING',
      },
      {
        name: 'Sneha Priya',
        email: 'sneha.priya@vishnu.edu.in',
        rollNumber: '24PA1A0410',
        department: 'ECE',
        academicYear: 1,
        section: 'B',
        contactNumber: '+91 9210987654',
        studentType: 'Day Scholar',
        gym: girlsGym,
        trainer: null,
        status: 'PENDING',
      },
    ];

    const createdStudents = [];

    for (const item of studentSeedData) {
      const u = await User.create({
        name: item.name,
        email: item.email,
        passwordHash: studentPassword,
        role: 'STUDENT',
        assignedGym: item.gym._id,
        phone: item.contactNumber,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`,
      });

      const s = await Student.create({
        userId: u._id,
        rollNumber: item.rollNumber,
        department: item.department,
        academicYear: item.academicYear,
        section: item.section,
        contactNumber: item.contactNumber,
        studentType: item.studentType,
        assignedGym: item.gym._id,
        membershipStatus: item.status === 'APPROVED' ? 'ACTIVE' : 'PENDING',
        profilePhoto: u.avatar,
      });

      createdStudents.push({ ...item, userDoc: u, studentDoc: s });

      // Create Registration Application
      const reg = await GymRegistration.create({
        studentId: s._id,
        gymId: item.gym._id,
        status: item.status,
        preferredSlot: 'MORNING (6 AM - 8 AM)',
        fitnessGoals: 'General Fitness & Athletic Stamina',
        reviewedBy: item.status === 'APPROVED' ? (item.gym.code === 'BOYS_GYM' ? managerBoys._id : managerGirls._id) : null,
        reviewedAt: item.status === 'APPROVED' ? new Date() : null,
        remarks: item.status === 'APPROVED' ? 'Approved upon identity verification.' : '',
        studentSnapshot: {
          name: u.name,
          rollNumber: s.rollNumber,
          department: s.department,
          academicYear: s.academicYear,
          studentType: s.studentType,
          contactNumber: s.contactNumber,
        },
      });

      // If approved, create active Membership
      if (item.status === 'APPROVED') {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 6);

        await Membership.create({
          studentId: s._id,
          gymId: item.gym._id,
          membershipTypeId: semesterType._id,
          startDate,
          endDate,
          status: 'ACTIVE',
          approvedBy: item.gym.code === 'BOYS_GYM' ? managerBoys._id : managerGirls._id,
          qrCardId: `VITB-GYM-${s.rollNumber}-2025`,
        });

        // Assign Trainer if specified
        if (item.trainer) {
          await TrainerAssignment.create({
            trainerId: item.trainer._id,
            studentId: s._id,
            gymId: item.gym._id,
            assignedBy: item.gym.code === 'BOYS_GYM' ? managerBoys._id : managerGirls._id,
          });
        }
      }
    }

    console.log('[Seed] 6. Creating Equipment Inventory...');
    const boysEquipment = [
      {
        name: 'Olympic Flat Bench Press Set',
        code: 'BG-STR-001',
        gymId: boysGym._id,
        category: 'FREE_WEIGHTS',
        quantity: 4,
        availableQuantity: 4,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
      },
      {
        name: 'Commercial Motorized Treadmill (Precor)',
        code: 'BG-CAR-002',
        gymId: boysGym._id,
        category: 'CARDIO',
        quantity: 6,
        availableQuantity: 5,
        condition: 'GOOD',
        status: 'AVAILABLE',
      },
      {
        name: 'Dual Cable Functional Cross Machine',
        code: 'BG-STR-003',
        gymId: boysGym._id,
        category: 'STRENGTH',
        quantity: 2,
        availableQuantity: 1,
        condition: 'FAIR',
        status: 'UNDER_MAINTENANCE',
        notes: 'Right pulley cable tension adjustment scheduled.',
      },
      {
        name: 'Heavy Duty Power Squat Cage',
        code: 'BG-STR-004',
        gymId: boysGym._id,
        category: 'STRENGTH',
        quantity: 3,
        availableQuantity: 3,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
      },
      {
        name: 'Rubber Hex Dumbbell Rack (2.5kg - 35kg)',
        code: 'BG-ACC-005',
        gymId: boysGym._id,
        category: 'FREE_WEIGHTS',
        quantity: 2,
        availableQuantity: 2,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
      },
    ];

    const girlsEquipment = [
      {
        name: 'Commercial Elliptical Cross Trainer',
        code: 'GG-CAR-001',
        gymId: girlsGym._id,
        category: 'CARDIO',
        quantity: 6,
        availableQuantity: 6,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
      },
      {
        name: 'Spin Exercise Bikes (StairMaster)',
        code: 'GG-CAR-002',
        gymId: girlsGym._id,
        category: 'CARDIO',
        quantity: 8,
        availableQuantity: 8,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
      },
      {
        name: 'Multi-Station Lat Pulldown & Seated Row',
        code: 'GG-STR-003',
        gymId: girlsGym._id,
        category: 'STRENGTH',
        quantity: 3,
        availableQuantity: 3,
        condition: 'GOOD',
        status: 'AVAILABLE',
      },
      {
        name: 'Neoprene Light Dumbbell Rack (1kg - 15kg)',
        code: 'GG-ACC-004',
        gymId: girlsGym._id,
        category: 'ACCESSORIES',
        quantity: 2,
        availableQuantity: 2,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
      },
      {
        name: 'Leg Extension & Curl Dual Machine',
        code: 'GG-STR-005',
        gymId: girlsGym._id,
        category: 'STRENGTH',
        quantity: 2,
        availableQuantity: 1,
        condition: 'FAIR',
        status: 'UNDER_MAINTENANCE',
        notes: 'Hydraulic pin replacement ordered.',
      },
    ];

    const allEquip = await Equipment.create([...boysEquipment, ...girlsEquipment]);

    // Create Maintenance Log
    const underMaintenanceItem = allEquip.find((e) => e.status === 'UNDER_MAINTENANCE');
    if (underMaintenanceItem) {
      await EquipmentMaintenance.create({
        equipmentId: underMaintenanceItem._id,
        gymId: underMaintenanceItem.gymId,
        reportedBy: managerBoys._id,
        issueDescription: 'Cable wear on right pulley stack. Preventive maintenance underway.',
        status: 'IN_PROGRESS',
        cost: 1500,
      });
    }

    console.log('[Seed] 7. Creating Workout Plans...');
    const rahul = createdStudents.find((s) => s.rollNumber === '21PA1A0501');
    const ananya = createdStudents.find((s) => s.rollNumber === '24PA1A0584');

    if (rahul) {
      await WorkoutPlan.create({
        title: 'Varsity Strength & Athletic Hypertrophy',
        studentId: rahul.studentDoc._id,
        trainerId: trainerBoys._id,
        gymId: boysGym._id,
        level: 'INTERMEDIATE',
        description: 'Comprehensive 4-day athletic strength split for collegiate students.',
        weeklySchedule: [
          {
            day: 'Monday',
            focusArea: 'Chest & Triceps Power',
            isRestDay: false,
            exercises: [
              { name: 'Barbell Flat Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
              { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 60 },
              { name: 'Cable Tricep Pushdowns', sets: 3, reps: '12-15', restSeconds: 45 },
            ],
          },
          {
            day: 'Tuesday',
            focusArea: 'Back & Biceps Thickness',
            isRestDay: false,
            exercises: [
              { name: 'Lat Pulldowns (Wide Grip)', sets: 4, reps: '10-12', restSeconds: 60 },
              { name: 'Seated Cable Row', sets: 3, reps: '12', restSeconds: 60 },
              { name: 'Standing Barbell Curls', sets: 3, reps: '10', restSeconds: 45 },
            ],
          },
          { day: 'Wednesday', focusArea: 'Active Rest / Mobility', isRestDay: true, exercises: [] },
          {
            day: 'Thursday',
            focusArea: 'Legs & Core Conditioning',
            isRestDay: false,
            exercises: [
              { name: 'Barbell Back Squats', sets: 4, reps: '8-10', restSeconds: 120 },
              { name: 'Leg Press', sets: 3, reps: '12', restSeconds: 90 },
              { name: 'Hanging Leg Raises', sets: 3, reps: '15', restSeconds: 45 },
            ],
          },
          {
            day: 'Friday',
            focusArea: 'Shoulders & Traps',
            isRestDay: false,
            exercises: [
              { name: 'Dumbbell Overhead Shoulder Press', sets: 4, reps: '10', restSeconds: 60 },
              { name: 'Dumbbell Lateral Raises', sets: 4, reps: '15', restSeconds: 45 },
            ],
          },
        ],
        isActive: true,
      });
    }

    if (ananya) {
      await WorkoutPlan.create({
        title: 'Functional Stamina & Core Tone',
        studentId: ananya.studentDoc._id,
        trainerId: trainerGirls._id,
        gymId: girlsGym._id,
        level: 'BEGINNER',
        description: 'Cardiovascular wellness and full body postural conditioning.',
        weeklySchedule: [
          {
            day: 'Monday',
            focusArea: 'Cardio Intervals & Full Body',
            isRestDay: false,
            exercises: [
              { name: 'Treadmill Incline Walk', durationMin: 20, restSeconds: 60 },
              { name: 'Bodyweight Goblet Squats', sets: 3, reps: '15', restSeconds: 45 },
              { name: 'Dumbbell Chest Press', sets: 3, reps: '12', restSeconds: 45 },
            ],
          },
          {
            day: 'Wednesday',
            focusArea: 'Core & Glutes Conditioning',
            isRestDay: false,
            exercises: [
              { name: 'Elliptical Cross Trainer', durationMin: 15, restSeconds: 60 },
              { name: 'Glute Bridges', sets: 3, reps: '20', restSeconds: 45 },
              { name: 'Forearm Plank Holds', sets: 3, reps: '45 sec', restSeconds: 60 },
            ],
          },
          {
            day: 'Friday',
            focusArea: 'Full Body HIIT Circuit',
            isRestDay: false,
            exercises: [
              { name: 'Stationary Cycling', durationMin: 15, restSeconds: 60 },
              { name: 'Kettlebell Deadlifts', sets: 3, reps: '12', restSeconds: 45 },
            ],
          },
        ],
        isActive: true,
      });
    }

    console.log('[Seed] 8. Creating Historical & Today Attendance Records...');
    const approvedBoys = createdStudents.filter((s) => s.gym.code === 'BOYS_GYM' && s.status === 'APPROVED');
    const approvedGirls = createdStudents.filter((s) => s.gym.code === 'GIRLS_GYM' && s.status === 'APPROVED');

    // Create 30 days of historical logs for monthly charts
    const historicalLogs = [];
    for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - dayOffset);
      pastDate.setHours(7, 30, 0, 0);

      // Boys gym attendance
      approvedBoys.forEach((b, idx) => {
        if ((dayOffset + idx) % 2 === 0) {
          const checkIn = new Date(pastDate);
          checkIn.setMinutes(checkIn.getMinutes() + idx * 10);
          const checkOut = new Date(checkIn);
          checkOut.setMinutes(checkOut.getMinutes() + 55);

          historicalLogs.push({
            studentId: b.studentDoc._id,
            gymId: boysGym._id,
            checkInTime: checkIn,
            checkOutTime: checkOut,
            durationMinutes: 55,
            status: 'COMPLETED',
            method: idx % 2 === 0 ? 'QR_SCAN' : 'MANUAL',
            recordedBy: staffBoys._id,
          });
        }
      });

      // Girls gym attendance
      approvedGirls.forEach((g, idx) => {
        if ((dayOffset + idx) % 3 !== 0) {
          const checkIn = new Date(pastDate);
          checkIn.setHours(17, 15 + idx * 15, 0);
          const checkOut = new Date(checkIn);
          checkOut.setMinutes(checkOut.getMinutes() + 45);

          historicalLogs.push({
            studentId: g.studentDoc._id,
            gymId: girlsGym._id,
            checkInTime: checkIn,
            checkOutTime: checkOut,
            durationMinutes: 45,
            status: 'COMPLETED',
            method: 'QR_SCAN',
            recordedBy: staffGirls._id,
          });
        }
      });
    }

    // Today's Check-ins (Some COMPLETED, Some Currently ACTIVE)
    const now = new Date();
    const todayMorning = new Date();
    todayMorning.setHours(6, 45, 0, 0);

    // Completed today
    if (approvedBoys[0]) {
      const outTime = new Date(todayMorning);
      outTime.setMinutes(outTime.getMinutes() + 60);
      historicalLogs.push({
        studentId: approvedBoys[0].studentDoc._id,
        gymId: boysGym._id,
        checkInTime: todayMorning,
        checkOutTime: outTime,
        durationMinutes: 60,
        status: 'COMPLETED',
        method: 'QR_SCAN',
        recordedBy: staffBoys._id,
      });
    }

    // Currently ACTIVE right now (Inside Gym)
    if (approvedBoys[1]) {
      const activeCheckIn = new Date();
      activeCheckIn.setMinutes(activeCheckIn.getMinutes() - 35);
      historicalLogs.push({
        studentId: approvedBoys[1].studentDoc._id,
        gymId: boysGym._id,
        checkInTime: activeCheckIn,
        status: 'ACTIVE',
        method: 'QR_SCAN',
        recordedBy: staffBoys._id,
      });
    }

    if (approvedGirls[0]) {
      const activeCheckIn = new Date();
      activeCheckIn.setMinutes(activeCheckIn.getMinutes() - 25);
      historicalLogs.push({
        studentId: approvedGirls[0].studentDoc._id,
        gymId: girlsGym._id,
        checkInTime: activeCheckIn,
        status: 'ACTIVE',
        method: 'QR_SCAN',
        recordedBy: staffGirls._id,
      });
    }

    await Attendance.insertMany(historicalLogs);

    console.log('[Seed] 9. Creating Gym Operating Schedules...');
    const days = [
      { num: 0, name: 'Sunday', closed: true },
      { num: 1, name: 'Monday', closed: false },
      { num: 2, name: 'Tuesday', closed: false },
      { num: 3, name: 'Wednesday', closed: false },
      { num: 4, name: 'Thursday', closed: false },
      { num: 5, name: 'Friday', closed: false },
      { num: 6, name: 'Saturday', closed: false },
    ];

    const schedules = [];
    [boysGym, girlsGym].forEach((g) => {
      days.forEach((d) => {
        schedules.push({
          gymId: g._id,
          dayOfWeek: d.num,
          dayName: d.name,
          morningSlot: { openTime: '06:00', closeTime: '09:00', isActive: !d.closed },
          eveningSlot: { openTime: '16:30', closeTime: '20:30', isActive: !d.closed },
          isClosed: d.closed,
          specialNotes: d.closed ? 'Weekly sanitation & deep maintenance day.' : 'Regular academic training hours.',
        });
      });
    });
    await GymSchedule.insertMany(schedules);

    console.log('[Seed] 10. Creating Campus Announcements & Notifications...');
    await Announcement.create([
      {
        title: 'Orientation on Physical Fitness & Conditioning',
        content:
          'Special posture & functional conditioning workshop scheduled for first-year students on Saturday at 10 AM.',
        targetAudience: 'ALL',
        priority: 'HIGH',
        createdBy: superAdmin._id,
      },
      {
        title: 'Boys Gym: Annual Inter-Branch Bench Press Tournament',
        content:
          'Registration opens this Friday for the Vishnu Collegiate Powerlifting Meet. Contact Coach Vikram for weight categories.',
        targetAudience: 'BOYS_GYM',
        gymId: boysGym._id,
        priority: 'NORMAL',
        createdBy: managerBoys._id,
      },
      {
        title: 'Girls Gym: New Aerobics & Circuit Timing',
        content:
          'Evening aerobic circuit slots are now expanded to 5:00 PM - 6:30 PM with Coach Sneha.',
        targetAudience: 'GIRLS_GYM',
        gymId: girlsGym._id,
        priority: 'NORMAL',
        createdBy: managerGirls._id,
      },
    ]);

    // Notifications
    if (rahul) {
      await Notification.create({
        recipientId: rahul.userDoc._id,
        gymId: boysGym._id,
        title: 'Membership Active',
        message: 'Your Vishnu Boys Gym membership is verified and active for the semester.',
        type: 'MEMBERSHIP',
        isRead: false,
      });
    }

    console.log('=======================================================');
    console.log('✅ VISHNUFIT DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=======================================================');
    console.log('🔑 Demonstration User Credentials:');
    console.log('1. Super Admin:       superadmin@vishnu.edu.in    / SuperAdmin@123');
    console.log('2. Boys Gym Manager:  manager.boys@vishnu.edu.in  / ManagerBoys@123');
    console.log('3. Girls Gym Manager: manager.girls@vishnu.edu.in / ManagerGirls@123');
    console.log('4. Boys Gym Staff:    staff.boys@vishnu.edu.in    / Staff@123');
    console.log('5. Girls Gym Staff:   staff.girls@vishnu.edu.in   / Staff@123');
    console.log('6. Boys Trainer:      trainer.boys@vishnu.edu.in  / Trainer@123');
    console.log('7. Girls Trainer:     trainer.girls@vishnu.edu.in / Trainer@123');
    console.log('8. Student (Boys):    rahul.varma@vishnu.edu.in   / Student@123  (21PA1A0501)');
    console.log('9. Student (Girls):   ananya.reddy@vishnu.edu.in  / Student@123  (24PA1A0584)');
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error occurred: ${error.message}`, error);
    process.exit(1);
  }
};

seedData();
