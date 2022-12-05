// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './App.css';
import { parseParams } from './utils';
import { MsalProvider } from '@azure/msal-react';
import config from './azure/Config';
import { EventType, PublicClientApplication } from '@azure/msal-browser';
import ProvideAppContext from './azure/AppContext';
import { withStyles } from '@mui/styles';
import MainView from './components/MainView';
import { connect } from 'react-redux';

const styles = {
  root: {
    display: "flex",
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

class App extends PureComponent {

  async componentDidMount() {
    const query = parseParams(window.location.search.substr(1));
    const redirect = query.redirect;
    if(redirect) {
      //window.localStorage.setItem("pathname", redirect);
    }
  }

  render() {
    const { classes, authenticated } = this.props;
    const routesProps = {
      authenticated,
    };

    return (
      <MsalProvider instance={msalInstance}>
        <ProvideAppContext>
          <div className={classes.root}>
            <MainView
              classes={classes}
              routesProps={routesProps}
            />
          </div>
        </ProvideAppContext>
      </MsalProvider>
    );
  }
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
