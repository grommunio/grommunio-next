// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { PropTypes } from "prop-types";

import { parseParams } from '../utils';
import { Navigate } from "react-router-dom";

/**
 * react-router <Route> which can be accessed if not authenticated
 * 
 * @param {Object} props
 */
const UnauthenticatedRoute = ({ component: C, childProps, ...rest }) => {
  // Get redirect url parameter
  const { redirect } = parseParams(window.location.search.substr(1));
  const hash = window.location.hash;

  if(childProps.authenticated) {
    return <Navigate to={!redirect ? "/" : redirect + hash}/>
  }

  return (
    <C {...childProps} {...rest}/>
  );
};

UnauthenticatedRoute.propTypes = {
  props: PropTypes.object,
}

export default UnauthenticatedRoute;
