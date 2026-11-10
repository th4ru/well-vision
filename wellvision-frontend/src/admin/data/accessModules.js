// Access modules shown on the Configuration page. Keep the keys in sync with
// wellvision-backend/config/accessModules.js.
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
