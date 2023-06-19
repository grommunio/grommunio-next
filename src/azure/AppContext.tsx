/* eslint-disable @typescript-eslint/ban-types */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import React, {
  useContext,
  createContext,
  useState,
  MouseEventHandler,
  useEffect
} from 'react';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';

import { getUser } from '../api/user';
import config from './Config';
import { useDispatch } from 'react-redux';
import { setMeData } from '../actions/user';

// <AppContextSnippet>
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
  signIn?: MouseEventHandler<HTMLElement>;
  signOut?: Function;
  displayError?: Function;
  clearError?: Function;
  authProvider?: AuthCodeMSALBrowserAuthenticationProvider;
}

const appContext = createContext<AppContext>({
  user: undefined,
  error: undefined,
  signIn: undefined,
  signOut: undefined,
  displayError: undefined,
  clearError: undefined,
  authProvider: undefined
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
// </AppContextSnippet>

function useProvideAppContext() {
  const msal = useMsal();
  const dispatch = useDispatch();
  const [user, setUser] = useState<AppUser | undefined>(undefined);
  const [error, setError] = useState<AppError | undefined>(undefined);

  const displayError = (message: string, debug?: string) => {
    setError({ message, debug });
  }

  const clearError = () => {
    setError(undefined);
  }

  // <AuthProviderSnippet>
  // Used by the Graph SDK to authenticate API calls
  const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
    msal.instance as PublicClientApplication,
    {
      account: msal.instance.getActiveAccount()!,
      scopes: config.scopes,
      interactionType: InteractionType.Popup
    }
  );
  // </AuthProviderSnippet>

  // <UseEffectSnippet>
  useEffect(() => {
    const checkUser = async () => {
      if (!user) {
        try {
          // Check if user is already signed in
          const account = msal.instance.getActiveAccount();
          if (account) {
            // Get the user from Microsoft Graph
            const user = await getUser(authProvider);

            setUser({
              displayName: user.displayName || '',
              email: user.mail || user.userPrincipalName || '',
              timeFormat: user.mailboxSettings?.timeFormat || 'h:mm a',
              timeZone: user.mailboxSettings?.timeZone || 'UTC'
            });
            dispatch(setMeData(user));
          }
        } catch (err: any) {
          displayError(err.message);
        }
      }
    };
    checkUser();
  });
  // </UseEffectSnippet>

  // <SignInSnippet>
  const signIn = async () => {
    await msal.instance.loginPopup({
      scopes: config.scopes,
      prompt: 'select_account'
    });

    // Get the user from Microsoft Graph
    const user = await getUser(authProvider);

    setUser({
      displayName: user.displayName || '',
      email: user.mail || user.userPrincipalName || '',
      timeFormat: user.mailboxSettings?.timeFormat || '',
      timeZone: user.mailboxSettings?.timeZone || 'UTC'
    });
    dispatch(setMeData(user));
  };
  // </SignInSnippet>

  // This flow is a bit sus.
  // First we need to set the authentication state to false (by clearing the user data),
  // so we get redirected to login screen.
  // If we clear the context's user state simultanious,
  // it will automatically try to log us in again (because of the useEffect).
  // Thus, we first have to open the MS popout to logout remotely
  // Afterwards, we can clear the context's state
  const signOut = async () => {
    dispatch(setMeData(null));
    await msal.instance.logoutPopup();
    setUser(undefined);
  };

  return {
    user,
    error,
    signIn,
    signOut,
    displayError,
    clearError,
    authProvider
  };
}
