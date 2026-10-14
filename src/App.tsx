// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { useEffect, useState } from 'react';
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
import { setDayjsLocale } from './features/calendar/dates';
import { getExplicitLanguage, resolveLanguage } from './features/settings/language';

function AppFrame() {
  const { i18n } = useTranslation();
  const dispatch = useTypeDispatch();
  const { loading } = useAppContext();
  const authenticated = useTypeSelector(state => state.session.authenticated);
  const [, setDayjsLocaleKey] = useState("en");

  useEffect(() => {
    const applyLanguage = async () => {
      // Mailbox language beats the cached one, unless picked at sign-in this session
      let lang = getExplicitLanguage() || localStorage.getItem("lang");
      if (authenticated) {
        const result = await dispatch(loadMailboxSettings());
        const locale = loadMailboxSettings.fulfilled.match(result) ? result.payload.language?.locale : undefined;
        lang = resolveLanguage(getExplicitLanguage(), locale, lang);
      }
      if (lang) {
        // Load the dayjs locale first or dates render in the old language
        await setDayjsLocale(lang);
        i18n.changeLanguage(lang);
        dispatch(setLanguage(lang));
      }
    };
    applyLanguage();
  }, [authenticated]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    // Dates are formatted during render, so re-render once the locale is in
    setDayjsLocale(i18n.language).then(setDayjsLocaleKey);
  }, [i18n.language]);

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
