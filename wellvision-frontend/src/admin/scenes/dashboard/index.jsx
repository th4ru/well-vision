import React from "react";
import FlexBetween from "../../components/FlexBetween";
import Header from "../../components/Header";
import {
  AccountBalanceWallet,
  DownloadOutlined,
  PointOfSale,
  PersonAdd,
  Traffic,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import BreakdownChart from "../../components/BreakdownChart";
import OverviewChart from "../../components/OverviewChart";
import { useGetDashboardQuery } from "../../state/api";
import StatBox from "../../components/StatBox";

const Dashboard = () => {
  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width: 1200px)");
  const { data, isLoading, error } = useGetDashboardQuery();

  if (isLoading) {
    return (
      <Box m="1.5rem 2.5rem">
        <Typography variant="h4" color={theme.palette.secondary[100]}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="1.5rem 2.5rem">
        <Typography variant="h4" color="error">
          Error loading dashboard: {error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  // Defensive check for data and transactions
  const safeData = data || {};
  const safeTransactions = Array.isArray(safeData.transactions) ? safeData.transactions : [];

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return `${numeric < 0 ? "-" : ""}Rs. ${Math.abs(numeric).toLocaleString()}`;
  };
  const formatChange = (value) => {
    const numeric = Number(value || 0);
    return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(1)}%`;
  };

  const actualRevenue = Number(safeData.actualRevenue || 0);

  const columns = [
    {
      field: "_id",
      headerName: "ID",
      flex: 1,
    },
    {
      field: "userId",
      headerName: "Customer",
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "products",
      headerName: "# of Products",
      flex: 0.5,
      sortable: false,
      renderCell: (params) => params.value?.length || 0,
    },
    {
      field: "cost",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) =>
        `Rs. ${Number(params.value || 0).toLocaleString()}`,
    },
  ];

  return (
    <Box m="1.5rem 2.5rem">
      <FlexBetween>
        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />

        <Box>
          <Button
            sx={{
              backgroundColor: theme.palette.secondary.light,
              color: theme.palette.background.alt,
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlined sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </FlexBetween>

      <Box
        mt="20px"
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="160px"
        gap="20px"
        sx={{
          "& > div": { gridColumn: isNonMediumScreens ? undefined : "span 12" },
        }}
      >
        {/* ROW 1 */}
        <StatBox
          title="Actual Revenue"
          value={formatCurrency(actualRevenue)}
          valueColor={
            actualRevenue < 0 ? theme.palette.error.main : undefined
          }
          increase={formatChange(data?.actualRevenueChange)}
          description="vs last year"
          hint="Money collected minus the cost of the products that were sold."
          icon={
            <AccountBalanceWallet
              sx={{ color: theme.palette.secondary[300], fontSize: "26px" }}
            />
          }
        />
        <StatBox
          title="Sales Today"
          value={formatCurrency(data?.todayStats?.totalSales)}
          increase={formatChange(data?.todayStats?.change)}
          description="vs yesterday"
          icon={
            <PointOfSale
              sx={{ color: theme.palette.secondary[300], fontSize: "26px" }}
            />
          }
        />
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={theme.palette.background.alt}
          p="1rem"
          borderRadius="0.55rem"
          display="flex"
          flexDirection="column"
        >
          <Typography variant="h6" sx={{ color: theme.palette.secondary[100] }}>
            Monthly Sales
          </Typography>
          <Box flexGrow={1} minHeight={0}>
            <OverviewChart view="sales" isDashboard cumulative={false} />
          </Box>
        </Box>
        <StatBox
          title="Monthly Sales"
          value={formatCurrency(data?.thisMonthStats?.totalSales)}
          increase={formatChange(data?.thisMonthStats?.change)}
          description="vs last month"
          icon={
            <PersonAdd
              sx={{ color: theme.palette.secondary[300], fontSize: "26px" }}
            />
          }
        />
        <StatBox
          title="Yearly Sales"
          value={formatCurrency(data?.yearlySalesTotal)}
          increase={formatChange(data?.yearlyChange)}
          description="vs last year"
          icon={
            <Traffic
              sx={{ color: theme.palette.secondary[300], fontSize: "26px" }}
            />
          }
        />

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 3"
          sx={{
            "& .MuiDataGrid-root": {
              border: "none",
              borderRadius: "5rem",
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
              backgroundColor: theme.palette.background.alt,
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
            loading={isLoading || !data}
            getRowId={(row) => row._id}
            rows={safeTransactions}
            columns={columns}
          />
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 3"
          backgroundColor={theme.palette.background.alt}
          p="1.5rem"
          borderRadius="0.55rem"
        >
          <Typography variant="h6" sx={{ color: theme.palette.secondary[100] }}>
            Sales By Category
          </Typography>
          <BreakdownChart isDashboard={true} />
          <Typography
            p="0 0.6rem"
            fontSize="0.8rem"
            sx={{ color: theme.palette.secondary[200] }}
          >
            Breakdown of real states and information via category for revenue
            made for this year and total sales.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
