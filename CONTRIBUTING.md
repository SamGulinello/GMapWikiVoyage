# Contributing to GMapWikiVoyage

First off, thank you for taking the time to contribute! GMapWikiVoyage is a small, independent project, and every contribution — a bug report, a documentation fix, or a new feature — makes it better for travelers everywhere.

Please take a moment to read this guide before opening an issue or pull request. It should be short enough to skim and specific enough to answer the common questions about how this project is built and maintained.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [What This Project Is (and Is Not)](#what-this-project-is-and-is-not)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Requesting Features](#requesting-features)
  - [Submitting Changes](#submitting-changes)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Packaging for Release](#packaging-for-release)
- [Questions?](#questions)

## Code of Conduct

This project is committed to providing a welcoming and harassment-free experience for everyone. By participating, you are expected to uphold the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) — be respectful, be constructive, and assume good faith.

Behavior that is unacceptable includes, but is not limited to: harassment, trolling, demeaning or discriminatory language, and publishing others' private information without permission.

Project maintainers may remove, edit, or reject comments, commits, code, and other contributions that do not align with this Code of Conduct.

## What This Project Is (and Is Not)

Before you invest time in a contribution, make sure it fits the project:

- **It is**: a lightweight Chrome (and Edge) extension that adds a `Wiki` button to Google Maps place pages, linking to the matching Wikivoyage article.
- **It is not**: an affiliated product of Google, Google Maps, Wikivoyage, Wikidata, or Wikimedia. Please do not submit issues about those services as if they were part of this project.

The extension is intentionally small: two source files, no frameworks, no build server. When proposing features, prefer solutions that keep it that way — a dependency or framework added just to ship one feature will likely be declined.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (a recent LTS release) and `npm`
- Google Chrome or Microsoft Edge for manual testing

### Fork and clone

1. Fork the repository on GitHub.
2. Clone your fork:

   ```bash
   git clone https://github.com/<your-username>/GMapWikiVoyage.git
   cd GMapWikiVoyage
   ```

3. Add the original repository as an upstream remote so you can stay in sync:

   ```bash
   git remote add upstream https://github.com/SamGulinello/GMapWikiVoyage.git
   ```

### Install and build

```bash
npm install     # install dependencies
npm run build   # build the extension into dist/
npm run watch   # rebuild automatically while you develop  (optional)
```

The build outputs the unpacked extension to `dist/`, which is gitignored and should never be committed.

See the [README](README.md) for full setup and testing instructions.

## Project Structure

```
.
├── docs/                  # Project documentation and images
│   └── images/            # Screenshots used in the README
├── public/                # Static assets copied verbatim into dist/
│   ├── icons/             # Extension icons
│   ├── images/            # Button images (e.g. wiki.png)
│   ├── manifest.json      # Chrome Extension Manifest V3
│   └── sidepanel.html     # Extension side panel shell
├── src/                   # Source JavaScript (this is where you edit)
│   ├── background.js      # Service worker: handles fetch proxying
│   └── content.js         # Content script: button injection + lookup logic
├── webpack.config.js      # Webpack + Babel build configuration
├── package.json           # Dependencies and npm scripts
└── README.md              # Project overview and quick start
```

**A quick map of how it works:**

1. `src/content.js` runs inside Google Maps pages (`document_start`, all frames).
2. It reads the current place from the Maps URL and queries the **Wikidata API** for matching entities.
3. For each candidate, it fetches the Wikivoyage article and compares coordinates against Maps to avoid suggesting an unrelated article with a similar name.
4. When a match is found, it injects a `Wiki` button into the Maps action row. Clicking it opens the Wikivoyage article in a new tab.

`src/background.js` is a small service worker that relays fetches from the content script (needed to get around page `Content-Security-Policy` restrictions).

## How to Contribute

### Reporting Bugs

Before opening an issue:

1. **Search existing issues** to see if the bug has already been reported.
2. **Test with the latest `main`**, since the Chrome Web Store build may be older than the code on GitHub.

When you open a bug report, include:

- **What you expected** to happen
- **What actually happened**
- **Steps to reproduce** (a destination name to search on Google Maps is a great start)
- **Environment**: browser and version, OS, and which build of the extension you tested (Web Store version, built-from-`main`, etc.)
- A screenshot or short screen recording, if helpful

### Requesting Features

GMapWikiVoyage deliberately does one thing. When requesting a feature, explain **the problem you are trying to solve**, not just the feature you want. Issues that fit inside the existing architecture (e.g., better matching, more locales, more Maps UI variations) are much more likely to be accepted than ones that expand the extension's scope significantly.

### Submitting Changes

1. Open an issue first (or comment on an existing one) to discuss significant changes before writing code. This saves everyone time if the maintainer has a different plan.
2. Create a branch and make your changes.
3. Run through the manual QA checklist (see [Testing](#testing)).
4. Open a pull request with a clear description.

## Development Workflow

### Branch naming

Use short, descriptive branch names, ideally prefixed with the kind of change:

```text
fix/wikivoyage-button-overlap
feat/opentoworld-matching
docs/improve-setup-instructions
```

### Commit conventions

Write clear, imperative commit messages that describe **what** and **why**:

```text
Fix coordinate check for city-level zoom
Add fallback when share button is missing
```

Keep commits focused on a single logical change. If a commit is only fiddling with formatting, fold it into the change it belongs to. Avoid mixing unrelated changes in a single pull request.

### Keep your fork in sync

Before starting new work, sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Coding Guidelines

The project has no linter or formatter configured, so please be disciplined and match the existing style:

- **Indentation**: 4 spaces. No tabs.
- **Semicolons**: always.
- **Quotes**: single quotes for JavaScript strings; double quotes for JSON and configuration files.
- **Functions**: use `function` declarations or named `async function`s (as in `content.js`); avoid arrow functions where a hoisted declaration reads better.
- **Documentation**: keep the existing JSDoc-style comments on non-trivial functions (e.g. `extractLatLonFromGoogleMaps`). Do not add comments that merely restate the code.
- **Variable naming**: use `camelCase` (already the norm in this codebase).
- **No new dependencies unless justified**: if you add one, explain why in the PR description. The extension works with zero runtime dependencies today.
- **Don't hardcode URLs** that could drift: Wikivoyage/Wikidata endpoints are centralized in the lookup helpers.

### Webpack and build

- The build is defined in `webpack.config.js` and the scripts in `package.json`.
- `public/` is copied verbatim into `dist/` by `copy-webpack-plugin`.
- Only edit `src/` — never edit files in `dist/` (it is a generated artifact).

## Testing

There is currently **no automated test suite** (`npm test` is a placeholder), so manual testing matters:

1. Run `npm run build`.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** and click **Load unpacked**.
4. Select the `dist` folder.
5. Open Google Maps and try several destinations, including:
   - A major city with a Wikivoyage article (e.g., Boston) — button should appear
   - A small town with no Wikivoyage article — button should *not* appear
   - Two similarly named places — confirm the coordinate check directs to the correct article
   - Zoom levels / URLs where no explicit place is shown

If a pull request touches matching or button-injection logic, please list in the PR description which destinations you tested and the result.

If you'd like to add automated tests, that would be a very welcome enhancement — open an issue to discuss the approach first, since it will introduce new tooling to the project.

## Pull Request Process

1. **Update from `main`**: make sure your branch is up to date with the latest `main` before opening the PR.
2. **Title**: use the same [imperative style](#commit-conventions) as commits.
3. **Description**: explain what changed and why, link to the issue it closes (e.g. `Closes #12`), and note any manual testing you did.
4. **Keep it small**: small, focused PRs are reviewed and merged faster. If a change is large, discuss splitting it up first.
5. **CI**: there is no CI yet, so a successful local `npm run build` is the minimum bar. Make sure your PR builds cleanly.
6. A maintainer will review your PR. Please be patient and responsive to review comments — treat review feedback as a collaboration, not a gauntlet.

## Packaging for Release

Occasionally the maintainer builds and publishes to the Chrome Web Store. Contributors don't need to do this, but if you want to verify a distributable build:

```bash
npm run build
```

Then zip the contents of `dist`. Note the repo includes a generated `dist.zip` for local testing, but a release package should always be rebuilt from a clean checkout.

## Questions?

If anything in this guide is unclear, or you have an idea you'd like to float before opening an issue, feel free to reach out by opening an issue — questions are welcome there.

Happy contributing! 🌍