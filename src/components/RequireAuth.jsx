// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';


function RequireAuth({ children }) {
  const auth = useSelector((state) => state.auth);
  return auth.authenticated ? children : <Navigate to="/login" />;
}

export default RequireAuth;