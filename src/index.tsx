// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';
import i18n from './i18n';
import AppThemeProvider from './components/ThemeContext';
import makeLoadableComponent from './lazy';
import AppLoader from './components/AppLoader';
import { loadConfig } from './config';
import { createMsalInstance } from './azure/msal';

const AsyncApp = makeLoadableComponent(() => import("./App"), <AppLoader />);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const BootstrapError = ({ error }: { error: unknown }) => (
  <div role="alert" style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '15vh auto', padding: 24, lineHeight: 1.5 }}>
    <h1 style={{ fontSize: 22, fontWeight: 600 }}>{i18n.t("The application could not be started")}</h1>
    <p>{i18n.t("The configuration or the sign-in service could not be initialised. Please contact your administrator.")}</p>
    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, padding: 12, background: 'rgba(127,127,127,0.12)', borderRadius: 4 }}>
      {error instanceof Error ? error.message : String(error)}
    </pre>
    <button type="button" onClick={() => window.location.reload()} style={{ fontSize: 14, padding: '6px 16px', cursor: 'pointer' }}>
      {i18n.t("Reload")}
    </button>
  </div>
);

async function bootstrap() {
  const config = await loadConfig();
  await createMsalInstance(config);

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

bootstrap().catch(error => {
  console.error("Bootstrap failed", error);
  root.render(<BootstrapError error={error} />);
});
