// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import makeLoadableComponent from "./lazy";

function makeAuthenticatedElement(AsyncComponent, childProps) {
  return <RequireAuth>
    <AsyncComponent {...childProps}/>
  </RequireAuth>
}

// Create async components
const AsyncLogin = makeLoadableComponent(() => import("./containers/Login"));
const AsyncMenu = makeLoadableComponent(() => import("./containers/Menu"));
const AsyncMessages = makeLoadableComponent(() => import("./containers/Messages"));
const AsyncNewMessage = makeLoadableComponent(() => import("./containers/NewMessage"));
const AsyncCalendar = makeLoadableComponent(() => import("./containers/Calendar"));
const AsyncTasks =  makeLoadableComponent(() => import('./containers/Tasks'));
const AsyncContacts =  makeLoadableComponent(() => import('./containers/Contacts'));
const AsyncNotes =  makeLoadableComponent(() => import('./containers/Notes'));


const AppRoutes = ({ childProps }) => (
  <Routes>
    <Route
      path="/login"
      element={<AsyncLogin {...childProps}/>}
    />
    <Route
      path="/"
      element={makeAuthenticatedElement(AsyncMenu, childProps)}
    />
    <Route
      path="/messages"
      element={makeAuthenticatedElement(AsyncMessages, childProps)}
    />
    <Route
      path="/newMessage"
      element={makeAuthenticatedElement(AsyncNewMessage, childProps)}
    />
    <Route
      path="/calendar"
      element={makeAuthenticatedElement(AsyncCalendar, childProps)}
    />
    <Route
      path="/tasks"
      element={makeAuthenticatedElement(AsyncTasks, childProps)}
    />
    <Route
      path="/contacts"
      element={makeAuthenticatedElement(AsyncContacts, childProps)}
    />
    <Route
      path="/notes"
      element={makeAuthenticatedElement(AsyncNotes, childProps)}
    />
  </Routes>
);

export default AppRoutes;
