<p align="center">
  <img src="course-scheduler-astro/public/logo_icon_dark.svg" alt="CITU Course Builder Logo" width="100" />
</p>

<h1 align="center">CITU Course Builder</h1>

<p align="center">
  <i>Plan, filter, and optimize class schedules with an Astro-powered experience.</i>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://github.com/MasuRii/CITUCourseBuilder/stargazers"><img src="https://img.shields.io/github/stars/MasuRii/CITUCourseBuilder" alt="GitHub stars" /></a>
  <img src="https://img.shields.io/badge/Stack-Astro%20%7C%20TypeScript%20%7C%20React%20%7C%20Bun-1f2937" alt="Tech stack: Astro, TypeScript, React, Bun" />
</p>

<p align="center">
  <img src="course-scheduler-astro/public/CIT-U%20Course%20Builder_App.png" alt="CIT-U Course Builder Application Screenshot" width="700" />
</p>

## About The Project

CITU Course Builder is a web application that helps students at Cebu Institute of Technology - University (and compatible institutions) create conflict-free schedules with smart imports, filters, and exports.

**Version 2.0** completes the migration to **Astro with React islands** and **TypeScript**, delivering faster loads, smaller bundles, and a cleaner architecture while preserving the familiar scheduling workflow.

## Features

- Smart data import for WITS and AIMS formats.
- Flexible filtering by day, time, section type, and status.
- Course locking with immediate conflict feedback.
- Multiple schedule generation strategies (recommended, full coverage, quick).
- Visual timetable plus export to TXT, PNG, PDF, and iCalendar.
- Theme presets with light/dark modes and palette persistence.

## Built With

- [Astro](https://astro.build/) with React islands for selective hydration
- [React](https://react.dev/) for interactive UI components
- [TypeScript](https://www.typescriptlang.org/) for type-safe development
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Bun](https://bun.sh/) for tooling and scripts
- [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/) for testing

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MasuRii/CITUCourseBuilder.git
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

### Usage

1. Start the development server:
   ```bash
   bun run dev
   ```
2. Open the app at `http://localhost:4321/CITUCourseBuilder/`.
3. Import course data, apply filters, lock required sections, and generate a schedule.
4. Export results to TXT, PNG, PDF, or iCalendar as needed.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with a clear description of your changes.

## License

Distributed under the MIT License. See `LICENSE` for details.

## Contact / Author

GitHub: [MasuRii](https://github.com/MasuRii)
