// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './App.css';
import { MsalProvider } from '@azure/msal-react';
import { getMsalInstance } from './azure/msal';
import ProvideAppContext from './azure/AppContext';
import { withStyles } from '@mui/styles';
import { connect } from 'react-redux';
import makeLoadableComponent from './lazy';
import TopBar from './components/TopBar';
import { useTranslation } from 'react-i18next';
import { useTypeDispatch } from './store';
import { changeSettings, fetchMailboxSettingsData } from './actions/settings';
import { CssBaseline } from '@mui/material';
import background from "!file-loader!./res/background_light.svg";
import backgroundDark from "!file-loader!./res/background_dark.svg";
import AlertStack from './components/AlertStack';

const styles = {
  root: {
    display: "flex",
    flexDirection: 'column',
    flex: 1,
    overflow: "hidden",
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
    marginTop: 64, // Topbar
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }
};


// Create async component
const AsyncMainView = makeLoadableComponent(() => import("./components/MainView"));

function App(props) {
  const { classes, authenticated } = props;
  const { i18n } = useTranslation();
  const dispatch = useTypeDispatch();

  useEffect(() => {
    const applyLanguage = async () => {
      // Mailbox settings win over the locally stored preference
      const settings = authenticated ? await dispatch(fetchMailboxSettingsData()) : null;
      const lang = settings?.language?.locale || localStorage.getItem("lang");
      if (lang) {
        i18n.changeLanguage(lang);
        dispatch(changeSettings("language", lang));
      }
    };
    applyLanguage();
  }, [authenticated]);

  const routesProps = {
    authenticated,
  };

  const darkMode = window.localStorage.getItem("darkMode");
  return (
    <MsalProvider instance={getMsalInstance()}>
      <ProvideAppContext>
        <div
          className={classes.root}
          style={{
            backgroundImage: `url(${darkMode === "true" ? backgroundDark : background})`,
          }}
        >
          <CssBaseline />
          {authenticated && <TopBar />}
          <AsyncMainView
            classes={classes}
            routesProps={routesProps}
          />
          <AlertStack />
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
