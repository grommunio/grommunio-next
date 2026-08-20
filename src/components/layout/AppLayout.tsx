// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box } from "@mui/material";
import React from "react";
import AppRail from "./AppRail";
import TopBar from "./TopBar";
import { SearchProvider } from "./SearchContext";
import useBackgroundMailSync from "../../features/mail/useBackgroundMailSync";

const BackgroundSync = () => {
  useBackgroundMailSync();
  return null;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider>
    <BackgroundSync />
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, width: "100%", minWidth: 0, height: "100%", overflow: "hidden", bgcolor: "background.default" }}>
      <Box className="gn-no-print"><TopBar /></Box>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Box className="gn-no-print" sx={{ display: "flex" }}><AppRail /></Box>
        <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {children}
        </Box>
      </Box>
    </Box>
  </SearchProvider>
);

export default AppLayout;
