// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTypeSelector } from "../store";

const UnauthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const authenticated = useTypeSelector(state => state.auth.authenticated);
  const location = useLocation();
  if (authenticated) {
    const redirect = new URLSearchParams(location.search).get("redirect");
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
};

export default UnauthenticatedRoute;
