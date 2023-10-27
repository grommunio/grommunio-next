// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';
import './i18n';
import ToggleColorMode from './components/ToggleColorMode';
import makeLoadableComponent from './lazy';
import AppLoader from './components/AppLoader';

const AsyncApp = makeLoadableComponent(() => import("./App"), <AppLoader />);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Provider store={store}>
    <StyledEngineProvider injectFirst>
      <ToggleColorMode>
        <BrowserRouter basename='' /* TODO: This will be configurable in the future */>
          <AsyncApp />
        </BrowserRouter>
      </ToggleColorMode>
    </StyledEngineProvider>
  </Provider>
);
