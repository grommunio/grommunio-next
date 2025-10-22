// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/common/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import makeLoadableComponent from "./lazy";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";

const AsyncLogin = makeLoadableComponent(() => import("./containers/Login"));
const AsyncMail = makeLoadableComponent(() => import("./features/mail/components/MailView"));
const AsyncCalendar = makeLoadableComponent(() => import("./features/calendar/components/CalendarView"));
const AsyncTasks = makeLoadableComponent(() => import('./features/tasks/components/TasksView'));
const AsyncContacts = makeLoadableComponent(() => import('./features/contacts/components/PeopleView'));
const AsyncNotes = makeLoadableComponent(() => import('./features/notes/components/NotesView'));

const AppRoutes = () => {
  const location = useLocation();
  // Reset per module so one broken view doesn't block the others
  const module = location.pathname.split("/")[1] || "mail";
  const authenticated = (element: JSX.Element) => (
    <RequireAuth>
      <ErrorBoundary resetKey={module}>{element}</ErrorBoundary>
    </RequireAuth>
  );
  return (
    <Routes>
      <Route path="/login" element={<UnauthenticatedRoute><AsyncLogin /></UnauthenticatedRoute>} />
      <Route path="/" element={<Navigate to="/mail" replace />} />
      <Route path="/mail/:folder?/:messageId?" element={authenticated(<AsyncMail />)} />
      <Route path="/calendar/:view?/:date?" element={authenticated(<AsyncCalendar />)} />
      <Route path="/tasks/:listId?/:taskId?" element={authenticated(<AsyncTasks />)} />
      <Route path="/contacts/:folder?/:contactId?" element={authenticated(<AsyncContacts />)} />
      <Route path="/notes/:noteId?" element={authenticated(<AsyncNotes />)} />
      <Route path="*" element={<Navigate to="/mail" replace />} />
    </Routes>
  );
};

export default AppRoutes;
