// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box } from "@mui/material";
import React from "react";
import AppRail from "./AppRail";
import TopBar from "./TopBar";
import { SearchProvider } from "./SearchContext";

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider>
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", bgcolor: "background.default" }}>
      <TopBar />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <AppRail />
        <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {children}
        </Box>
      </Box>
    </Box>
  </SearchProvider>
);

export default AppLayout;
