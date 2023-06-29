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