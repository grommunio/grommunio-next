# Changelog

All notable changes to grommunio Next are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Runtime configuration through `config.json`; sign-in with the redirect flow.
- Rebuilt mail module: three pane layout, folder tree with context menu and
  drag and drop, grouped message list with filters, sorting, pinning and
  selection, sanitised reading pane with inline images and attachment preview,
  meeting invitation cards, compose with recipient suggestions, attachments,
  autosaved drafts and signatures, categories, undo for move/delete, folder
  sync through delta queries, desktop notifications and keyboard shortcuts.
- Rebuilt calendar on react-big-calendar: day/work week/week/month/agenda,
  drag and drop, event editor with attendees, availability, recurrence,
  reminders, categories and attachments, RSVP, calendar colors and sharing.
- Rebuilt People module with contact folders, contact card, editor, photos,
  CSV/vCard import and export.
- Rebuilt Tasks (lists, steps, due dates, reminders, repeat, importance) and
  Notes (colored cards, autosave).
- Settings window: appearance, language and time, notifications, categories,
  keyboard shortcuts, mail layout, signature, inbox rules, automatic replies,
  calendar view and working hours.
- German translation of the new interface; `scripts/extractTranslations.py`.

### Changed
- Build tooling moved from Create React App to Vite and TypeScript 5, tests
  run with Vitest.
- New application shell (top bar with search, app rail) and a flat theme with
  light, dark and system mode.
- Dependencies updated (MUI 5.16 / X 7, Redux Toolkit 2, MSAL 3, i18next 23).

### Removed
- @aldabil/react-scheduler, @mui/styles, react-color, react-csv, react-icons,
  react-loadable, axios and other unused dependencies.
