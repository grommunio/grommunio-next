// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus, PublicClientApplication } from '@azure/msal-browser';
import type { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { useDispatch } from 'react-redux';
import { getUser } from '../api/user';
import { initGraphClient, resetGraphClient } from '../api/utils';
import { clearUserStorage } from '../features/session/storage';
import { clearExplicitLanguage } from '../features/settings/language';
import { setMe } from '../features/session/sessionSlice';
import getConfig from '../config';
import { MsalAuthenticationProvider } from './authProvider';

export interface AppUser {
  displayName?: string,
  email?: string,
  avatar?: string,
  timeZone?: string,
  timeFormat?: string
}

export interface AppError {
  message: string,
  debug?: string
}

export type AppContext = {
  user?: AppUser;
  error?: AppError;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  displayError: (message: string, debug?: string) => void;
  clearError: () => void;
  authProvider?: AuthenticationProvider;
}

const appContext = createContext<AppContext>({
  user: undefined,
  error: undefined,
  loading: true,
  signIn: async () => undefined,
  signOut: async () => undefined,
  displayError: () => undefined,
  clearError: () => undefined,
  authProvider: undefined,
});

export function useAppContext(): AppContext {
  return useContext(appContext);
}

interface ProvideAppContextProps {
  children: React.ReactNode;
}

export default function ProvideAppContext({ children }: ProvideAppContextProps) {
  const auth = useProvideAppContext();
  return (
    <appContext.Provider value={auth}>
      {children}
    </appContext.Provider>
  );
}

function useProvideAppContext(): AppContext {
  const { instance, inProgress, accounts } = useMsal();
  const dispatch = useDispatch();
  const [user, setUser] = useState<AppUser | undefined>(undefined);
  const [error, setError] = useState<AppError | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const config = getConfig();

  const displayError = useCallback((message: string, debug?: string) => {
    setError({ message, debug });
  }, []);

  const clearError = useCallback(() => setError(undefined), []);

  // Used by the Graph SDK to authenticate API calls
  const authProvider = useMemo(
    () => new MsalAuthenticationProvider(instance as PublicClientApplication, config),
    [instance, config]
  );

  const loadUser = useCallback(async () => {
    initGraphClient(authProvider);
    const graphUser = await getUser(authProvider);
    setUser({
      displayName: graphUser.displayName || '',
      email: graphUser.mail || graphUser.userPrincipalName || '',
      timeFormat: graphUser.mailboxSettings?.timeFormat || 'h:mm a',
      timeZone: graphUser.mailboxSettings?.timeZone || 'UTC'
    });
    dispatch(setMe(graphUser));
  }, [authProvider, dispatch]);

  // Wait for MSAL to handle a pending redirect first
  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;
    const account = instance.getActiveAccount() || accounts[0];
    if (!account) {
      setLoading(false);
      return;
    }
    if (!instance.getActiveAccount()) instance.setActiveAccount(account);
    if (user) {
      setLoading(false);
      return;
    }
    loadUser()
      .catch((err: any) => displayError(err.message))
      .finally(() => setLoading(false));
  }, [inProgress, accounts.length]);

  const signIn = useCallback(async () => {
    const request = { scopes: config.scopes, prompt: 'select_account' };
    if (config.interactionType === 'popup') {
      await instance.loginPopup(request);
      await loadUser();
    } else {
      await instance.loginRedirect(request);
    }
  }, [instance, config, loadUser]);

  const signOut = useCallback(async () => {
    dispatch(setMe(null));
    setUser(undefined);
    resetGraphClient();
    // The next user of this browser must not see this mailbox's data
    clearUserStorage();
    clearExplicitLanguage();
    const account = instance.getActiveAccount() || undefined;
    if (config.interactionType === 'popup') {
      await instance.logoutPopup({ account });
      // Reload like the redirect flow, to drop this user's data from memory
      window.location.assign(import.meta.env.BASE_URL);
    } else {
      await instance.logoutRedirect({ account });
    }
  }, [instance, config, dispatch]);

  return {
    user,
    error,
    loading,
    signIn,
    signOut,
    displayError,
    clearError,
    authProvider,
  };
}
