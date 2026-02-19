<p align="center">
  <a href="https://github.com/MasuRii/CITUCourseBuilder">
    <img src="course-scheduler-astro/public/logo_icon_light.svg" alt="CITU Course Builder Logo" width="100" height="100">
  </a>
</p>

<h1 align="center">CITU Course Builder</h1>

<p align="center">
  <i>Plan, Filter, and Optimize Your Class Schedules with Ease!</i>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue)]()
[![Status](https://img.shields.io/badge/status-completed-brightgreen)]()
[![GitHub issues](https://img.shields.io/github/issues/MasuRii/CITUCourseBuilder)](https://github.com/MasuRii/CITUCourseBuilder/issues)
[![GitHub stars](https://img.shields.io/github/stars/MasuRii/CITUCourseBuilder)](https://github.com/MasuRii/CITUCourseBuilder/stargazers)

A modern web application that helps students at Cebu Institute of Technology - University (CIT-U) efficiently create optimal, conflict-free class schedules. It simplifies academic planning by providing smart import/export capabilities, intelligent scheduling algorithms, and a responsive visual interface.

<p align="center">
  <img src="course-scheduler-web/src/assets/CIT-U Course Builder_App.png" alt="CIT-U Course Builder Application Screenshot" width="700">
</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## About The Project

The CITU Course Builder is a completed, stable web application designed to assist students at Cebu Institute of Technology - University (and compatible institutions) in efficiently creating optimal, conflict-free class schedules. It simplifies academic planning by providing smart import/export capabilities, intelligent scheduling algorithms, and a responsive visual interface.

**Version 2.0** introduces a complete architecture migration from React/Vite to Astro with React islands, resulting in:

- **~77% smaller main bundle** (117 KB vs 519 KB)
- **~100 Lighthouse Performance score** (up from 75)
- **Improved accessibility** (97 score, WCAG AA compliant)
- **Faster build times** (~5s vs ~4s for full build, ~1.4s for dev)

## Key Features

- **📚 Smart Data Import:**
  - Paste data from both modern **WITS** and legacy **AIMS** platforms.
  - Intelligent parser handles HTML tables, compact text formats, multi-line entries, and complex hybrid schedules with comma-separated days/times.
  - Seamless toggle between **WITS (New)** and **AIMS (Legacy)** import modes.

- **📊 Dynamic Course Management:**
  - View courses in a sortable, filterable table.
  - Group by subject, department, or view all.
  - Manage individual courses or clear all data.

- **🔒 Course Prioritization (Locking):**
  - Lock essential course sections.
  - Immediate visual conflict highlighting for overlapping locked courses.
  - Confirmation prompts for conflict-inducing locks.

- **⚙️ Advanced Filtering:**
  - Exclude courses by specific days or time ranges.
  - Filter by section type (Online, Face-to-Face, Hybrid).
  - Filter by course status (Open/Closed/All).

- **🛠️ Customizable User Preferences:**
  - Set maximum total units.
  - Define maximum allowed break time between classes.
  - Drag-and-drop preferred time of day order (Morning, Afternoon, Evening, Any).
  - Minimize days on campus preference (excluding online classes).
  - All preferences and filters are saved automatically to `localStorage`.

- **🧠 Intelligent Schedule Generation:**
  - Multiple search modes:
    - **Recommended (Flexible, Best Fit):** Maximizes subjects and units.
    - **Full Coverage (All Subjects, Strict):** Ensures all subjects fit.
    - **Quick (Fast, May Miss Best):** Rapidly finds a viable schedule.
  - Generated schedules respect all locked courses, filters, and preferences.

- **🗓️ Clear Timetable Visualization:**
  - View locked courses in a weekly timetable (7 AM - 10 PM).
  - Responsive design adapts to various screen sizes.
  - Color-coded subjects with hover tooltips for course details.
  - Toggle between full timetable and summary view.

- **📤 Comprehensive Export Options:**
  - **Course List:** Copy to clipboard or download as `.txt` (tab-separated format for re-import).
  - **Timetable View:** Export as a PNG image or a PDF document.
  - **iCalendar Export:** Generate `.ics` file for easy import to Google Calendar, Outlook, or Apple Calendar.

- **🎨 Modern & Responsive UI/UX:**
  - Light and Dark mode themes with instant switching.
  - Three color palettes: **Original** (indigo), **Comfort** (soft gray/blue), and **Space** (cosmic teal/gold).
  - Palette persistence between sessions for consistent theming.
  - Playful "hobby student" aesthetic with Fredoka headings and Lexend body text.
  - WCAG AA compliant with full keyboard navigation and screen reader support.
  - Mobile-first responsive design.

## Built With

This project leverages a modern, performance-optimized frontend stack:

### Core Framework

- [Astro](https://astro.build/) - The web framework for content-driven websites with partial hydration.
- [React](https://reactjs.org/) - UI library for interactive islands.
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript with strict mode.

### Styling & UI

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework with custom design tokens.
- [Lucide React](https://lucide.dev/) - Beautiful & consistent icon library.
- Custom CSS animations and theme system.

### Export Libraries (Lazy-loaded)

- [html-to-image](https://github.com/bubkoo/html-to-image) - For capturing HTML to image (PNG export).
- [jsPDF](https://github.com/parallax/jsPDF) - For generating PDFs (Timetable PDF export).

### Testing & Quality

- [Vitest](https://vitest.dev/) - Fast unit testing with coverage.
- [Playwright](https://playwright.dev/) - End-to-end testing with visual regression.
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) - Automated accessibility testing.

### Tooling

- [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime, package manager, and test runner.
- [ESLint](https://eslint.org/) - Code linting with flat config.
- [Prettier](https://prettier.io/) - Code formatting.
- [Husky](https://typicode.github.io/husky/) - Git hooks for pre-commit checks.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your system (Node.js 18+ also works, but Bun is recommended for faster builds).

```sh
# Install Bun (Recommended)
curl -fsSL https://bun.sh/install | bash

# Or using npm
npm install -g bun
```

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/MasuRii/CITUCourseBuilder.git
   ```
2. Navigate to the project directory:
   ```bash
   cd CITUCourseBuilder
   ```
3. Install root dependencies (for linting, formatting, git hooks):
   ```bash
   bun install
   ```
4. Navigate to the Astro app and install dependencies:
   ```bash
   cd course-scheduler-astro
   bun install
   ```
5. Run the development server:
   ```bash
   bun run dev
   ```

The application will be available at `http://localhost:4321/CITUCourseBuilder/`.

## Usage

Once the application is running:

1. **Import Data:** Navigate to your institution's portal (e.g., AIMS for CIT-U students), copy the table of available courses. Paste this tab-separated data into the "Raw Data Input" text area in the CITU Course Builder and click "Import Data."
2. **Manage Courses:** View your imported courses in the table. You can sort, group, and delete courses.
3. **Set Preferences & Filters:** Configure your maximum units, preferred class gap, preferred time of day, and apply filters like day/time exclusions, section types, or course status.
4. **Lock Courses:** Lock any specific course sections you absolutely need in your schedule. Conflicts with other locked courses will be highlighted.
5. **Generate Schedule:** Choose a schedule generation mode ("Recommended," "Full Coverage," or "Quick") and click "Generate Best Schedule." The application will attempt to find an optimal, conflict-free schedule based on your settings.
6. **View Timetable:** Locked courses (either manually locked or from a generated schedule) will appear in the weekly timetable.
7. **Export:** Use the hamburger menus in the course list and timetable sections to:
   - Export course data as `.txt` or to clipboard (tab-separated format for re-import)
   - Export timetable view as high-fidelity PNG or PDF files
   - Export timetable as iCalendar (.ics) file for calendar applications
8. **Customize Theme:** Switch between Light/Dark modes and choose between 'Original', 'Comfort', or 'Space' color palettes. The system remembers your choices between sessions.

All your settings, imported courses, and locked courses are automatically saved in your browser's local storage, so you can close the tab and resume later.

## Project Structure

```
CITUCourseBuilder/
├── course-scheduler-astro/     # Main Astro application
│   ├── src/
│   │   ├── components/         # React islands (interactive components)
│   │   ├── layouts/            # Astro layouts
│   │   ├── pages/              # Astro pages (routes)
│   │   ├── styles/             # Global CSS with Tailwind v4 theme
│   │   ├── utils/              # Preserved utility functions (TypeScript)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   └── algorithms/         # Scheduling algorithm module
│   ├── public/                 # Static assets
│   ├── tests/                  # Test files (unit, integration, E2E)
│   └── package.json
├── course-scheduler-web/       # Original React app (archived)
├── docs/                       # Architecture documentation
│   └── architecture/           # ADRs, analysis documents
├── .github/workflows/          # GitHub Actions CI/CD
├── package.json                # Root package.json for tooling
└── README.md
```

## Development

### Available Scripts

Run these commands from the `course-scheduler-astro` directory:

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `bun run dev`        | Start development server at localhost:4321 |
| `bun run build`      | Build for production to `./dist/`          |
| `bun run preview`    | Preview production build locally           |
| `bun run typecheck`  | Run TypeScript and Astro type checking     |
| `bun run test`       | Run unit tests with Vitest                 |
| `bun run test:watch` | Run tests in watch mode                    |
| `bun run test:e2e`   | Run Playwright E2E tests                   |

Run these from the root directory:

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `bun run lint`         | Run ESLint on all files            |
| `bun run lint:fix`     | Auto-fix ESLint issues             |
| `bun run format`       | Format all files with Prettier     |
| `bun run format:check` | Check formatting without modifying |

### Architecture

The application uses **Astro with React islands** architecture:

- **Static HTML** is generated at build time for fast initial load
- **React islands** hydrate only when needed for interactivity:
  - `client:load` - Immediate interactivity (RawDataInput, CourseTable, ConfirmDialog)
  - `client:visible` - Lazy load when visible (TimeFilter, TimetableView)

This approach delivers the best of both worlds: static site performance with rich interactivity where needed.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes using [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to update tests as appropriate. All PRs must pass CI checks:

- ESLint linting
- TypeScript type checking
- Unit tests (Vitest)
- E2E tests (Playwright)

## License

Distributed under the MIT License. See `LICENSE` for more information.
