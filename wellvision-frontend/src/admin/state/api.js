import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { mockUserData, mockTransactionsData, mockGeographyData, mockAdminsData } from "../data/mockData";

// Endpoints that are backed by real database data. They must surface errors
// instead of silently falling back to mock data.
const REAL_GET_ENDPOINTS = new Set([
  "general/dashboard",
  "general/me",
  "sales/sales",
  "client/customers",
  "client/products",
  "management/admins",
  "management/performance",
  "staff",
]);

const getEndpoint = (args) => (typeof args === "string" ? args : args.url);

// Custom base query that falls back to mock data for endpoints that are not
// implemented by the backend yet.
const baseQueryWithFallback = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/admin",
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  });

  // Determine HTTP method; default to GET
  const method =
    typeof args === "string"
      ? "GET"
      : (args.method || "GET").toUpperCase();

  try {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error) {
      // Do not fallback for write operations or real endpoints; surface the
      // error to the UI.
      if (method !== "GET" || REAL_GET_ENDPOINTS.has(getEndpoint(args))) return result;

      console.warn(
        `API ${method} ${getEndpoint(args)} failed, using mock data`
      );
      return getMockData(args);
    }

    return result;
  } catch (error) {
    if (method !== "GET" || REAL_GET_ENDPOINTS.has(getEndpoint(args))) throw error;
    console.warn(
      `API ${method} ${getEndpoint(args)} failed, using mock data:`,
      error
    );
    return getMockData(args);
  }
};

// Function to return appropriate mock data based on endpoint
const getMockData = (args) => {
  const endpoint = getEndpoint(args);

  if (endpoint === 'client/geography') {
    return { data: mockGeographyData };
  } else if (endpoint === 'client/transactions') {
    return { data: mockTransactionsData };
  } else if (endpoint === 'management/admins') {
    return { data: mockAdminsData };
  } else if (endpoint && endpoint.startsWith('general/user/')) {
    return { data: mockUserData };
  } else {
    return { data: null };
  }
};

export const api = createApi({
  baseQuery: baseQueryWithFallback,
  reducerPath: "adminApi",
  tagTypes: [
    "User",
    "Products",
    "Customers",
    "Transactions",
    "Geography",
    "Sales",
    "Admins",
    "Staff",
    "Performance",
    "Dashboard",
  ],
  endpoints: (build) => ({
    getUser: build.query({
      query: (id) => `general/user/${id}`,
      providesTags: ["User"],
    }),
    getMe: build.query({
      query: () => "general/me",
      providesTags: ["User"],
    }),
    updateMe: build.mutation({
      query: (profileData) => ({
        url: "general/me",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),
    getProducts: build.query({
      query: () => "client/products",
      providesTags: ["Products"],
    }),
    addProduct: build.mutation({
      query: (productData) => ({
        url: "client/products",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Products"],
    }),
    getCustomers: build.query({
      query: () => "client/customers",
      providesTags: ["Customers"],
    }),
    getTransactions: build.query({
      query: ({ page, pageSize, sort, search }) => ({
        url: "client/transactions",
        method: "GET",
        params: { page, pageSize, sort, search },
      }),
      providesTags: ["Transactions"],
    }),
    getGeography: build.query({
      query: () => "client/geography",
      providesTags: ["Geography"],
    }),
    getSales: build.query({
      query: () => "sales/sales",
      providesTags: ["Sales"],
    }),
    getAdmins: build.query({
      query: () => "management/admins",
      providesTags: ["Admins"],
    }),
    createAdmin: build.mutation({
      query: (adminData) => ({
        url: "management/admins",
        method: "POST",
        body: adminData,
      }),
      invalidatesTags: ["Admins"],
    }),
    getStaff: build.query({
      query: ({ page, pageSize, sort, search }) => ({
        url: "staff",
        method: "GET",
        params: { page, pageSize, sort, search },
      }),
      providesTags: ["Staff"],
    }),
    getStaffById: build.query({
      query: (id) => `staff/${id}`,
      providesTags: ["Staff"],
    }),
    createStaff: build.mutation({
      query: (staffData) => ({
        url: "staff",
        method: "POST",
        body: staffData,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: build.mutation({
      query: ({ id, ...staffData }) => ({
        url: `staff/${id}`,
        method: "PUT",
        body: staffData,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: build.mutation({
      query: (id) => ({
        url: `staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),
    getStaffStats: build.query({
      query: () => "staff/stats",
      providesTags: ["Staff"],
    }),
    lookupStaffAccess: build.mutation({
      query: ({ staffId, name }) => ({
        url: "staff/lookup",
        method: "POST",
        body: { staffId, name },
      }),
    }),
    updateStaffAccess: build.mutation({
      query: ({ id, access }) => ({
        url: `staff/${id}/access`,
        method: "PUT",
        body: { access },
      }),
      invalidatesTags: ["Staff"],
    }),
    getStaffPerformance: build.query({
      query: () => "management/performance",
      providesTags: ["Performance"],
    }),
    getDashboard: build.query({
      query: () => "general/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetProductsQuery,
  useAddProductMutation,
  useGetCustomersQuery,
  useGetTransactionsQuery,
  useGetGeographyQuery,
  useGetSalesQuery,
  useGetAdminsQuery,
  useCreateAdminMutation,
  useGetStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetStaffStatsQuery,
  useLookupStaffAccessMutation,
  useUpdateStaffAccessMutation,
  useGetStaffPerformanceQuery,
  useGetDashboardQuery,
} = api;
