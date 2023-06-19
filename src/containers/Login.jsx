// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useState } from 'react';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import {
  Paper,
  Button,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import background from '../res/bootback.svg';
import logo from '../res/grommunio_logo_default.svg';
import { Translate } from '@mui/icons-material';
import { getLangs } from '../utils';
import { withRouter } from '../components/hocs/withRouter';
import { changeSettings } from '../actions/settings';
import { useAppContext } from '../azure/AppContext';
import { useDispatch, useSelector } from 'react-redux';

const styles = theme => ({
  /* || General */
  root: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto',
    zIndex: 10,
  },
  /* || Login Form */
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    maxWidth: 450,
    background: 'rgba(250, 250, 250, 0.9)',
    borderRadius: 30,
    zIndex: 1,
    padding: theme.spacing(1, 0),
    position: 'relative',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(1, 0),
  },
  button: {
    width: '100%',
    borderRadius: 10,
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'Center',
    maxWidth: '100%',
    borderRadius: 10,
    margin: theme.spacing(1, 2, 1, 2),
  },
  input: {
    margin: theme.spacing(1, 1, 1, 0),
  },
  inputAdornment: {
    margin: theme.spacing(1, 1, 1, 1),
  },
  errorMessage: {
    margin: theme.spacing(1, 2, 0, 2),
  },
  logo: {
    padding: 12,
    backgroundColor: 'black',
    borderRadius: 12,
  },
  background: {
    backgroundSize: 'cover',
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 0,
  },
  loader: {
    color: 'white',
  },
  lang: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});


const Login = ({ classes }) => {
  const app = useAppContext();
  const settings = useSelector(state => state.settings);
  const [langsAnchorEl, setLangsAnchorEl] = useState(null);
  const dispatch = useDispatch();

  const handleLogin = e => {
    e.preventDefault();
    app.signIn();
  }

  const handleMenuOpen = e => setLangsAnchorEl(e.currentTarget);

  const handleMenuClose = () => setLangsAnchorEl(null);

  const handleLangChange = lang => () => {
    dispatch(changeSettings('language', lang));
    window.localStorage.setItem('lang', lang);
    handleMenuClose();
  }

  return (
    <div className={classes.root}>
      <Paper elevation={3} className={classes.loginForm} component="form" onSubmit={handleLogin}>
        <Tooltip title="Language">
          <IconButton className={classes.lang} onClick={handleMenuOpen}>
            <Translate />
          </IconButton>
        </Tooltip>
        <Menu
          id="lang-menu"
          anchorEl={langsAnchorEl}
          keepMounted
          open={Boolean(langsAnchorEl)}
          onClose={handleMenuClose}
        >
          {getLangs().map(({key, value}) =>
            <MenuItem
              selected={settings?.language === key}
              value={key}
              key={key}
              onClick={handleLangChange(key)}
            >
              {value}
            </MenuItem>  
          )}
        </Menu>
        <div className={classes.logoContainer}>
          <img
            src={logo}
            height={64}
            alt="grommunio"
          />
        </div>
        <Paper className={classes.inputContainer}>
          <Button
            className={classes.button}
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleLogin}
          >
            <Typography>{('Login')}</Typography>
          </Button>
        </Paper>
      </Paper>
      <div
        className={classes.background}
        style={{
          backgroundImage: 'url(' + (background) + ')',
        }}
      ></div>
    </div>
  );
  
}

Login.propTypes = {
  classes: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
};


export default withRouter(withStyles(styles)(Login));
