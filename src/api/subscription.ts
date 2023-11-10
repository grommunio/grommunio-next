import { Subscription } from "microsoft-graph";
import { graphClient } from "./utils";


export async function postSubscription(): Promise<Subscription> {

  const subscription = {
    changeType: 'created',
    notificationUrl: 'https://webhook.azurewebsites.net/api/send/myNotifyClient',
    resource: 'me/messages',
    expirationDateTime: '2023-11-20T18:23:45.9356913Z',
  };

  const response = await graphClient!
    .api('/subscriptions')
    .post(subscription);

  return response.value;
}