# Component Dependency Graph

**Generated:** 2026-02-17
**Task:** T1.1.1 - Analyze App.jsx component structure and extract state management patterns

---

## Component Dependency Graph (Mermaid)

```mermaid
graph TD
    subgraph "External Libraries"
        MUI["@mui/material"]
        MUIIcons["@mui/icons-material"]
        Toastify["react-toastify"]
        DatePicker["react-datepicker"]
        HtmlToImage["html-to-image"]
        JsPDF["jspdf"]
    end

    subgraph "Utilities"
        ParseSchedule["parseSchedule.js"]
        ParseRawData["parseRawData.js"]
        GenerateIcs["generateIcs.js"]
        ConvertToRawData["convertToRawData.js"]
    end

    subgraph "Components"
        App["App.jsx"]
        TimeFilter["TimeFilter.jsx"]
        CourseTable["CourseTable.jsx"]
        TimetableView["TimetableView.jsx"]
        RawDataInput["RawDataInput.jsx"]
        ConfirmDialog["ConfirmDialog.jsx"]
    end

    %% App dependencies
    App --> MUI
    App --> MUIIcons
    App --> Toastify
    App --> ParseSchedule
    App --> ParseRawData
    App --> TimeFilter
    App --> CourseTable
    App --> TimetableView
    App --> RawDataInput
    App --> ConfirmDialog

    %% TimeFilter dependencies
    TimeFilter --> DatePicker

    %% CourseTable dependencies
    CourseTable --> MUI
    CourseTable --> MUIIcons
    CourseTable --> Toastify
    CourseTable --> ConvertToRawData

    %% TimetableView dependencies
    TimetableView --> MUI
    TimetableView --> MUIIcons
    TimetableView --> Toastify
    TimetableView --> HtmlToImage
    TimetableView --> JsPDF
    TimetableView --> GenerateIcs
    TimetableView --> ParseSchedule

    %% ConfirmDialog dependencies
    ConfirmDialog --> MUI
    ConfirmDialog --> MUIIcons

    %% RawDataInput - minimal dependencies
    RawDataInput --> PropTypes["prop-types"]
```

---

## Data Flow Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph "User Input"
        Import["Import Data<br/>(WITS/AIMS)"]
        FilterUI["Filter Controls<br/>(Days, Times, Types)"]
        LockBtn["Lock/Unlock<br/>Buttons"]
        GenerateBtn["Generate<br/>Schedule"]
    end

    subgraph "State Management (App.jsx)"
        AllCourses["allCourses<br/>(Master State)"]
        Filters["Filter State<br/>(excludedDays,<br/>excludedTimeRanges,<br/>sectionTypes, etc.)"]
        Processed["processedCourses<br/>(Filtered/Grouped)"]
        LockedSet["lockedCourses<br/>(Derived via useMemo)"]
        Conflicts["conflictingLockedCourseIds<br/>(Set<string>)"]
        Generated["generatedSchedules<br/>(Array of arrays)"]
    end

    subgraph "Persistence"
        LS[(localStorage)]
    end

    subgraph "Output"
        Table["CourseTable<br/>(Display)"]
        Timetable["TimetableView<br/>(Visual Schedule)"]
        Export["Export Options<br/>(PNG, PDF, ICS)"]
    end

    %% Data flow
    Import -->|"parseRawCourseData"| AllCourses
    AllCourses <-->|"persist/load"| LS
    Filters <-->|"persist/load"| LS

    AllCourses -->|"filter + group"| Processed
    Filters -->|"filter params"| Processed
    Processed --> Table

    AllCourses -->|"filter isLocked"| LockedSet
    LockedSet -->|"check conflicts"| Conflicts
    Conflicts --> Table
    Conflicts --> Timetable

    LockBtn -->|"toggle isLocked"| AllCourses
    GenerateBtn -->|"generateBestSchedule"| Generated
    Generated -->|"apply locks"| AllCourses

    LockedSet --> Timetable
    Timetable --> Export

    %% Style
    classDef state fill:#e1f5fe,stroke:#01579b
    classDef input fill:#e8f5e9,stroke:#1b5e20
    classDef output fill:#fff3e0,stroke:#e65100
    classDef persist fill:#fce4ec,stroke:#880e4f

    class AllCourses,Filters,Processed,LockedSet,Conflicts,Generated state
    class Import,FilterUI,LockBtn,GenerateBtn input
    class Table,Timetable,Export output
    class LS persist
```

---

## State Update Flow

```mermaid
sequenceDiagram
    participant User
    participant RawDataInput
    participant App
    participant localStorage
    participant CourseTable

    User->>RawDataInput: Paste course data
    User->>RawDataInput: Click Import
    RawDataInput->>App: onSubmit(importMode)
    App->>App: parseRawCourseData(rawData)
    App->>App: setAllCourses(prev => [...prev, ...new])
    App->>localStorage: persist allCourses
    App->>App: useEffect triggers
    App->>App: setProcessedCourses (filter + group)
    App->>CourseTable: render with processedCourses
```

---

## Schedule Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Algorithms
    participant CourseTable

    User->>App: Click Generate Schedule
    App->>App: setIsGenerating(true)
    App->>Algorithms: generateBestSchedule / generateBestPartialSchedule
    Algorithms->>Algorithms: Filter candidates
    Algorithms->>Algorithms: Check conflicts (checkTimeOverlap)
    Algorithms->>Algorithms: Check constraints (exceedsMaxUnits, exceedsMaxGap)
    Algorithms->>Algorithms: Score by preference
    Algorithms->>App: Return bestSchedule
    App->>App: setAllCourses (apply locks)
    App->>App: setGeneratedSchedules (store result)
    App->>App: setIsGenerating(false)
    App->>CourseTable: Re-render with locked courses
```

---

## Component Coupling Analysis

| Component     | Coupled To                                       | Coupling Level | Notes                          |
| ------------- | ------------------------------------------------ | -------------- | ------------------------------ |
| App.jsx       | All components                                   | High           | Root component, owns all state |
| TimeFilter    | react-datepicker                                 | Low            | Single external dependency     |
| CourseTable   | MUI, Toastify, convertToRawData                  | Medium         | Export functionality           |
| TimetableView | MUI, Toastify, html-to-image, jspdf, generateIcs | High           | Export dependencies            |
| RawDataInput  | prop-types                                       | Low            | Minimal, pure component        |
| ConfirmDialog | MUI                                              | Low            | Self-contained modal           |

---

## Import Graph (File Level)

```
App.jsx
├── @mui/icons-material (InfoOutlinedIcon, PaletteOutlinedIcon)
├── @mui/material (Tooltip)
├── react (useEffect, useMemo, useRef, useState)
├── react-toastify (toast, ToastContainer)
├── ./App.css
├── ./assets/logo_icon_*.svg
├── ./components/ConfirmDialog
├── ./components/CourseTable
├── ./components/RawDataInput
├── ./components/TimeFilter
├── ./components/TimetableView
├── ./utils/parseRawData (parseRawCourseData)
└── ./utils/parseSchedule (parseSchedule)

TimeFilter.jsx
├── react
├── react-datepicker
└── react-datepicker/dist/react-datepicker.css

CourseTable.jsx
├── @mui/icons-material (InfoOutlinedIcon, MenuIcon)
├── @mui/material (IconButton, Menu, MenuItem, Tooltip)
├── react (Fragment, useMemo, useState)
├── react-toastify (toast)
├── ../App.css
└── ../utils/convertToRawData (convertCoursesToRawData)

TimetableView.jsx
├── @mui/icons-material (MenuIcon)
├── @mui/material (IconButton, Menu, MenuItem, Tooltip)
├── html-to-image (toPng)
├── jspdf (jsPDF)
├── react (useRef, useState)
├── react-toastify (toast)
├── ../utils/generateIcs (generateIcsContent)
└── ../utils/parseSchedule (parseSchedule)

RawDataInput.jsx
├── prop-types
└── react (useState)

ConfirmDialog.jsx
├── @mui/icons-material (InfoOutlinedIcon, WarningAmberIcon)
├── @mui/material (Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle)
└── react
```

---

## Recommendations for Migration

1. **Reduce MUI Dependencies**: Replace MUI components with Tailwind-styled equivalents
2. **Extract State Hooks**: Create custom hooks to reduce App.jsx complexity
3. **Keep Utilities Pure**: parseSchedule.js, parseRawData.js, generateIcs.js, convertToRawData.js should remain unchanged
4. **Consider Zustand/Jotai**: If state management becomes more complex, but current architecture is simple enough for React-only
