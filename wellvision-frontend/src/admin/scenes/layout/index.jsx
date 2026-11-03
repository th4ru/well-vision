import React, { useState, useMemo, useContext } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "../../theme";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useGetMeQuery } from "../../state/api";
import { AuthContext } from "../../../context/AuthContext";

const Layout = () => {
  const mode = useSelector((state) => state.global.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isNonMobile = useMediaQuery("(min-width: 600px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user: authUser } = useContext(AuthContext);
  // Fresh account details from the database, with the login response as a
  // fallback while the request is in flight.
  const { data: me } = useGetMeQuery();
  const currentUser = me || authUser || {};

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display={isNonMobile ? "flex" : "block"} width="100%" minHeight="100vh">
        <Sidebar
          user={currentUser}
          isNonMobile={isNonMobile}
          drawerWidth="250px"
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Navbar
            user={currentUser}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <Box flexGrow={1} p={2}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
