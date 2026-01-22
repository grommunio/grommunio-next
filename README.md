# grommunio Next

![project license](https://img.shields.io/badge/license-AGPL--3.0-orange)
[![latest version](https://shields.io/github/v/tag/grommunio/grommunio-next)](https://github.com/grommunio/grommunio-next/tags)
[![code size](https://img.shields.io/github/languages/code-size/grommunio/grommunio-next)](https://github.com/grommunio/grommunio-next)

grommunio Next is an open source web client for mail, calendar, contacts,
tasks and notes that speaks the Microsoft Graph API. It runs against
Microsoft 365 / Outlook.com today and is built so that any Graph compatible
backend can be configured instead of a rebuild.

**grommunio Next is under active development. Treat it as a preview.**

## Features

- **Mail**: three pane layout, folder tree with favorites and drag and drop,
  grouped message list with filters, sorting, pinning and multi selection,
  Focused/Other, sanitised reading pane with inline images and attachment
  preview, meeting invitations with accept/tentative/decline, compose with
  recipient suggestions, attachments (incl. large files), autosaved drafts,
  signatures, categories, undo for move/delete, keyboard shortcuts, folder sync
  via delta queries and desktop notifications.
- **Calendar**: day, work week, week, month and agenda views, multiple
  calendars with colors, drag and drop and resizing, event editor with
  attendees, availability, recurrence, reminders, categories, attachments and
  response tracking, RSVP, calendar sharing.
- **People**: contact folders, contact cards, editor with photo, CSV and vCard
  import/export.
- **Tasks**: lists, steps, due dates, reminders, repeat, importance.
- **Notes**: colored notes with autosave.
- **Settings**: appearance (light/dark/system, accent colors), language and
  time zone, notifications, categories, mail layout, signature, inbox rules,
  automatic replies, calendar working hours.
- 22 interface languages (English and German complete, others via Weblate).

## Getting started

Requirements: Node.js 20 or newer and Yarn 1.

```sh
yarn install
cp public/config.example.json public/config.json
# set appId to the client id of your app registration
yarn start
```

Register an application in Microsoft Entra (see the
[Graph tutorial](https://learn.microsoft.com/en-us/graph/tutorials/typescript?tabs=aad&tutorial-step=1))
with `http://localhost:3000` as a *Single-page application* redirect URI. The
app requests the delegated permissions `User.Read`, `MailboxSettings.ReadWrite`,
`Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `Contacts.ReadWrite`,
`Tasks.ReadWrite` and `People.Read`.

## Configuration

The build is a static bundle. Everything that differs between deployments is
read from `config.json` next to `index.html` when the application starts:

| Key               | Description                                                             |
|-------------------|-------------------------------------------------------------------------|
| `appId`           | Client ID of the app registration                                       |
| `authority`       | Sign-in authority (default `https://login.microsoftonline.com/common`)  |
| `redirectUri`     | Redirect URI registered for the SPA (default: current origin)           |
| `scopes`          | Scopes requested at sign-in (optional)                                  |
| `graphBaseUrl`    | Graph endpoint (default `https://graph.microsoft.com/`)                 |
| `graphVersion`    | Graph API version (default `v1.0`)                                      |
| `interactionType` | `redirect` (default) or `popup`                                         |

## Deployment

`yarn build` writes the bundle to `build/`. Serve it with any web server, let
unknown paths fall back to `index.html` and place a `config.json` next to it.
`deploy/` contains an nginx server block example; the `Dockerfile` builds an
image that serves the bundle with nginx:

```sh
docker build -t grommunio-next .
docker run -p 8080:80 -v $PWD/config.json:/usr/share/nginx/html/config.json grommunio-next
```

## Development

```sh
yarn dev          # development server on http://localhost:3000
yarn typecheck    # tsc
yarn lint         # eslint
yarn test         # vitest
yarn build        # typecheck + production build
```

Source layout: `src/api` (Graph access), `src/features/<module>` (Redux slice
and components per module), `src/components` (shell and shared UI),
`src/i18n` (translations). `scripts/extractTranslations.py` collects
translation keys from the sources into the locale files.

## Support

- Commercial support: [grommunio GmbH](https://grommunio.com) and partners.
- Community: [grommunio Community](https://community.grommunio.com)
- Security contact: [dev@grommunio.com](mailto:dev@grommunio.com)

## Translators

Translations are managed on
[Weblate](https://hosted.weblate.org/projects/grommunio/grommunio-next/).

## License

GNU Affero General Public License v3, see [LICENSE](LICENSE). Bundled third
party components keep their own licenses; see `yarn.lock` for the list.
