import { pushAlertStack } from "./alerts";

export function defaultPostHandler(endpoint, actionType, ...endpointProps) {
  return async (dispatch) => {
    try {
      const data = await endpoint(...endpointProps);
      if(actionType) await dispatch({ type: actionType, payload: data });
      await dispatch(pushAlertStack());
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
      await dispatch(pushAlertStack());
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
      if(!suppressAlert) await dispatch(pushAlertStack());
      return resp;
    } catch(error) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  };
}