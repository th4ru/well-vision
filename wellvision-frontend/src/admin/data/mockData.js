// Mock data for development/testing
export const mockDashboardData = {
  totalCustomers: 1234,
  todayStats: {
    totalSales: 2500,
    totalUnits: 45
  },
  thisMonthStats: {
    totalSales: 75000,
    totalUnits: 1200
  },
  yearlySalesTotal: 850000,
  transactions: [
    {
      _id: "1",
      userId: "user1",
      createdAt: "2024-01-15",
      products: ["product1", "product2"],
      cost: 125.50
    },
    {
      _id: "2", 
      userId: "user2",
      createdAt: "2024-01-14",
      products: ["product3"],
      cost: 89.99
    },
    {
      _id: "3",
      userId: "user3", 
      createdAt: "2024-01-13",
      products: ["product1", "product4", "product5"],
      cost: 234.75
    }
  ]
};

export const mockSalesData = {
  monthlyData: {
    January: { month: "January", totalSales: 65000, totalUnits: 850 },
    February: { month: "February", totalSales: 72000, totalUnits: 920 },
    March: { month: "March", totalSales: 68000, totalUnits: 880 },
    April: { month: "April", totalSales: 75000, totalUnits: 950 },
    May: { month: "May", totalSales: 82000, totalUnits: 1050 },
    June: { month: "June", totalSales: 78000, totalUnits: 1000 },
    July: { month: "July", totalSales: 85000, totalUnits: 1100 },
    August: { month: "August", totalSales: 88000, totalUnits: 1150 },
    September: { month: "September", totalSales: 92000, totalUnits: 1200 },
    October: { month: "October", totalSales: 89000, totalUnits: 1180 },
    November: { month: "November", totalSales: 95000, totalUnits: 1250 },
    December: { month: "December", totalSales: 98000, totalUnits: 1300 }
  },
  salesByCategory: {
    "Electronics": 250000,
    "Clothing": 180000,
    "Home & Garden": 150000,
    "Sports": 120000
  },
  yearlySalesTotal: 850000
};

export const mockUserData = {
  _id: "63701cc1f03239b7f700000e",
  name: "Admin User",
  email: "admin@wellvision.com",
  occupation: "Administrator",
  role: "admin"
};

export const mockProductsData = [
  {
    _id: "63701cc1f03239b7f700001a",
    name: "Eye Examination Kit",
    description: "Complete eye examination kit with advanced diagnostic tools",
    price: 299.99,
    rating: 4.5,
    category: "Medical Equipment",
    supply: 25,
    stat: {
      yearlySalesTotal: 15000,
      yearlyTotalSoldUnits: 50
    }
  },
  {
    _id: "63701cc1f03239b7f700001b", 
    name: "Vision Screening Device",
    description: "Portable vision screening device for quick assessments",
    price: 199.99,
    rating: 4.2,
    category: "Screening Tools",
    supply: 40,
    stat: {
      yearlySalesTotal: 12000,
      yearlyTotalSoldUnits: 60
    }
  },
  {
    _id: "63701cc1f03239b7f700001c",
    name: "Optical Lens Set",
    description: "Professional optical lens set for various prescriptions",
    price: 149.99,
    rating: 4.8,
    category: "Optical Equipment",
    supply: 60,
    stat: {
      yearlySalesTotal: 18000,
      yearlyTotalSoldUnits: 120
    }
  },
  {
    _id: "63701cc1f03239b7f700001d",
    name: "Digital Refractometer",
    description: "High-precision digital refractometer for eye care professionals",
    price: 899.99,
    rating: 4.9,
    category: "Diagnostic Tools",
    supply: 15,
    stat: {
      yearlySalesTotal: 27000,
      yearlyTotalSoldUnits: 30
    }
  }
];

export const mockTransactionsData = {
  transactions: [
    {
      _id: "63701cc1f03239b7f700002a",
      userId: "user1",
      createdAt: "2024-01-15T10:30:00Z",
      products: ["product1", "product2"],
      cost: 125.50
    },
    {
      _id: "63701cc1f03239b7f700002b", 
      userId: "user2",
      createdAt: "2024-01-14T14:20:00Z",
      products: ["product3"],
      cost: 89.99
    },
    {
      _id: "63701cc1f03239b7f700002c",
      userId: "user3", 
      createdAt: "2024-01-13T09:15:00Z",
      products: ["product1", "product4", "product5"],
      cost: 234.75
    }
  ],
  total: 3
};

export const mockCustomersData = [
  {
    _id: "63701cc1f03239b7f700003a",
    name: "John Smith",
    email: "john.smith@email.com",
    phoneNumber: "1234567890",
    country: "United States",
    occupation: "Software Engineer",
    role: "user"
  },
  {
    _id: "63701cc1f03239b7f700003b",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com", 
    phoneNumber: "9876543210",
    country: "Canada",
    occupation: "Marketing Manager",
    role: "user"
  },
  {
    _id: "63701cc1f03239b7f700003c",
    name: "Michael Brown",
    email: "michael.brown@email.com",
    phoneNumber: "5551234567",
    country: "United Kingdom",
    occupation: "Doctor",
    role: "user"
  },
  {
    _id: "63701cc1f03239b7f700003d",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    phoneNumber: "7778889999",
    country: "Australia",
    occupation: "Teacher",
    role: "user"
  },
  {
    _id: "63701cc1f03239b7f700003e",
    name: "David Wilson",
    email: "david.wilson@email.com",
    phoneNumber: "3334445555",
    country: "Germany",
    occupation: "Engineer",
    role: "user"
  }
];

export const mockGeographyData = [
  {
    id: "USA",
    value: 45
  },
  {
    id: "CAN", 
    value: 23
  },
  {
    id: "GBR",
    value: 18
  },
  {
    id: "DEU",
    value: 15
  },
  {
    id: "AUS",
    value: 12
  },
  {
    id: "FRA",
    value: 10
  },
  {
    id: "JPN",
    value: 8
  },
  {
    id: "IND",
    value: 6
  }
];

export const mockPerformanceData = {
  sales: [
    {
      _id: "63701cc1f03239b7f700004a",
      userId: "admin-id-placeholder",
      createdAt: "2024-01-15T10:30:00Z",
      products: ["product1", "product2"],
      cost: 299.99
    },
    {
      _id: "63701cc1f03239b7f700004b",
      userId: "admin-id-placeholder", 
      createdAt: "2024-01-14T14:20:00Z",
      products: ["product3", "product4", "product5"],
      cost: 549.97
    },
    {
      _id: "63701cc1f03239b7f700004c",
      userId: "admin-id-placeholder",
      createdAt: "2024-01-13T09:15:00Z",
      products: ["product1"],
      cost: 149.99
    }
  ],
  totalSales: 999.95,
  totalUnits: 6
};

export const mockAdminsData = [
  {
    _id: "admin-id-placeholder",
    name: "Admin User",
    email: "admin@example.com",
    phoneNumber: "5551234567",
    country: "United States",
    occupation: "Administrator",
    role: "admin"
  },
  {
    _id: "63701cc1f03239b7f700005a",
    name: "Super Admin",
    email: "superadmin@wellvision.com",
    phoneNumber: "5559876543",
    country: "United States", 
    occupation: "System Administrator",
    role: "superadmin"
  },
  {
    _id: "63701cc1f03239b7f700005b",
    name: "Manager Admin",
    email: "manager@wellvision.com",
    phoneNumber: "5555551234",
    country: "Canada",
    occupation: "Operations Manager",
    role: "admin"
  }
];

export const mockStaffData = {
  staff: [
    {
      _id: "63701cc1f03239b7f700006a",
      staffId: "STF0001",
      name: "Alice Johnson",
      email: "alice.johnson@wellvision.com",
      role: "Manager",
      status: "Active",
      phoneNumber: "5551234567",
      department: "Operations",
      hireDate: "2023-01-15T00:00:00Z",
      createdAt: "2023-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    },
    {
      _id: "63701cc1f03239b7f700006b",
      staffId: "STF0002",
      name: "Bob Smith",
      email: "bob.smith@wellvision.com",
      role: "Employee",
      status: "Active",
      phoneNumber: "5559876543",
      department: "Sales",
      hireDate: "2023-03-20T00:00:00Z",
      createdAt: "2023-03-20T14:20:00Z",
      updatedAt: "2024-01-10T14:20:00Z"
    },
    {
      _id: "63701cc1f03239b7f700006c",
      staffId: "STF0003",
      name: "Carol Davis",
      email: "carol.davis@wellvision.com",
      role: "Supervisor",
      status: "Active",
      phoneNumber: "5555551234",
      department: "Customer Service",
      hireDate: "2023-05-10T00:00:00Z",
      createdAt: "2023-05-10T09:15:00Z",
      updatedAt: "2024-01-05T09:15:00Z"
    },
    {
      _id: "63701cc1f03239b7f700006d",
      staffId: "STF0004",
      name: "David Wilson",
      email: "david.wilson@wellvision.com",
      role: "Employee",
      status: "Inactive",
      phoneNumber: "5557778888",
      department: "IT Support",
      hireDate: "2023-07-01T00:00:00Z",
      createdAt: "2023-07-01T11:45:00Z",
      updatedAt: "2023-12-15T11:45:00Z"
    },
    {
      _id: "63701cc1f03239b7f700006e",
      staffId: "STF0005",
      name: "Emma Brown",
      email: "emma.brown@wellvision.com",
      role: "Admin",
      status: "Active",
      phoneNumber: "5553334444",
      department: "Administration",
      hireDate: "2023-02-28T00:00:00Z",
      createdAt: "2023-02-28T16:00:00Z",
      updatedAt: "2024-01-20T16:00:00Z"
    }
  ],
  total: 5
};