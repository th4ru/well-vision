import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, Close, Email, Lock, Person, Phone } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useCreateAdminMutation, useGetAdminsQuery } from "../../state/api";
import Header from "../../components/Header";

const EMPTY_FORM = { name: "", email: "", phone: "", password: "" };

const formatPhone = (value) => {
  if (!value) return "N/A";
  const phone = value.toString();
  if (phone.length === 10) {
    return phone.replace(/^(\d{3})(\d{3})(\d{4})/, "($1)$2-$3");
  }
  return phone;
};

const Admin = () => {
  const theme = useTheme();
  const { data, isLoading, error } = useGetAdminsQuery();
  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "phone",
      headerName: "Phone Number",
      flex: 0.6,
      renderCell: (params) => formatPhone(params.value),
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.5,
    },
    {
      field: "createdAt",
      headerName: "Created",
      flex: 0.6,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "N/A",
    },
  ];

  const rows = Array.isArray(data) ? data : Array.isArray(data?.admins) ? data.admins : [];

  const handleOpen = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const handleClose = () => {
    if (isCreating) return;
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      await createAdmin({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      }).unwrap();

      setOpen(false);
      setForm(EMPTY_FORM);
      setSnackbar({
        open: true,
        message: "Admin created successfully",
        severity: "success",
      });
    } catch (err) {
      setFormError(
        err?.data?.message || (typeof err?.error === "string" ? err.error : "Failed to create admin")
      );
    }
  };

  return (
    <Box m="1.5rem 2.5rem">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap="1rem"
      >
        <Header title="ADMINS" subtitle="Managing admins and list of admins" />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{
            backgroundColor: theme.palette.secondary.light,
            color: theme.palette.background.alt,
            fontSize: "14px",
            fontWeight: "bold",
            padding: "10px 20px",
          }}
        >
          Add Admin
        </Button>
      </Box>

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
        {isLoading ? (
          <Typography variant="h6" sx={{ mt: "20px" }}>
            Loading admins...
          </Typography>
        ) : error ? (
          <Alert severity="error">
            Error loading admins: {error?.data?.message || error.message || "Unknown error"}
          </Alert>
        ) : rows.length === 0 ? (
          <Typography variant="h6" sx={{ mt: "20px" }}>
            No admins found
          </Typography>
        ) : (
          <DataGrid
            loading={false}
            getRowId={(row) => row._id}
            rows={rows}
            columns={columns}
          />
        )}
      </Box>

      {/* Add Admin dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.background.alt,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Add New Admin
          <IconButton onClick={handleClose} aria-label="close" size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone Number (optional)"
                  value={form.phone}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  size="small"
                  inputProps={{ minLength: 8 }}
                  helperText="At least 8 characters"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Admin"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Admin;
