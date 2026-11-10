import React, { useState, useContext } from "react";
import {
  LightModeOutlined,
  DarkModeOutlined,
  Menu as MenuIcon,
  Search,
  SettingsOutlined,
  ArrowDropDownOutlined,
  Close,
  Edit,
  Save,
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";
import { useDispatch } from "react-redux";
import { setMode } from "../state/globalSlice";
import profileImage from "../assets/profile.jpeg";
import {
  Alert,
  AppBar,
  Avatar,
  Button,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
  IconButton,
  InputBase,
  Toolbar,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUpdateMeMutation } from "../state/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

const EMPTY_FORM = { name: "", email: "", phone: "" };

const Navbar = ({ user = {}, isSidebarOpen, setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState(null);
  const isOpen = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const displayUser = user || {};
  const name = displayUser.name || "User";
  const role = displayUser.role || "User";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  const accountDetails = [
    { label: "Full Name", value: name },
    { label: "Email", value: displayUser.email || "N/A" },
    { label: "Phone", value: displayUser.phone || "N/A" },
    { label: "Account Status", value: displayUser.isAccountVerified ? "Verified" : "Not verified" },
    { label: "Member Since", value: formatDate(displayUser.createdAt) },
    { label: "Last Login", value: formatDate(displayUser.lastLogin) },
    { label: "User ID", value: displayUser._id || displayUser.id || "N/A" },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
    handleClose();
  };

  const openAccountDetails = () => {
    setIsEditing(false);
    setFeedback(null);
    setForm(EMPTY_FORM);
    setSettingsOpen(true);
  };

  const closeAccountDetails = () => {
    if (isSaving) return;
    setSettingsOpen(false);
    setIsEditing(false);
    setFeedback(null);
  };

  const handleStartEdit = () => {
    setForm({
      name: displayUser.name || "",
      email: displayUser.email || "",
      phone: displayUser.phone || "",
    });
    setFeedback(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isSaving) return;
    setIsEditing(false);
    setFeedback(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name: field, value } = event.target;
    setForm((previous) => ({ ...previous, [field]: value }));
    if (feedback?.severity === "error") setFeedback(null);
  };

  const handleSave = async () => {
    const nameValue = form.name.trim();
    const emailValue = form.email.trim();
    const phoneValue = form.phone.trim();

    if (!nameValue) {
      setFeedback({ severity: "error", message: "Full name is required." });
      return;
    }
    if (!EMAIL_REGEX.test(emailValue)) {
      setFeedback({ severity: "error", message: "Enter a valid email address." });
      return;
    }
    if (phoneValue && !PHONE_REGEX.test(phoneValue)) {
      setFeedback({
        severity: "error",
        message: "Enter a valid phone number (7-15 digits, optional + and dashes).",
      });
      return;
    }

    try {
      const result = await updateMe({
        name: nameValue,
        email: emailValue,
        phone: phoneValue,
      }).unwrap();

      setIsEditing(false);
      setForm(EMPTY_FORM);
      setFeedback({
        severity: "success",
        message: result?.message || "Account details updated successfully.",
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message:
          error?.data?.message ||
          error?.message ||
          "Failed to update account details.",
      });
    }
  };

  return (
    <AppBar
      sx={{
        position: "static",
        background: "none",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* LEFT SIDE */}
        <FlexBetween>
          <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <MenuIcon />
          </IconButton>
          <FlexBetween
            backgroundColor={theme.palette.background.alt}
            borderRadius="9px"
            gap="3rem"
            p="0.1rem 1.5rem"
          >
            <InputBase placeholder="Search..." />
            <IconButton>
              <Search />
            </IconButton>
          </FlexBetween>
        </FlexBetween>

        {/* RIGHT SIDE */}
        <FlexBetween gap="1.5rem">
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlined sx={{ fontSize: "25px" }} />
            ) : (
              <LightModeOutlined sx={{ fontSize: "25px" }} />
            )}
          </IconButton>
          <IconButton
            title="Account settings"
            aria-label="Account settings"
            onClick={openAccountDetails}
          >
            <SettingsOutlined sx={{ fontSize: "25px" }} />
          </IconButton>

          <FlexBetween>
            <Button
              onClick={handleClick}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textTransform: "none",
                gap: "1rem",
              }}
            >
              <Box
                component="img"
                alt="profile"
                src={displayUser.avatar || profileImage}
                height="32px"
                width="32px"
                borderRadius="50%"
                sx={{ objectFit: "cover" }}
              />
              <Box textAlign="left">
                <Typography
                  fontWeight="bold"
                  fontSize="0.85rem"
                  sx={{ color: theme.palette.secondary[100] }}
                >
                  {name}
                </Typography>
                <Typography
                  fontSize="0.75rem"
                  sx={{ color: theme.palette.secondary[200] }}
                >
                  {role}
                </Typography>
              </Box>
              <ArrowDropDownOutlined
                sx={{ color: theme.palette.secondary[300], fontSize: "25px" }}
              />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={isOpen}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <MenuItem
                onClick={() => {
                  openAccountDetails();
                  handleClose();
                }}
              >
                Account Details
              </MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
          </FlexBetween>
        </FlexBetween>
      </Toolbar>

      {/* ACCOUNT DETAILS DIALOG */}
      <Dialog
        open={settingsOpen}
        onClose={closeAccountDetails}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: theme.palette.secondary[100],
          }}
        >
          {isEditing ? "Edit Account Details" : "Account Details"}
          <IconButton
            aria-label="close"
            onClick={closeAccountDetails}
            size="small"
            disabled={isSaving}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" alignItems="center" gap="1rem" mb="1.25rem">
            <Avatar
              src={displayUser.avatar || undefined}
              sx={{
                width: 56,
                height: 56,
                backgroundColor: theme.palette.secondary[300],
                color: theme.palette.primary[600],
                fontWeight: "bold",
                fontSize: "1.5rem",
              }}
            >
              {initial}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {name}
              </Typography>
              <Typography variant="body2" color={theme.palette.secondary[300]}>
                {displayUser.email || "N/A"}
              </Typography>
              <Chip
                label={role}
                size="small"
                sx={{
                  mt: "0.35rem",
                  backgroundColor: theme.palette.secondary[300],
                  color: theme.palette.primary[600],
                  fontWeight: "bold",
                }}
              />
            </Box>
          </Box>
          <Divider sx={{ mb: "0.75rem" }} />

          {feedback && (
            <Alert severity={feedback.severity} sx={{ mb: "1rem" }}>
              {feedback.message}
            </Alert>
          )}

          {isEditing ? (
            <Box display="grid" gap="1rem">
              <TextField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                autoFocus
                disabled={isSaving}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                disabled={isSaving}
              />
              <TextField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
                size="small"
                disabled={isSaving}
              />
            </Box>
          ) : (
            accountDetails.map(({ label, value }) => (
              <Box
                key={label}
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap="1rem"
                py="0.5rem"
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.secondary[300], minWidth: "110px" }}
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
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          {isEditing ? (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={isSaving}
              startIcon={
                isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />
              }
              sx={{
                backgroundColor: theme.palette.secondary[300],
                color: theme.palette.primary[600],
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: theme.palette.secondary[400],
                },
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          ) : (
            <Button onClick={handleStartEdit} startIcon={<Edit />} variant="contained">
              Edit
            </Button>
          )}
          <Button
            onClick={isEditing ? handleCancelEdit : closeAccountDetails}
            disabled={isSaving}
          >
            {isEditing ? "Cancel" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;
