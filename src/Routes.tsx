// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import makeLoadableComponent from "./lazy";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import { useTypeSelector } from "./store";

const AsyncLogin = makeLoadableComponent(() => import("./containers/Login"));
const AsyncMail = makeLoadableComponent(() => import("./features/mail/components/MailView"));
const AsyncCalendar = makeLoadableComponent(() => import("./features/calendar/components/CalendarView"));
const AsyncTasks = makeLoadableComponent(() => import('./containers/Tasks'));
const AsyncContacts = makeLoadableComponent(() => import('./containers/Contacts'));
const AsyncContact = makeLoadableComponent(() => import('./containers/Contact'));
const AsyncNotes = makeLoadableComponent(() => import('./containers/Notes'));

const authenticated = (element: JSX.Element) => <RequireAuth>{element}</RequireAuth>;

const AppRoutes = () => {
  const isAuthenticated = useTypeSelector(state => state.auth.authenticated);
  return (
    <Routes>
      <Route path="/login" element={<UnauthenticatedRoute component={AsyncLogin} childProps={{ authenticated: isAuthenticated }} />} />
      <Route path="/" element={<Navigate to="/mail" replace />} />
      <Route path="/mail/:folder?/:messageId?" element={authenticated(<AsyncMail />)} />
      <Route path="/calendar/:view?/:date?" element={authenticated(<AsyncCalendar />)} />
      <Route path="/tasks/*" element={authenticated(<AsyncTasks />)} />
      <Route path="/contacts" element={authenticated(<AsyncContacts />)} />
      <Route path="/contacts/:contactId" element={authenticated(<AsyncContact />)} />
      <Route path="/notes/*" element={authenticated(<AsyncNotes />)} />
      <Route path="*" element={<Navigate to="/mail" replace />} />
    </Routes>
  );
};

export default AppRoutes;
