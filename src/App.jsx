// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './App.css';
import { MsalProvider } from '@azure/msal-react';
import config from './azure/Config';
import { EventType, PublicClientApplication } from '@azure/msal-browser';
import ProvideAppContext from './azure/AppContext';
import { withStyles } from '@mui/styles';
import { connect } from 'react-redux';
import makeLoadableComponent from './lazy';
import TopBar from './components/TopBar';
import { useTranslation } from 'react-i18next';
import { useTypeDispatch } from './store';
import { changeSettings } from './actions/settings';
import GAB from './components/dialogs/GAB';
import { CssBaseline } from '@mui/material';

const styles = {
  root: {
    display: "flex",
    flexDirection: 'column',
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#fafafa",
    backgroundSize: "cover",
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 1,
  },
  mainView: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    zIndex: 100,
  },
  drawerListElementClass: {
    width: 'auto',
    borderRadius: '3px',
  },
  routes: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }
};

// <MsalInstanceSnippet>
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: config.appId,
    redirectUri: config.redirectUri
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: true
  }
});

// Check if there are already accounts in the browser session
// If so, set the first account as the active account
const accounts = msalInstance.getAllAccounts();
if (accounts && accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    // Set the active account - this simplifies token acquisition
    const authResult = event.payload;
    msalInstance.setActiveAccount(authResult.account);
  }
});
// </MsalInstanceSnippet>

// Create async component
const AsyncMainView = makeLoadableComponent(() => import("./components/MainView"));

function App(props) {
  const { classes, authenticated } = props;
  const { i18n } = useTranslation();
  const dispatch = useTypeDispatch();

  useEffect(() => {
    const lang = localStorage.getItem("lang");
    if (lang) {
      i18n.changeLanguage(lang);
      dispatch(changeSettings("language", lang));
    }
  }, [])

  const routesProps = {
    authenticated,
  };
  return (
    <MsalProvider instance={msalInstance}>
      <ProvideAppContext>
        <div className={classes.root}>
          <CssBaseline />
          <TopBar />
          <AsyncMainView
            classes={classes}
            routesProps={routesProps}
          />
          <GAB />
        </div>
      </ProvideAppContext>
    </MsalProvider>
  );
}

App.propTypes = {
  dispatch: PropTypes.func.isRequired,
  authenticated: PropTypes.bool,
}

const mapStateToProps = (state) => {
  const { authenticated } = state.auth;

  return {
    authenticated,
  };
};

export default connect(mapStateToProps)(
  withStyles(styles)(App));
