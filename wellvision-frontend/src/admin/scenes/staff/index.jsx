import React, { useState } from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Button,
  Typography,
  Rating,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  ExpandMore,
  Search,
  FilterList,
  Person,
  Email,
  Lock,
  Phone,
  Business,
  Close,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from "../../state/api";

const Staff = () => {
  const theme = useTheme();
  const isNonMobile = useMediaQuery("(min-width: 1000px)");
  
  // State for data grid
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState({});
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // State for modals
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
    status: "Active",
    phoneNumber: "",
    department: "",
  });

  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // API hooks
  const { data, isLoading, refetch } = useGetStaffQuery({
    page,
    pageSize,
    sort: JSON.stringify(sort),
    search,
  });

  const [createStaff] = useCreateStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [deleteStaff] = useDeleteStaffMutation();

  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (openAddModal) {
        // Do not send password on create; backend assigns default
        const { password, ...payload } = formData;
        await createStaff(payload).unwrap();
        setNotification({
          open: true,
          message: "Staff member created successfully!",
          severity: "success",
        });
        // Force refetch of staff data to ensure new member appears
        refetch();
      } else if (openEditModal) {
        const updateData = { ...formData };
        if (!updateData.password || updateData.password.trim() === "") {
          delete updateData.password;
        }
        await updateStaff({ id: selectedStaff._id, ...updateData }).unwrap();
        setNotification({
          open: true,
          message: "Staff member updated successfully!",
          severity: "success",
        });
        // Force refetch of staff data to ensure updates appear
        refetch();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Staff operation error:", error);
      let errorMessage = "An error occurred";

      if (error.data?.errors && Array.isArray(error.data.errors)) {
        // Prefer specific validation messages when available
        errorMessage = error.data.errors.map(err => err.msg || err.message).join(", ");
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 400) {
        errorMessage = "Invalid data provided. Please check your input.";
      } else if (error.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setNotification({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteStaff(selectedStaff._id).unwrap();
      setNotification({
        open: true,
        message: "Staff member deleted successfully!",
        severity: "success",
      });
      setOpenDeleteModal(false);
      setSelectedStaff(null);
    } catch (error) {
      setNotification({
        open: true,
        message: error.data?.message || "An error occurred",
        severity: "error",
      });
    }
  };

  // Handle modal operations
  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "", // kept in state for edit flow only, not required on add
      role: "Employee",
      status: "Active",
      phoneNumber: "",
      department: "",
    });
    setOpenAddModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: "",
      role: staff.role,
      status: staff.status,
      phoneNumber: staff.phoneNumber || "",
      department: staff.department || "",
    });
    setOpenEditModal(true);
  };

  const handleOpenDeleteModal = (staff) => {
    setSelectedStaff(staff);
    setOpenDeleteModal(true);
  };

  const handleCloseModal = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    setOpenDeleteModal(false);
    setSelectedStaff(null);
    setFormData({
      name: "",
      email: "",
      password: "", // kept in state for edit flow only
      role: "Employee",
      status: "Active",
      phoneNumber: "",
      department: "",
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Define columns for DataGrid
  const columns = [
    {
      field: "staffId",
      headerName: "Staff ID",
      flex: 0.5,
    },
    {
      field: "name",
      headerName: "Full Name",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.5,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "Admin"
              ? "error"
              : params.value === "Manager"
              ? "warning"
              : params.value === "Supervisor"
              ? "info"
              : "default"
          }
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.5,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Active" ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "department",
      headerName: "Department",
      flex: 0.7,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => handleOpenEditModal(params.row)}
            color="primary"
            size="small"
          >
            <Edit />
          </IconButton>
          <IconButton
            onClick={() => handleOpenDeleteModal(params.row)}
            color="error"
            size="small"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box m="1.5rem 2.5rem">
      <Header title="STAFF MANAGEMENT" subtitle="Manage your staff members" />
      
      {/* Search and Add Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="1rem"
        flexWrap="wrap"
        gap="1rem"
      >
        <Box display="flex" alignItems="center" gap="1rem">
          <TextField
            label="Search staff..."
            variant="outlined"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            sx={{ minWidth: "300px" }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<Search />}
          >
            Search
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAddModal}
          sx={{
            backgroundColor: theme.palette.secondary.light,
            color: theme.palette.background.alt,
            fontSize: "14px",
            fontWeight: "bold",
            padding: "10px 20px",
          }}
        >
          Add New Staff
        </Button>
      </Box>

      {/* Data Grid */}
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
          loading={isLoading || !data}
          getRowId={(row) => row._id}
          rows={(data && data.staff) || []}
          columns={columns}
          rowCount={(data && data.total) || 0}
          rowsPerPageOptions={[20, 50, 100]}
          pagination
          page={page}
          pageSize={pageSize}
          paginationMode="server"
          sortingMode="server"
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          onSortModelChange={(newSortModel) => setSort(...newSortModel)}
        />
      </Box>

      {/* Add/Edit Staff Modal */}
      <Dialog
        open={openAddModal || openEditModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.background.alt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {openAddModal ? "Add New Staff Member" : "Edit Staff Member"}
          <IconButton onClick={handleCloseModal} aria-label="close" size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  size="small"
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  )}}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  size="small"
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  )}}
                />
              </Grid>

              {openEditModal && (
                <Grid item xs={12}>
                  <TextField
                    name="password"
                    label="New Password (leave blank to keep current)"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    autoComplete="new-password"
                    InputProps={{ startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    )}}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    label="Role"
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Supervisor">Supervisor</MenuItem>
                    <MenuItem value="Employee">Employee</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="phoneNumber"
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  )}}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="department"
                  label="Department"
                  value={formData.department}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  )}}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="contained">
              {openAddModal ? "Add Staff" : "Update Staff"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteModal} onClose={handleCloseModal}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedStaff?.name}? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Staff;