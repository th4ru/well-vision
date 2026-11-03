import React, { useState, useMemo } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "../../theme";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useGetUserQuery } from "../../state/api";

const Layout = () => {
  const mode = useSelector((state) => state.global.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isNonMobile = useMediaQuery("(min-width: 600px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const userId = useSelector((state) => state.global?.userId);
  const { data } = useGetUserQuery(userId);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display={isNonMobile ? "flex" : "block"} width="100%" minHeight="100vh">
        <Sidebar
          user={data || {}}
          isNonMobile={isNonMobile}
          drawerWidth="250px"
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Navbar
            user={data || {}}
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
