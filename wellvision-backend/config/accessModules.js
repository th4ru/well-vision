// config/accessModules.js
// Single source of truth for the pages/areas an admin can grant to a staff
// member from the Configuration page.

export const ACCESS_MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Overall business statistics and charts',
  },
  {
    key: 'products',
    label: 'Products',
    description: 'View the product catalogue',
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'View the customer directory',
  },
  {
    key: 'transactions',
    label: 'Transactions',
    description: 'View customer transactions',
  },
  {
    key: 'geography',
    label: 'Geography',
    description: 'View the sales geography breakdown',
  },
  {
    key: 'overview',
    label: 'Sales Overview',
    description: 'View the sales overview page',
  },
  {
    key: 'daily',
    label: 'Daily Sales',
    description: 'View daily sales figures',
  },
  {
    key: 'monthly',
    label: 'Monthly Sales',
    description: 'View monthly sales figures',
  },
  {
    key: 'breakdown',
    label: 'Sales Breakdown',
    description: 'View the sales breakdown report',
  },
  {
    key: 'admin',
    label: 'Admin Management',
    description: 'View and create admin accounts',
  },
  {
    key: 'staff',
    label: 'Staff Management',
    description: 'View and manage staff records',
  },
  {
    key: 'performance',
    label: 'Performance',
    description: 'View staff performance metrics',
  },
  {
    key: 'configuration',
    label: 'Configuration',
    description: 'Change staff access permissions',
  },
];

export const ALL_ACCESS_KEYS = ACCESS_MODULES.map((module) => module.key);

// Sensible defaults for a newly created staff member. An admin can change
// these at any time from the Configuration page.
export const DEFAULT_ACCESS_BY_ROLE = {
  Admin: ALL_ACCESS_KEYS,
  Manager: ALL_ACCESS_KEYS.filter(
    (key) => key !== 'admin' && key !== 'configuration'
  ),
  Supervisor: [
    'dashboard',
    'products',
    'customers',
    'transactions',
    'overview',
    'daily',
    'monthly',
    'breakdown',
    'performance',
  ],
  Employee: ['dashboard', 'products', 'customers', 'daily', 'monthly'],
};

export const sanitizeAccess = (access) => {
  if (!Array.isArray(access)) return [];
  return [...new Set(access.filter((key) => ALL_ACCESS_KEYS.includes(key)))];
};
