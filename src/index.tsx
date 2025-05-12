// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';
import './i18n';
import AppThemeProvider from './components/ThemeContext';
import makeLoadableComponent from './lazy';
import AppLoader from './components/AppLoader';
import { loadConfig } from './config';
import { createMsalInstance } from './azure/msal';

const AsyncApp = makeLoadableComponent(() => import("./App"), <AppLoader />);

async function bootstrap() {
  const config = await loadConfig();
  await createMsalInstance(config);

  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  root.render(
    <Provider store={store}>
      <StyledEngineProvider injectFirst>
        <AppThemeProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AsyncApp />
          </BrowserRouter>
        </AppThemeProvider>
      </StyledEngineProvider>
    </Provider>
  );
}

bootstrap();
