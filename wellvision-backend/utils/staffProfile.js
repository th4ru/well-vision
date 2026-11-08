// utils/staffProfile.js
// Helpers that keep the admin Staff directory aligned with the real user
// accounts. Staff records live on the user document itself, so there is a
// single source of truth in the database.
import userModel from '../models/userModel.js';
import StaffModel from '../models/staffModel.js';
import { DEFAULT_ACCESS_BY_ROLE, sanitizeAccess } from '../config/accessModules.js';

export const DEFAULT_STAFF_ROLE = 'Employee';
export const STAFF_STATUSES = ['Active', 'Inactive'];

// Emails that belonged to the old demo dataset. They are removed once so the
// Staff page never shows fake employees.
const LEGACY_SEED_EMAILS = [
  'alice.johnson@wellvision.com',
  'bob.smith@wellvision.com',
  'carol.davis@wellvision.com',
  'david.wilson@wellvision.com',
  'emma.brown@wellvision.com',
];

export const defaultAccessForRole = (role) =>
  DEFAULT_ACCESS_BY_ROLE[role] || DEFAULT_ACCESS_BY_ROLE[DEFAULT_STAFF_ROLE];

// Returns the next unused STF#### identifier, looking only at real users.
export const nextStaffId = async () => {
  const existing = await userModel
    .find({ staffId: /^STF\d+$/ })
    .select('staffId')
    .lean();

  const highest = existing.reduce((max, item) => {
    const number = parseInt(String(item.staffId).replace(/\D/g, ''), 10);
    return Number.isFinite(number) && number > max ? number : max;
  }, 0);

  return `STF${String(highest + 1).padStart(4, '0')}`;
};

// Fills in the staff fields for a single user document and saves it when
// anything was missing. Safe to call repeatedly.
export const ensureStaffProfile = async (user) => {
  if (!user) return user;

  const hadStaffId = Boolean(user.staffId);
  let changed = false;

  if (!user.staffId) {
    user.staffId = await nextStaffId();
    changed = true;
  }

  if (!STAFF_STATUSES.includes(user.staffStatus)) {
    user.staffStatus = 'Active';
    changed = true;
  }

  if (user.department === undefined) {
    user.department = '';
    changed = true;
  }

  // Only give default access to accounts that have never had a staff profile.
  // An admin who deliberately removes every permission keeps an empty list.
  if (
    !Array.isArray(user.access) ||
    (user.access.length === 0 && !hadStaffId)
  ) {
    user.access = defaultAccessForRole(user.role);
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  return user;
};

// Assigns staff metadata to every account that predates it (existing users and
// newly registered accounts) so the Staff directory always reflects the users
// collection.
export const ensureStaffProfiles = async () => {
  const users = await userModel.find({});
  for (const user of users) {
    await ensureStaffProfile(user);
  }
};

// Removes the demo employees that the old startup seeder wrote into the unused
// staff collection.
export const removeLegacyStaffSeeds = async () => {
  await StaffModel.deleteMany({ email: { $in: LEGACY_SEED_EMAILS } });
};

export const normalizeAccess = (access, role) => {
  const source = Array.isArray(access) && access.length > 0
    ? access
    : defaultAccessForRole(role);
  return sanitizeAccess(source);
};
