// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../azure/AppContext";
import Drawer from "../components/Drawer";

function Menu() {
  const app = useAppContext();
  const { t } = useTranslation();

  const handleLogin = () => {
    app.signIn();
  }

  const handleLogout = () => {
    app.signOut();
  }

  return (
    <div>
      <Drawer />
      <div style={{ marginLeft: 276 }}>
        <h1>grommunio Next</h1>
        <p className="lead">
          This app uses the Microsoft Graph API
        </p>
        <AuthenticatedTemplate>
          <div>
            <h4>Welcome {app.user?.displayName || ''}!</h4>
            <p>Use the drawer to get started.</p>
            <Button
              onClick={handleLogout}
              variant="contained"
              color="inherit"
              style={{ backgroundColor: 'grey' }}
            >
              {t("Sign out")}
            </Button>
          </div>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <Button
            color="primary"
            onClick={handleLogin}
            variant="contained"
          >
            {t("Sign in")}
          </Button>
        </UnauthenticatedTemplate>
      </div>
    </div>
  );
}

export default Menu;
