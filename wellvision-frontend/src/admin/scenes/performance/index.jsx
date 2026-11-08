import React from "react";
import { Box, useTheme, Typography } from "@mui/material";
import { useGetStaffPerformanceQuery } from "../../state/api";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const Performance = () => {
  const theme = useTheme();
  const { data, isLoading, error } = useGetStaffPerformanceQuery();

  const columns = [
    {
      field: "staffId",
      headerName: "Staff ID",
      flex: 0.7,
    },
    {
      field: "name",
      headerName: "Staff Name",
      flex: 1.1,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
    },
    {
      field: "salesCount",
      headerName: "Sales",
      flex: 0.5,
      type: "number",
    },
    {
      field: "unitsSold",
      headerName: "Units Sold",
      flex: 0.6,
      type: "number",
    },
    {
      field: "totalSales",
      headerName: "Total Sales (Paid)",
      flex: 1,
      renderCell: (params) => formatCurrency(params.value),
    },
    {
      field: "lastSale",
      headerName: "Last Sale",
      flex: 1.1,
      renderCell: (params) => formatDate(params.value),
    },
  ];

  const rows = data?.staff || [];
  const totals = data?.totals || {
    salesCount: 0,
    unitsSold: 0,
    totalSales: 0,
  };

  const summaryCard = (label, value) => (
    <Box
      key={label}
      sx={{
        flex: "1 1 180px",
        minWidth: 180,
        p: "1rem 1.25rem",
        borderRadius: "8px",
        backgroundColor: theme.palette.background.alt,
      }}
    >
      <Typography
        sx={{ fontSize: "12px", color: theme.palette.secondary[300] }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ mt: "4px", color: theme.palette.secondary[100] }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Box m="1.5rem 2.5rem">
      <Header
        title="PERFORMANCE"
        subtitle="Track your staff sales performance here"
      />

      {isLoading ? (
        <Typography variant="h6" sx={{ mt: "20px" }}>
          Loading performance data...
        </Typography>
      ) : error ? (
        <Typography variant="h6" color="error" sx={{ mt: "20px" }}>
          Error loading performance data:{" "}
          {error?.data?.message || error.message || "Unknown error"}
        </Typography>
      ) : (
        <>
          <Box display="flex" flexWrap="wrap" gap="1rem" mt="1.5rem">
            {summaryCard(
              "Total Sales (Paid)",
              formatCurrency(totals.totalSales)
            )}
            {summaryCard("Total Sales", totals.salesCount)}
            {summaryCard("Units Sold", totals.unitsSold)}
          </Box>

          <Box
            mt="1.5rem"
            height="65vh"
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
            {rows.length === 0 ? (
              <Typography variant="h6" sx={{ mt: "20px" }}>
                No performance data found
              </Typography>
            ) : (
              <DataGrid
                loading={false}
                getRowId={(row) => row._id}
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Performance;
