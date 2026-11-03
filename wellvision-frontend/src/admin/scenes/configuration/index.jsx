import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  CheckCircleOutline,
  LockOutlined,
  Person,
  Refresh,
  SaveOutlined,
  Search,
} from "@mui/icons-material";
import Header from "../../components/Header";
import {
  ACCESS_MODULES,
  ALL_ACCESS_KEYS,
} from "../../data/accessModules";
import {
  useLookupStaffAccessMutation,
  useUpdateStaffAccessMutation,
} from "../../state/api";

const EMPTY_FORM = { staffId: "", name: "" };

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const roleColor = (role) => {
  switch (role) {
    case "Admin":
      return "error";
    case "Manager":
      return "warning";
    case "Supervisor":
      return "info";
    default:
      return "default";
  }
};

const Configuration = () => {
  const theme = useTheme();

  const [form, setForm] = useState(EMPTY_FORM);
  const [staff, setStaff] = useState(null);
  const [access, setAccess] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [lookupStaff, { isLoading: isSearching }] =
    useLookupStaffAccessMutation();
  const [updateStaffAccess, { isLoading: isSaving }] =
    useUpdateStaffAccessMutation();

  const moduleLabels = useMemo(
    () =>
      ACCESS_MODULES.reduce((map, module) => {
        map[module.key] = module.label;
        return map;
      }, {}),
    []
  );

  const hasChanges = staff
    ? [...access].sort().join(",") !==
      [...(staff.access || [])].sort().join(",")
    : false;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (searchError) setSearchError("");
  };

  const handleLookup = async (event) => {
    event.preventDefault();

    const staffId = form.staffId.trim();
    const name = form.name.trim();

    if (!staffId || !name) {
      setStaff(null);
      setAccess([]);
      setSearchError("Enter both the Staff ID and the full name.");
      return;
    }

    setSearchError("");

    try {
      const result = await lookupStaff({ staffId, name }).unwrap();
      setStaff(result.staff);
      setAccess(Array.isArray(result.staff.access) ? result.staff.access : []);
    } catch (error) {
      setStaff(null);
      setAccess([]);
      setSearchError(
        error?.data?.message ||
          error?.message ||
          "Unable to find that staff member."
      );
    }
  };

  const handleToggle = (key) => {
    setAccess((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  };

  const handleSelectAll = () => setAccess([...ALL_ACCESS_KEYS]);
  const handleClearAll = () => setAccess([]);

  const handleSave = async () => {
    if (!staff) return;

    try {
      const result = await updateStaffAccess({
        id: staff._id,
        access,
      }).unwrap();

      setStaff(result.staff);
      setAccess(Array.isArray(result.staff.access) ? result.staff.access : []);
      setSnackbar({
        open: true,
        message: `Access updated for ${result.staff.name}.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error?.data?.message ||
          error?.message ||
          "Failed to update staff access.",
        severity: "error",
      });
    }
  };

  const details = staff
    ? [
        { label: "Staff ID", value: staff.staffId },
        { label: "Email", value: staff.email || "N/A" },
        { label: "Phone", value: staff.phoneNumber || "N/A" },
        { label: "Department", value: staff.department || "N/A" },
        { label: "Role", value: staff.role || "N/A" },
        { label: "Status", value: staff.status || "N/A" },
        { label: "Hire Date", value: formatDate(staff.hireDate) },
      ]
    : [];

  return (
    <Box m="1.5rem 2.5rem">
      <Header
        title="CONFIGURATION"
        subtitle="Look up a staff member and manage their system access"
      />

      {/* LOOKUP FORM */}
      <Card
        sx={{
          mt: "1.5rem",
          backgroundImage: "none",
          backgroundColor: theme.palette.background.alt,
          borderRadius: "0.55rem",
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap="0.5rem" mb="1rem">
            <LockOutlined sx={{ color: theme.palette.secondary[300] }} />
            <Typography variant="h6" fontWeight="bold">
              Staff Lookup
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.secondary[300], mb: "1.25rem" }}
          >
            Enter the Staff ID and full name exactly as they appear in the staff
            directory. If the record exists, their details and current access
            will be shown below.
          </Typography>

          <Box
            component="form"
            onSubmit={handleLookup}
            display="grid"
            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
            gap="1.25rem"
          >
            <TextField
              label="Staff ID"
              name="staffId"
              value={form.staffId}
              onChange={handleChange}
              placeholder="e.g. STF0001"
              fullWidth
              size="small"
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Alice Johnson"
              fullWidth
              size="small"
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Box gridColumn="1 / -1">
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  isSearching ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Search />
                  )
                }
                disabled={isSearching}
                sx={{
                  backgroundColor: theme.palette.secondary[300],
                  color: theme.palette.primary[600],
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: theme.palette.secondary[400],
                  },
                }}
              >
                {isSearching ? "Searching..." : "Search Staff"}
              </Button>
            </Box>
          </Box>

          {searchError && (
            <Alert severity="error" sx={{ mt: "1.25rem" }}>
              {searchError}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* STAFF DETAILS + ACCESS */}
      {staff && (
        <Box
          mt="1.5rem"
          display="grid"
          gridTemplateColumns={{ xs: "1fr", lg: "minmax(0, 0.9fr) minmax(0, 1.4fr)" }}
          gap="1.5rem"
          alignItems="start"
        >
          {/* Details */}
          <Card
            sx={{
              backgroundImage: "none",
              backgroundColor: theme.palette.background.alt,
              borderRadius: "0.55rem",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap="1rem"
                flexWrap="wrap"
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {staff.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.secondary[300] }}
                  >
                    {staff.staffId}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={staff.role}
                    color={roleColor(staff.role)}
                    size="small"
                  />
                  <Chip
                    label={staff.status}
                    color={staff.status === "Active" ? "success" : "default"}
                    size="small"
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: "1rem" }} />

              {details.map(({ label, value }) => (
                <Box
                  key={label}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap="1rem"
                  py="0.4rem"
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.secondary[300],
                      minWidth: "90px",
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    textAlign="right"
                    sx={{ wordBreak: "break-word" }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Access editor */}
          <Card
            sx={{
              backgroundImage: "none",
              backgroundColor: theme.palette.background.alt,
              borderRadius: "0.55rem",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap="1rem"
              >
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Access Permissions
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.secondary[300] }}
                  >
                    {access.length} of {ACCESS_MODULES.length} areas granted
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={handleSelectAll}
                    disabled={isSaving || access.length === ACCESS_MODULES.length}
                  >
                    Grant all
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<Refresh fontSize="small" />}
                    onClick={handleClearAll}
                    disabled={isSaving || access.length === 0}
                  >
                    Clear all
                  </Button>
                </Stack>
              </Box>

              <Box
                mt="1rem"
                p="0.75rem"
                borderRadius="0.5rem"
                sx={{ backgroundColor: theme.palette.primary[500] }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.secondary[300],
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Current access
                </Typography>
                <Box
                  display="flex"
                  flexWrap="wrap"
                  gap="0.5rem"
                  mt="0.5rem"
                >
                  {access.length === 0 ? (
                    <Typography variant="body2">No access granted</Typography>
                  ) : (
                    access.map((key) => (
                      <Chip
                        key={key}
                        label={moduleLabels[key] || key}
                        size="small"
                        icon={<CheckCircleOutline />}
                        sx={{
                          backgroundColor: theme.palette.secondary[300],
                          color: theme.palette.primary[600],
                          fontWeight: "bold",
                        }}
                      />
                    ))
                  )}
                </Box>
              </Box>

              <Box
                mt="1rem"
                display="grid"
                gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
                gap="0.75rem"
              >
                {ACCESS_MODULES.map((module) => {
                  const checked = access.includes(module.key);
                  return (
                    <Box
                      key={module.key}
                      sx={{
                        border: "1px solid",
                        borderColor: checked
                          ? theme.palette.secondary[300]
                          : theme.palette.primary[400],
                        borderRadius: "0.5rem",
                        backgroundColor: checked
                          ? "rgba(255, 209, 102, 0.08)"
                          : "transparent",
                        transition: "border-color 0.15s ease",
                        "&:hover": {
                          borderColor: theme.palette.secondary[400],
                        },
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={() => handleToggle(module.key)}
                            disabled={isSaving}
                            sx={{
                              color: theme.palette.secondary[400],
                              "&.Mui-checked": {
                                color: theme.palette.secondary[300],
                              },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {module.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.secondary[300] }}
                            >
                              {module.description}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          m: 0,
                          p: "0.5rem 0.75rem",
                          width: "100%",
                          alignItems: "flex-start",
                          "& .MuiFormControlLabel-label": {
                            pt: "0.35rem",
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>

              <Box
                mt="1.25rem"
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                gap="1rem"
                flexWrap="wrap"
              >
                {hasChanges && (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.secondary[300] }}
                  >
                    You have unsaved changes.
                  </Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={
                    isSaving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SaveOutlined />
                    )
                  }
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  sx={{
                    backgroundColor: theme.palette.secondary[300],
                    color: theme.palette.primary[600],
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: theme.palette.secondary[400],
                    },
                  }}
                >
                  {isSaving ? "Saving..." : "Save Access"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Configuration;
