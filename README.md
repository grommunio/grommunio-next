# grommunio Next

![project license](https://img.shields.io/badge/license-AGPL--3.0-orange)
[![latest version](https://shields.io/github/v/tag/grommunio/grommunio-next)](https://github.com/grommunio/grommunio-next/tags)
[![code size](https://img.shields.io/github/languages/code-size/grommunio/grommunio-next)](https://github.com/grommunio/grommunio-next)
[![twitter](https://img.shields.io/twitter/follow/grommunio?style=social)](https://twitter.com/grommunio)

grommunio Next is the first open source Graph API web application ([https://learn.microsoft.com/en-us/graph/overview](https://learn.microsoft.com/en-us/graph/overview)) to provide all the familiar email, advanced calendaring and contact features you need to be productive. It is the future main web application for access to your productivity workspace, including email, calendar, contacts, tasks, notes and more.

**Important: grommunio Next is still under heavy development and not yet recommended for production use.**

<details open="open">
<summary>Overview</summary>

- [About](#about)
- [Getting Started](#getting-started)
- [Status](#status)
- [Support](#support)
- [Project assistance](#project-assistance)
- [Development](#development)
  - [Setup development environment](#setup-development-environment)
- [Translators](#translators)
- [License](#license)

</details>

---

## About grommunio Next

- Provides modern web-based groupware (emails, contacts, calendar, tasks and notes) connectivity
- Authentication based on OAuth 2.0
- Modern Typescript/React 18-based framework 
- Design based on well-defined industry standards (MUI 5)
- Compatible, works with any modern web browser such as Chrome, Edge, Firefox, Safari and others
- Component-based architecture, no dependencies to runtime backend components
- Modern, feature-rich TinyMCE-based editor (6.3+)
- Easy to use, with an intuitive user interface 
- Scalable, capable of running with tens of thousands of sessions concurrently
- Security driven development, with clear API abstraction 

### Roadmap

- Multiple Account support (multiple Graph API endpoints)
- Feature-list on-par with grommunio Web
- Plugin architecture
- Native integration with extensions integrating grommunio Meet, Chat, Archive and more
- Mobile enhancements

## Getting Started

## Status

- [Top Feature Requests](https://github.com/grommunio/grommunio-next/issues?q=label%3Aenhancement+is%3Aopen+sort%3Areactions-%2B1-desc) (Add your votes using the 👍 reaction)
- [Top Bugs](https://github.com/grommunio/grommunio-next/issues?q=is%3Aissue+is%3Aopen+label%3Abug+sort%3Areactions-%2B1-desc) (Add your votes using the 👍 reaction)
- [Newest Bugs](https://github.com/grommunio/grommunio-next/issues?q=is%3Aopen+is%3Aissue+label%3Abug)

## Support

- Support is available through [grommunio GmbH](https://grommunio.com) and its partners.
- grommunio Next community is available here: [grommunio Community](https://community.grommunio.com)

For direct contact to the maintainers (for example to supply information about a security-related responsible disclosure), you can contact grommunio directly at [dev@grommunio.com](mailto:dev@grommunio.com)

## Project assistance

If you want to say thank you or/and support active development of grommunio Next:

- Add a [GitHub Star](https://github.com/grommunio/grommunio-next) to the project.
- Tweet about grommunio Next.
- Write interesting articles about the project on [Dev.to](https://dev.to/), [Medium](https://medium.com/), your personal blog or any medium you feel comfortable with.

Together, we can make grommunio Next better!

## Development

### Setup development environment

1. Clone this repository
2. Move to root folder
3. `yarn install` (copies the TinyMCE distribution into `public/tinymce`)
4. `cp public/config.example.json public/config.json`
5. Register an application as described in https://learn.microsoft.com/en-us/graph/tutorials/typescript?tabs=aad&tutorial-step=1
   and add `http://localhost:3000` as a *Single-page application* redirect URI
6. Set `appId` in `public/config.json` to the client ID of your app registration
7. `yarn start` to run the app

### Configuration

The build is a static bundle. All deployment specific settings are read from
`config.json` next to `index.html` when the application starts:

| Key               | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `appId`           | Client ID of the app registration                                 |
| `authority`       | Sign-in authority (default `https://login.microsoftonline.com/common`) |
| `redirectUri`     | Redirect URI registered for the SPA (default: current origin)     |
| `scopes`          | Scopes requested at sign-in (optional, sensible defaults)         |
| `graphBaseUrl`    | Graph endpoint (default `https://graph.microsoft.com/`)           |
| `graphVersion`    | Graph API version (default `v1.0`)                                |
| `interactionType` | `redirect` (default) or `popup`                                   |

### Deployment

`yarn build` creates the bundle in `build/`. Serve the folder with any web
server, make sure unknown paths fall back to `index.html` (client side
routing) and place a `config.json` next to it.

## Translators

The translations are managed by [Weblate](https://hosted.weblate.org/projects/grommunio/grommunio-next/). Contributions are regularly monitored and integrated in the release cycles of grommunio Next.

## License

This project is licensed under the GNU Affero General Public License v3.

See [LICENSE](LICENSE) for more information.

grommunio Next uses several components with different licensing and bundles them within the build process. Please see the respective [package-lock.json](package-lock.json) for detailed information.
