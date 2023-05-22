// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PureComponent } from 'react';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import {
  Paper,
  Button,
  InputBase,
  Typography,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Key from '@mui/icons-material/VpnKey';
import background from '../res/bootback.svg';
import logo from '../res/grommunio_logo_default.svg';
import { Translate } from '@mui/icons-material';
import { getLangs } from '../utils';
import { connect } from 'react-redux';
import { authLogin } from '../actions/auth';
import { withRouter } from '../components/hocs/withRouter';

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


class Login extends PureComponent {

  state = {
    user: '',
    pass: '',
    loading: false,
    langsAnchorEl: null,
  }

  handleTextinput = field => e => {
    this.setState({
      [field]: e.target.value,
    });
  }

  handleLogin = event => {
    const { authLogin, router } = this.props;
    const { user, pass } = this.state;
    event.preventDefault();
    this.setState({ loading: true });
    authLogin(user, pass)
      .then(() => router.navigate('/'))
      .catch(err => {
        this.setState({ loading: false });
        console.error(err);
      });
  }

  handleMenuOpen = menu => e => this.setState({
    [menu]: e.currentTarget,
  });

  handleMenuClose = menu => () => this.setState({
    [menu]: null,
  });

  handleLangChange = lang => () => {
    const { changeSettings } = this.props;
    // Set language in i18n, redux store and local storage
    // i18n.changeLanguage(lang);
    changeSettings('language', lang);
    window.localStorage.setItem('lang', lang);
    this.setState({
      langsAnchorEl: null,
    });
  }

  render() {
    const { classes, settings } = this.props;
    const { user, pass, loading, langsAnchorEl } = this.state;    

    return (
      <div className={classes.root}>
        <Paper elevation={3} className={classes.loginForm} component="form" onSubmit={this.handleLogin} >
          <Tooltip title="Language">
            <IconButton className={classes.lang} onClick={this.handleMenuOpen('langsAnchorEl')}>
              <Translate />
            </IconButton>
          </Tooltip>
          <Menu
            id="lang-menu"
            anchorEl={langsAnchorEl}
            keepMounted
            open={Boolean(langsAnchorEl)}
            onClose={this.handleMenuClose('langsAnchorEl')}
          >
            {getLangs().map(({key, value}) =>
              <MenuItem
                selected={settings?.language === key}
                value={key}
                key={key}
                onClick={this.handleLangChange(key)}
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
            <AccountCircle className={classes.inputAdornment}/>
            <InputBase
              fullWidth
              autoFocus
              //error={!!auth.error}
              className={classes.input}
              placeholder={("Username")}
              value={user}
              onChange={this.handleTextinput('user')}
              name="username"
              id="username"
              autoComplete="username"
            />
          </Paper>
          <Paper className={classes.inputContainer}>
            <Key className={classes.inputAdornment}/>
            <InputBase
              fullWidth
              type="password"
              className={classes.input}
              //error={!!auth.error}
              placeholder={("Password")}
              value={pass}
              onChange={this.handleTextinput('pass')}
              name="password"
              id="password"
              autoComplete="currect-password"
            />
          </Paper>
          {/*auth.error && <Alert elevation={6} variant="filled" severity="error" className={classes.errorMessage}>
            {auth.error || ("Failed to login. Incorrect password or username")}
    </Alert>*/}
          <Paper className={classes.inputContainer}>
            <Button
              className={classes.button}
              type="submit"
              variant="contained"
              color="primary"
              onClick={this.handleLogin}
              disabled={!user || !pass}
            >
              {loading ? <CircularProgress size={24}  color="inherit" className={classes.loader}/> :
                <Typography>{('Login')}</Typography>}
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
}

Login.propTypes = {
  classes: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  authLogin: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  const { auth } = state;
  return {
    auth,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    authLogin: async (user, pass) => {
      await dispatch(authLogin(user, pass));
    },
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(
    withStyles(styles)(Login)));
