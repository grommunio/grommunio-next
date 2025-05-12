// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Box, CircularProgress } from "@mui/material";
import GrommunioLogo from "./logos/GrommunioLogo";

export default function AppLoader() {
  return (
    <Box sx={{ display: "flex", flex: 1, height: "100%", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 3 }}>
      <GrommunioLogo height={40} />
      <CircularProgress size={28} />
    </Box>
  );
}
