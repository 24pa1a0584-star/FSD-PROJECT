const bcrypt = require('bcryptjs');
const Gym = require('../models/Gym');
const MembershipType = require('../models/MembershipType');
const CampusGymSettings = require('../models/CampusGymSettings');
const User = require('../models/User');
const GymStaffAssignment = require('../models/GymStaffAssignment');

/**
 * Idempotent, safe database initialization for VISHNUFIT.
 *
 * Ensures required facilities (Boys Gym, Girls Gym), membership tiers,
 * and campus settings exist on any empty or existing MongoDB database,
 * WITHOUT ever deleting or modifying user records.
 *
 * Securely bootstraps the initial Super Admin and Facility Managers
 * if INITIAL_SETUP_ENABLED=true in environment variables.
 */
const initDatabase = async () => {
  try {
    // 1. Ensure BOYS_GYM and GIRLS_GYM exist via upsert ($setOnInsert)
    const boysGym = await Gym.findOneAndUpdate(
      { code: 'BOYS_GYM' },
      {
        $setOnInsert: {
          name: 'Vishnu Boys Gym',
          code: 'BOYS_GYM',
          location: 'Student Activity Complex, Ground Floor, VITB Campus',
          capacity: 120,
          isActive: true,
          operatingHours: { open: '06:00', close: '21:00' },
          contactPhone: '+91 8816 251333',
          contactEmail: 'boysgym@vishnu.edu.in',
          description: 'Fully equipped multi-station strength and athletic conditioning center for male students.',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const girlsGym = await Gym.findOneAndUpdate(
      { code: 'GIRLS_GYM' },
      {
        $setOnInsert: {
          name: 'Vishnu Girls Gym',
          code: 'GIRLS_GYM',
          location: 'Women Amenities Complex, 1st Floor, VITB Campus',
          capacity: 100,
          isActive: true,
          operatingHours: { open: '06:00', close: '21:00' },
          contactPhone: '+91 8816 251334',
          contactEmail: 'girlsgym@vishnu.edu.in',
          description: 'Dedicated modern cardiovascular and functional wellness center for female students.',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Ensure standard Membership Types exist via upsert
    const standardMembershipTypes = [
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
    ];

    for (const type of standardMembershipTypes) {
      await MembershipType.findOneAndUpdate(
        { code: type.code },
        { $setOnInsert: type },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    // 3. Ensure CampusGymSettings document exists
    await CampusGymSettings.findOneAndUpdate(
      {},
      {
        $setOnInsert: {
          campusName: 'Vishnu Institute of Technology, Bhimavaram',
          boysGymOpen: true,
          girlsGymOpen: true,
          allowSelfRegistration: true,
          feeManagementEnabled: false,
          qrTokenExpirySeconds: 60,
          defaultMembershipDurationMonths: 6,
          announcementNotice:
            'Welcome to VISHNUFIT! Please keep digital membership card ready and adhere to campus safety guidelines.',
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // 4. Secure One-Time Administrator Bootstrap (Guarded by INITIAL_SETUP_ENABLED)
    const isSetupEnabled = process.env.INITIAL_SETUP_ENABLED === 'true';

    if (isSetupEnabled) {
      console.log('[Bootstrap] INITIAL_SETUP_ENABLED=true. Checking bootstrap credentials...');

      // 4a. Super Admin Bootstrap
      const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
      const adminPassword = (process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim();
      const adminName = (process.env.BOOTSTRAP_ADMIN_NAME || 'Campus Super Administrator').trim();

      if (!adminEmail || !adminPassword) {
        console.warn('[Bootstrap] Notice: BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD not provided.');
      } else if (adminPassword.length < 8) {
        console.error('[Bootstrap] Error: BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters long for production security.');
      } else {
        const existingAdmin = await User.findOne({
          $or: [{ email: adminEmail }, { role: 'SUPER_ADMIN' }],
        });

        if (existingAdmin) {
          console.log(`[Bootstrap] Super Admin already exists (${existingAdmin.email}). Existing administrator preserved.`);
        } else {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(adminPassword, salt);

          await User.create({
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: 'SUPER_ADMIN',
            phone: '+91 8816 251333',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminName)}`,
          });

          console.log(`[Bootstrap] Super Admin account successfully bootstrapped for: ${adminEmail}`);
        }
      }

      // 4b. Optional Boys Gym Manager Bootstrap
      const boysMgrEmail = (process.env.BOOTSTRAP_BOYS_MANAGER_EMAIL || '').trim().toLowerCase();
      const boysMgrPassword = (process.env.BOOTSTRAP_BOYS_MANAGER_PASSWORD || '').trim();
      const boysMgrName = (process.env.BOOTSTRAP_BOYS_MANAGER_NAME || 'Boys Gym Manager').trim();

      if (boysMgrEmail && boysMgrPassword) {
        if (boysMgrPassword.length < 8) {
          console.error('[Bootstrap] Error: BOOTSTRAP_BOYS_MANAGER_PASSWORD must be at least 8 characters.');
        } else {
          const existingBoysMgr = await User.findOne({ email: boysMgrEmail });
          if (existingBoysMgr) {
            console.log(`[Bootstrap] Boys Gym Manager account (${boysMgrEmail}) already exists. Preserved.`);
          } else {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(boysMgrPassword, salt);
            const user = await User.create({
              name: boysMgrName,
              email: boysMgrEmail,
              passwordHash,
              role: 'GYM_MANAGER',
              assignedGym: boysGym._id,
              phone: '+91 8816 251333',
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(boysMgrName)}`,
            });

            await GymStaffAssignment.findOneAndUpdate(
              { userId: user._id, gymId: boysGym._id },
              { $setOnInsert: { staffRole: 'MANAGER', shift: 'FULL_DAY', isActive: true } },
              { upsert: true }
            );

            console.log(`[Bootstrap] Boys Gym Manager account successfully bootstrapped for: ${boysMgrEmail}`);
          }
        }
      }

      // 4c. Optional Girls Gym Manager Bootstrap
      const girlsMgrEmail = (process.env.BOOTSTRAP_GIRLS_MANAGER_EMAIL || '').trim().toLowerCase();
      const girlsMgrPassword = (process.env.BOOTSTRAP_GIRLS_MANAGER_PASSWORD || '').trim();
      const girlsMgrName = (process.env.BOOTSTRAP_GIRLS_MANAGER_NAME || 'Girls Gym Manager').trim();

      if (girlsMgrEmail && girlsMgrPassword) {
        if (girlsMgrPassword.length < 8) {
          console.error('[Bootstrap] Error: BOOTSTRAP_GIRLS_MANAGER_PASSWORD must be at least 8 characters.');
        } else {
          const existingGirlsMgr = await User.findOne({ email: girlsMgrEmail });
          if (existingGirlsMgr) {
            console.log(`[Bootstrap] Girls Gym Manager account (${girlsMgrEmail}) already exists. Preserved.`);
          } else {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(girlsMgrPassword, salt);
            const user = await User.create({
              name: girlsMgrName,
              email: girlsMgrEmail,
              passwordHash,
              role: 'GYM_MANAGER',
              assignedGym: girlsGym._id,
              phone: '+91 8816 251334',
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(girlsMgrName)}`,
            });

            await GymStaffAssignment.findOneAndUpdate(
              { userId: user._id, gymId: girlsGym._id },
              { $setOnInsert: { staffRole: 'MANAGER', shift: 'FULL_DAY', isActive: true } },
              { upsert: true }
            );

            console.log(`[Bootstrap] Girls Gym Manager account successfully bootstrapped for: ${girlsMgrEmail}`);
          }
        }
      }
    }

    return { boysGym, girlsGym };
  } catch (error) {
    console.error(`[initDatabase] Error during idempotent database initialization: ${error.message}`);
    throw error;
  }
};

module.exports = { initDatabase };
