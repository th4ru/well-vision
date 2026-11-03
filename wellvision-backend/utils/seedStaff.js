// utils/seedStaff.js
// The dashboard previously displayed staff from a local mock dataset. Those
// records are seeded into MongoDB once so the Staff and Configuration pages
// work against real data.
import Staff from '../models/staffModel.js';
import { DEFAULT_ACCESS_BY_ROLE } from '../config/accessModules.js';

const DEFAULT_STAFF = [
  {
    staffId: 'STF0001',
    name: 'Alice Johnson',
    email: 'alice.johnson@wellvision.com',
    role: 'Manager',
    status: 'Active',
    phoneNumber: '5551234567',
    department: 'Operations',
    hireDate: '2023-01-15T00:00:00Z',
  },
  {
    staffId: 'STF0002',
    name: 'Bob Smith',
    email: 'bob.smith@wellvision.com',
    role: 'Employee',
    status: 'Active',
    phoneNumber: '5559876543',
    department: 'Sales',
    hireDate: '2023-03-20T00:00:00Z',
  },
  {
    staffId: 'STF0003',
    name: 'Carol Davis',
    email: 'carol.davis@wellvision.com',
    role: 'Supervisor',
    status: 'Active',
    phoneNumber: '5555551234',
    department: 'Customer Service',
    hireDate: '2023-05-10T00:00:00Z',
  },
  {
    staffId: 'STF0004',
    name: 'David Wilson',
    email: 'david.wilson@wellvision.com',
    role: 'Employee',
    status: 'Inactive',
    phoneNumber: '5557778888',
    department: 'IT Support',
    hireDate: '2023-07-01T00:00:00Z',
  },
  {
    staffId: 'STF0005',
    name: 'Emma Brown',
    email: 'emma.brown@wellvision.com',
    role: 'Admin',
    status: 'Active',
    phoneNumber: '5553334444',
    department: 'Administration',
    hireDate: '2023-02-28T00:00:00Z',
  },
];

export const seedStaff = async () => {
  const existing = await Staff.countDocuments();
  if (existing > 0) return 0;

  const records = DEFAULT_STAFF.map((member) => ({
    ...member,
    access: DEFAULT_ACCESS_BY_ROLE[member.role] || [],
  }));

  await Staff.insertMany(records);
  console.log(`Seeded ${records.length} staff members`);
  return records.length;
};

export default seedStaff;
