# Coding assignment

This coding assignment should take about 4-8 hours.
The topic is the typescript react app [`grommunio-next`](https://github.com/grommunio/grommunio-next) that utilizes the [Microsoft Graph API](https://developer.microsoft.com/en-us/graph/graph-explorer).
Accordingly, it is a future replacement for Microsoft Outlook and/or grommunio-web.

The app is currently in a pre-alpha state that only includes some mail operations and basic CRUD operations for Calendar, Contacts, Tasks and Notes.
We are currently trying to replicate [Outlook Live](https://outlook.live.com)'s look and feel.
You need to create a Microsoft account, if you haven't already, to use Outlook Live and _also_ `grommunio-next`.

## Development setup


You can simply follow the instructions in the [README](https://github.com/grommunio/grommunio-next/blob/master/README.md) of the project.
Note that you do not need to create a new Azure app.
Our development app's `appId` is `de5267b8-6fcd-48b3-8071-79364613549a`.

After a successful setup, you can log into your microsoft account in the login page with an OAuth-iFrame by Microsoft.
If everything worked, you should see a welcome-message in the menu of the webapp.

## Tasks

If you are comfortable with TypeScript, use it as much as possible.
Otherwise, only redux actions/thunks (`src/actions`) and api request functions (`src/api`) are required to be written in TS.
Note that we are also new to TypeScript (and the new Redux thunk API), so feel free to improve any unconventional implementations you find.

### Must

- Mail
  - When writing a new email, it is currently only possible to set the recipients, subject and mailbody.
    Implement CC and BCC textfields as well.
  - When writing a new email, implement the possibility to mark an email as "High importance".

- Calendar
  - In addition to the week and month view, add a day-view as well. It has be possible to dynamically switch between them.
    You should use the Action-Bar (the Paper which currently only holds the `New event` button) for these types of interactions.
    There is another button which enables the toggle between these views. Ignore or remove it, and replicate the View-Buttons from Outlook-live.
  - On the left of the scheduler, add a small calendar as well (just like in Outlook Live).
  - This small calendar needs to be retractable like the Mail-Folders in the Mails view (by clicking the Menu-Icon on the left in the action bar).
  - When loading the calendar view fetch the user's available calendars using [this](https://graph.microsoft.com/v1.0/me/calendars) request.
    Implement the full callstack. (component mount -> redux action -> api call -> update redux reducer with received data)


### Optional

- List the user's calendars (the one you have written a request for) below the new small calendar.
- The scheduler always needs to flex to the full width and full height (compare with Mails view).
- Add a darkmode for TinyMCE, the mail-editor (in `src/components/MessagePaper`).
  Also add this darkmode to all other locations TinyMCE is used.
- Find a way to sort mail folders like in outlook (e.g. Inbox at the top). Note that the names of the folders change depending on the mailbox language.


## Publishing results

We assume you are comfortable with the usage of `git`.
To turn in your code:
- fork the repository
- create a new branch
- push your commit(s)
- open a pull request in our repository