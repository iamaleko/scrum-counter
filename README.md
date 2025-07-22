# Scrum counter

A Chrome extension with a convenient story points counter for Jira tasks grouped by developers. Helps with sprint planning.
Allows counting story points written in any format within task titles added to the planned sprint.

<img width="378" height="211" alt="Снимок экрана 2025-07-22 в 13 34 00" src="https://github.com/user-attachments/assets/8babf70b-613e-4a48-b725-b2eae2b9a668" />

The **extension is safe**, makes no external network requests, and doesn't modify Jira page content.

## Features

- **Realtime** storypoints counting, **no need to open storypoints popup**;
- Launches only on allowed domains when clicking the icon;
- Displays counter breakdown by developers;
- Shows developer avatars and names;
- Shows total story points per developer;
- Color-coded indicators for exceeding story point limits;
- **Specialization breakdown**:
  - Parses story points specializations form task titles using provided regex with named capture groups;
  - Displays story points by specialization for each developer;
  - Warns when mixing story points from different specializations by provided rules;

## Installation and Build

Clone the repository, then run in the repo directory:
```
npm i
npm run build
```

## Configuration

Override necessary variables in `.env` and/or `.env.local` (included in .gitignore):

- `VITE_JIRA_HOST` (default `example.com`) - your Jira domain;
- `VITE_JIRA_TASK_IGNORE_TYPES` (default `Retro AI,Sprint Goal`) - comma-separated Jira task types to exclude from counting;
- `VITE_JIRA_SP_NORMAL` (default `11`) - story points threshold below which counter appears gray;
- `VITE_JIRA_SP_TOO_MUCH` (default `14`) - story points threshold below which counter appears green;
- `VITE_JIRA_SP_WAY_TOO_MUCH` (default `17`) - story points threshold below which counter appears orange, above - red;

If you intersted in additional specialization breakdown for you tasks and you ready to title them using specific pattern: 

- `VITE_JIRA_SP_REGEXP` (example `^\s*\[\s*(?<be>\d+)\D+(?<fe>\d+)\D+(?<qa>\d+)\s*\]`, empty by default) - regex pattern for parsing story points in Jira task titles. Each named group represents a specialization (e.g., backend, frontend, quality etc.). Example regex expects titles like `[1/2/3] Great jira task` where `1` is backend points (group `be`), `2` is frontend points (group `fe`) and `3` is quality assurance points (group `qa`). If sum of specialized points doesn't match total, warning appears. Leave empty to disable;
- `VITE_JIRA_SP_MIXINS` (example `qa|fe,be`, empty by default) - list of allowed specialization combinations for one teammate (comma-separated without spaces, combinations separated by |). Example allows fe+be (title patterns like `[1/2/0]`, `[1/0/0]` or `[0/2/0]`) but prohibits qa+fe or qa+be (title patterns like `[1/2/3]`, `[1/0/3]` or `[0/2/3]`). Leave empty to disable;

After configuration changes, run `npm run build` and reinstall the extension.

## Usage

Install the build as a Chrome extension:

1. Open Chrome's "Manage Extensions"
2. Click "Load unpacked extension" in top-left
3. Select the `dist` folder

Click the extension icon on Jira's sprint planning board to open the counter panel.
