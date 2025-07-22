# Scrum counter

A Chrome extension with a convenient story points counter for Jira tasks grouped by developers. Helps with sprint planning.
Allows counting story points written in any format within task titles added to the planned sprint.

The **extension is safe**, makes no external network requests, and doesn't modify Jira page content.

## Features

- Launches only on allowed domains when clicking the icon;
- Displays counter breakdown by developers;
- Shows developer avatars and names;
- Parses story points using provided regex with named capture groups;
- Displays story points by specialization for each developer;
- Shows total story points per developer;
- Color-coded indicators for exceeding story point limits;
- Warns when mixing story points from different specializations;

## Installation and Build

Clone the repository, then run in the repo directory:
```
npm i
npm run build
```

## Configuration

Override necessary variables in `.env` and/or `.env.local` (included in .gitignore):

- `VITE_JIRA_HOST` (example `jira.example.com`) - your Jira domain;
- `VITE_JIRA_TASK_IGNORE_TYPES` (example `Retro AI,Sprint Goal`) - comma-separated Jira task types to exclude from counting;
- `VITE_JIRA_SP_NORMAL` (example `11`) - story points threshold below which counter appears gray;
- `VITE_JIRA_SP_TOO_MUCH` (example `14`) - story points threshold below which counter appears green;
- `VITE_JIRA_SP_WAY_TOO_MUCH` (example `17`) - story points threshold below which counter appears orange, above - red;
- `VITE_JIRA_SP_REGEXP` (example `^\[(?<be>\d+),(?<fe>\d+)\]`) - regex pattern for parsing story points in Jira task titles. Each named group represents a specialization (e.g., backend, frontend). Example regex expects titles like `[12,3] Great jira task` where `12` is backend points (group `be`) and `3` is frontend points (group `fe`). If sum of specialized points doesn't match total, warning appears;
- `VITE_JIRA_SP_MIXINS` (example `qa|fe,be`) - list of allowed specialization combinations (comma-separated without spaces, combinations separated by |). Example allows fe+be but prohibits qa+fe or qa+be. Leave empty to disable.

After configuration changes, run `npm run build` and reinstall the extension.

## Usage

Install the build as a Chrome extension:

1. Open Chrome's "Manage Extensions"
2. Click "Load unpacked extension" in top-left
3. Select the `dist` folder

Click the extension icon on Jira's sprint planning board to open the counter panel.
