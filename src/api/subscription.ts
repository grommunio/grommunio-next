import { Subscription } from "microsoft-graph";
import { getGraphClient } from "./utils";


export async function postSubscription(): Promise<Subscription> {

  const subscription = {
    changeType: 'created',
    notificationUrl: 'https://webhook.azurewebsites.net/api/send/myNotifyClient',
    resource: 'me/messages',
    expirationDateTime: '2023-11-20T18:23:45.9356913Z',
  };

  const response = await getGraphClient()?.api('/subscriptions')
    .post(subscription);

  return response.value;
}