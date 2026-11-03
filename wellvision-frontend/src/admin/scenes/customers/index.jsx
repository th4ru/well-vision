import React from "react";
import { Box, useTheme, Typography } from "@mui/material";
import { useGetCustomersQuery } from "../../state/api";
import Header from "../../components/Header";
import { DataGrid } from "@mui/x-data-grid";

const fullName = (row) =>
  `${row.givenName || ""} ${row.familyName || ""}`.trim() || "N/A";

const Customers = () => {
  const theme = useTheme();
  // Refetch when the page is opened/focused and poll occasionally so a
  // customer added by a normal user shows up for the admin without a reload.
  const { data, isLoading, error } = useGetCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 15000,
  });

  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.customers)
    ? data.customers
    : [];

  const columns = [
    {
      field: "_id",
      headerName: "ID",
      flex: 1,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 0.7,
      valueGetter: (params) => fullName(params.row),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "phoneNo",
      headerName: "Phone Number",
      flex: 0.6,
    },
    {
      field: "ageYears",
      headerName: "Age",
      flex: 0.3,
      type: "number",
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
    },
    {
      field: "nicPassport",
      headerName: "NIC / Passport",
      flex: 0.6,
    },
  ];

  if (isLoading) {
    return (
      <Box m="1.5rem 2.5rem">
        <Header title="CUSTOMERS" subtitle="List of Customers" />
        <Typography variant="h6" sx={{ mt: "20px" }}>
          Loading customers...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="1.5rem 2.5rem">
        <Header title="CUSTOMERS" subtitle="List of Customers" />
        <Typography variant="h6" color="error" sx={{ mt: "20px" }}>
          Error loading customers: {error?.data?.message || error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box m="1.5rem 2.5rem">
        <Header title="CUSTOMERS" subtitle="List of Customers" />
        <Typography variant="h6" sx={{ mt: "20px" }}>
          No customers found
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="1.5rem 2.5rem">
      <Header
        title="CUSTOMERS"
        subtitle={`List of Customers (${rows.length})`}
      />
      <Box
        mt="40px"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: theme.palette.background.alt,
            color: theme.palette.secondary[100],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: theme.palette.primary.light,
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: theme.palette.background.alt,
            color: theme.palette.secondary[100],
            borderTop: "none",
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${theme.palette.secondary[200]} !important`,
          },
        }}
      >
        <DataGrid
          loading={false}
          getRowId={(row) => row._id}
          rows={rows}
          columns={columns}
        />
      </Box>
    </Box>
  );
};

export default Customers;
