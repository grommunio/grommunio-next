// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { pushAlertStack } from "./alerts";

export function defaultPostHandler(endpoint, actionType, ...endpointProps) {
  return async (dispatch) => {
    try {
      const dataProps = [...endpointProps]
      const data = await endpoint(...endpointProps);
      if(actionType) await dispatch({ type: actionType, payload: data ? data : dataProps });
      await dispatch(pushAlertStack({message:"created successfully"}));
      return data;
    } catch (error) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  }
}

export function defaultFetchHandler(endpoint, actionType, ...endpointProps) {
  return async (dispatch) => {
    try {
      const data = await endpoint(...endpointProps);
      if(actionType) await dispatch({ type: actionType, payload: data });
      return data;
    } catch (error) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  }
}

export function defaultDeleteHandler(endpoint, actionType, id, ...endpointProps) {
  return async (dispatch) => {
    try {
      await endpoint(id, ...endpointProps);
      if(actionType) await dispatch({ type: actionType, payload: id });
      await dispatch(pushAlertStack({message:"deleted successfully"}));
      return true;
    } catch (error) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  }
}

export function defaultPatchHandler(endpoint, actionType, suppressAlert, ...endpointParams) {
  return async dispatch => {
    try {
      const resp = await endpoint(...endpointParams);
      if(actionType) await dispatch({ type: actionType, payload: resp });
      if(suppressAlert) await dispatch(pushAlertStack({message:"updated successfully"}));
      return resp;
    } catch(error) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  };
}

export function defaultMultiMailHandler(endpoint, actionType, messages, ...endpointParams) {
  return async dispatch => {
    const succ = [];
    let failure = false;
    for(let i = 0; i < messages.length; i++) {
      const id = messages[i].id;
      try {
        await endpoint(id, ...endpointParams);
        succ.push(id);
      } catch(error) {
        failure = true;
        dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      }
    }
    if(actionType) await dispatch({ type: actionType, payload: succ });
    if(!failure) await dispatch(pushAlertStack());
    return !failure;
  };
}