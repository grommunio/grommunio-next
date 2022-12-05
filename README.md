# Set up for development

1. Clone this repository
2. Open root folder in terminal
3. `yarn install && npm run postinstall`
4. `cp src/azure/Config.example.ts src/azure/Config.ts`
5. Follow the app registration tutorial at https://learn.microsoft.com/en-us/graph/tutorials/typescript?tabs=aad&tutorial-step=1
5. Change `appId` of `config` in `src/azure/Config.ts` to the client ID of your azure app
6. `yarn start` to run the app
7. ???
8. Profit
