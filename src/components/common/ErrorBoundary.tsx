// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Collapse, Typography } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";

type ErrorBoundaryProps = WithTranslation & {
  children: React.ReactNode;
  // Changing it resets the boundary
  resetKey?: string;
};

type ErrorBoundaryState = {
  error: Error | null;
  showDetails: boolean;
};

// Keeps the top bar and rail usable when a module crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled error in view", error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, showDetails: false });
    }
  }

  render() {
    const { t, children } = this.props;
    const { error, showDetails } = this.state;
    if (!error) return children;
    return (
      <Box role="alert" sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, textAlign: "center" }}>
        <ErrorOutline color="error" sx={{ fontSize: 56, mb: 2 }} />
        <Typography variant="h6" gutterBottom>{t("Something went wrong")}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mb: 2 }}>
          {t("This view could not be displayed. You can try again or reload the page.")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={() => this.setState({ error: null })}>{t("Try again")}</Button>
          <Button variant="outlined" color="inherit" onClick={() => window.location.reload()}>{t("Reload")}</Button>
          <Button color="inherit" onClick={() => this.setState({ showDetails: !showDetails })}>{showDetails ? t("Hide details") : t("Show details")}</Button>
        </Box>
        <Collapse in={showDetails}>
          <Box component="pre" sx={{ mt: 2, p: 2, textAlign: "left", fontSize: 12, bgcolor: "background.default", borderRadius: 1, maxWidth: 720, overflow: "auto" }}>
            {error.message}{"\n"}{error.stack}
          </Box>
        </Collapse>
      </Box>
    );
  }
}

export default withTranslation()(ErrorBoundary);
