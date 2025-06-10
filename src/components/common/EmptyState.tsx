// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Typography } from "@mui/material";
import React from "react";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, textAlign: "center", color: "text.secondary" }}>
    {icon && <Box sx={{ mb: 2, "& svg": { fontSize: 64, opacity: 0.5 } }}>{icon}</Box>}
    <Typography variant="h6" color="text.primary" gutterBottom>{title}</Typography>
    {description && <Typography variant="body2" sx={{ maxWidth: 360 }}>{description}</Typography>}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);

export default EmptyState;
