// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTypeSelector } from "../store";

// Same-origin paths only. Browsers treat "\" like "/"
export function safeRedirectTarget(redirect: string | null, origin = window.location.origin): string {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//") || redirect.includes("\\")) return "/";
  try {
    const url = new URL(redirect, origin);
    if (url.origin !== origin || url.pathname.startsWith("/login")) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

const UnauthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const authenticated = useTypeSelector(state => state.session.authenticated);
  const location = useLocation();
  if (authenticated) {
    const target = safeRedirectTarget(new URLSearchParams(location.search).get("redirect"));
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
};

export default UnauthenticatedRoute;
