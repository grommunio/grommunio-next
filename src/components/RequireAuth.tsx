// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTypeSelector } from "../store";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const authenticated = useTypeSelector(state => state.auth.authenticated);
  const location = useLocation();
  if (!authenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
