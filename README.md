# grommunio Web 2.0

![project license](https://img.shields.io/badge/license-AGPL--3.0-orange)
[![latest version](https://shields.io/github/v/tag/grommunio/grommunio-web-2.0)](https://github.com/grommunio/grommunio-web-2.0/tags)
[![code size](https://img.shields.io/github/languages/code-size/grommunio/grommunio-web-2.0)](https://github.com/grommunio/grommunio-web-2.0)
[![twitter](https://img.shields.io/twitter/follow/grommunio?style=social)](https://twitter.com/grommunio)

grommunio Web 2.0 is the first open source Graph API web application ([https://learn.microsoft.com/en-us/graph/overview](https://learn.microsoft.com/en-us/graph/overview)) to provide all the familiar email, advanced calendaring and contact features you need to be productive. It is the future main web application for access to your productivity workspace, including email, calendar, contacts, tasks, notes and more.

**Important: grommunio Web 2.0 is still under heavy development - it is planned for production release in 2023.**

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

## About grommunio Web 2.0

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
- Feature-list on-par with grommunio-Web
- Plugin architecture
- Native integration with extensions integrating grommunio Meet, Chat, Archive and more
- Mobile enhancements

## Getting Started

## Status

- [Top Feature Requests](https://github.com/grommunio/grommunio-web-2.0/issues?q=label%3Aenhancement+is%3Aopen+sort%3Areactions-%2B1-desc) (Add your votes using the 👍 reaction)
- [Top Bugs](https://github.com/grommunio/grommunio-web-2.0/issues?q=is%3Aissue+is%3Aopen+label%3Abug+sort%3Areactions-%2B1-desc) (Add your votes using the 👍 reaction)
- [Newest Bugs](https://github.com/grommunio/grommunio-web-2.0/issues?q=is%3Aopen+is%3Aissue+label%3Abug)

## Support

- Support is available through [grommunio GmbH](https://grommunio.com) and its partners.
- grommunio Web community is available here: [grommunio Community](https://community.grommunio.com)

For direct contact to the maintainers (for example to supply information about a security-related responsible disclosure), you can contact grommunio directly at [dev@grommunio.com](mailto:dev@grommunio.com)

## Project assistance

If you want to say thank you or/and support active development of grommunio Web:

- Add a [GitHub Star](https://github.com/grommunio/grommunio-web-2.0) to the project.
- Tweet about grommunio Web.
- Write interesting articles about the project on [Dev.to](https://dev.to/), [Medium](https://medium.com/), your personal blog or any medium you feel comfortable with.

Together, we can make grommunio Web 2.0 better!

## Development

### Setup development environment

1. Clone this repository
2. Move to root folderl
3. `yarn install && npm run postinstall`
4. `cp src/azure/Config.example.ts src/azure/Config.ts`
5. Follow the app registration tutorial at https://learn.microsoft.com/en-us/graph/tutorials/typescript?tabs=aad&tutorial-step=1
6. Change `appId` of `config` in `src/azure/Config.ts` to the client ID of your azure app
7. `yarn start` to run the app
8. ???
9. Profit

## Translators

The translations are managed by [Weblate](https://hosted.weblate.org/projects/grommunio/grommunio-web-2.0/). Contributions are regularly monitored and integrated in the release cycles of grommunio Web 2.0.

## License

This project is licensed under the GNU Affero General Public License v3.

See [LICENSE](LICENSE) for more information.

grommunio Web 2.0 uses several components with different licensing and bundles them within the build process. Please see the respective [package-lock.json](package-lock.json) for detailed information.
