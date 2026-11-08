import React, { useState } from "react";
import {
  Box,
  useTheme,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useGetTransactionsQuery } from "../../state/api";
import Header from "../../components/Header";
import DataGridCustomToolbar from "../../components/DataGridCustomToolbar";

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getStatusLabel = (status) =>
  status === "In Lab Processing" ? "Lab Processing" : status || "—";

const getStatusColor = (status) => {
  switch (status) {
    case "Customer Collected":
      return "success";
    case "Ready for Customer":
      return "info";
    case "In Lab Processing":
    case "Order Placed in Lab":
      return "warning";
    default:
      return "default";
  }
};

const Transactions = () => {
  const theme = useTheme();

  // Values sent to the backend.
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortModel, setSortModel] = useState([]);
  const [search, setSearch] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { data, isLoading, error } = useGetTransactionsQuery({
    page,
    pageSize,
    sort: JSON.stringify(sortModel[0] || {}),
    search,
  });

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
  };

  const columns = [
    {
      field: "orderNumber",
      headerName: "Order #",
      flex: 0.8,
    },
    {
      field: "staffId",
      headerName: "Staff ID",
      flex: 0.7,
    },
    {
      field: "customerName",
      headerName: "Customer Name",
      flex: 1.2,
    },
    {
      field: "orderDate",
      headerName: "Order Date",
      flex: 0.9,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: "orderTime",
      headerName: "Time",
      flex: 0.6,
      sortable: false,
      valueGetter: (params) => formatTime(params.row.orderDate),
    },
    {
      field: "total",
      headerName: "Total",
      flex: 0.8,
      type: "number",
      renderCell: (params) => formatCurrency(params.value),
    },
  ];

  const detailRow = (label, value) => (
    <Box
      key={label}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      gap={2}
    >
      <Typography sx={{ color: theme.palette.secondary[300] }}>
        {label}
      </Typography>
      {typeof value === "string" || typeof value === "number" ? (
        <Typography fontWeight="500" textAlign="right">
          {value}
        </Typography>
      ) : (
        <Box textAlign="right">{value}</Box>
      )}
    </Box>
  );

  return (
    <Box m="1.5rem 2.5rem">
      <Header
        title="TRANSACTIONS"
        subtitle="Entire list of transactions — click a row to view full details"
      />

      {error && (
        <Typography color="error" sx={{ mb: "1rem" }}>
          Error loading transactions:{" "}
          {error?.data?.message || error.message || "Unknown error"}
        </Typography>
      )}

      <Box
        height="80vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-row": {
            cursor: "pointer",
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
          loading={isLoading || !data}
          getRowId={(row) => row._id}
          rows={(data && data.transactions) || []}
          columns={columns}
          rowCount={(data && data.total) || 0}
          rowsPerPageOptions={[20, 50, 100]}
          pagination
          page={page}
          pageSize={pageSize}
          paginationMode="server"
          sortingMode="server"
          sortModel={sortModel}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(0);
          }}
          onSortModelChange={(model) => {
            setSortModel(model);
            setPage(0);
          }}
          onRowClick={(params) => setSelectedTransaction(params.row)}
          disableRowSelectionOnClick
          components={{ Toolbar: DataGridCustomToolbar }}
          componentsProps={{
            toolbar: { searchInput, setSearchInput, setSearch: handleSearch },
          }}
        />
      </Box>

      <Dialog
        open={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.background.alt,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Transaction {selectedTransaction?.orderNumber || ""}
            </Typography>
            {selectedTransaction?.billNo && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.secondary[300] }}
              >
                Bill {selectedTransaction.billNo}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => setSelectedTransaction(null)}
            aria-label="close"
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedTransaction && (
            <Box display="flex" flexDirection="column" gap="1rem">
              {detailRow("Customer Name", selectedTransaction.customerName)}
              {detailRow(
                "Staff ID",
                selectedTransaction.staffName &&
                  selectedTransaction.staffName !== "—"
                  ? `${selectedTransaction.staffId} — ${selectedTransaction.staffName}`
                  : selectedTransaction.staffId
              )}
              {detailRow(
                "Order Date",
                formatDate(selectedTransaction.orderDate)
              )}
              {detailRow("Time", formatTime(selectedTransaction.orderDate))}
              {detailRow(
                "Order Status",
                <Chip
                  size="small"
                  label={getStatusLabel(selectedTransaction.status)}
                  color={getStatusColor(selectedTransaction.status)}
                />
              )}

              <Divider />

              <Typography fontWeight="bold">Products</Typography>
              {selectedTransaction.items?.length ? (
                selectedTransaction.items.map((item, index) => (
                  <Box
                    key={`${item.description}-${index}`}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={2}
                    pb="0.5rem"
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    <Box>
                      <Typography>{item.description}</Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.secondary[300] }}
                      >
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </Typography>
                    </Box>
                    <Typography>{formatCurrency(item.lineTotal)}</Typography>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: theme.palette.secondary[300] }}>
                  No products recorded
                </Typography>
              )}

              <Divider />

              {detailRow("Total", formatCurrency(selectedTransaction.total))}
              {detailRow(
                "Total Balance",
                <Typography
                  component="span"
                  fontWeight="bold"
                  color={
                    Number(selectedTransaction.balance) > 0
                      ? "error.main"
                      : "success.main"
                  }
                >
                  {formatCurrency(selectedTransaction.balance)}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedTransaction(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;
