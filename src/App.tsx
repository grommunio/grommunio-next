// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { useEffect } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { useTranslation } from 'react-i18next';
import { CssBaseline } from '@mui/material';
import ProvideAppContext, { useAppContext } from './azure/AppContext';
import { getMsalInstance } from './azure/msal';
import AppRoutes from './Routes';
import AppLayout from './components/layout/AppLayout';
import AppLoader from './components/AppLoader';
import AlertStack from './components/AlertStack';
import { useTypeDispatch, useTypeSelector } from './store';
import { loadMailboxSettings, setLanguage } from './features/settings/settingsSlice';

function AppFrame() {
  const { i18n } = useTranslation();
  const dispatch = useTypeDispatch();
  const { loading } = useAppContext();
  const authenticated = useTypeSelector(state => state.auth.authenticated);

  useEffect(() => {
    const applyLanguage = async () => {
      // Mailbox settings win over the locally stored preference
      let lang = localStorage.getItem("lang");
      if (authenticated) {
        const result = await dispatch(loadMailboxSettings());
        if (loadMailboxSettings.fulfilled.match(result) && result.payload.language?.locale) {
          lang = result.payload.language.locale;
        }
      }
      if (lang) {
        i18n.changeLanguage(lang);
        dispatch(setLanguage(lang));
      }
    };
    applyLanguage();
  }, [authenticated]);

  // Don't flash the sign-in page while the session is being restored
  if (loading) {
    return <AppLoader />;
  }

  if (!authenticated) {
    return <AppRoutes />;
  }

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

export default function App() {
  return (
    <MsalProvider instance={getMsalInstance()}>
      <ProvideAppContext>
        <CssBaseline />
        <AppFrame />
        <AlertStack />
      </ProvideAppContext>
    </MsalProvider>
  );
}
