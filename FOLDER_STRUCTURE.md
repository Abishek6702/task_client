# Frontend Folder Structure & Navigation Guide

This document breaks down the frontend directory structure, explaining the purpose of every folder and significant file to help you navigate the codebase.

## Root Directory (`frontend/`)

```text
frontend/
├── public/                 # Static assets that bypass Webpack/Vite processing.
│   ├── favicon.svg         # Tab icon.
│   └── icons.svg           # Global SVG icon sprites (if used).
├── src/                    # Primary source code directory.
├── index.html              # The main HTML file. Vite injects the React app here.
├── package.json            # Lists npm dependencies and project scripts (`npm run dev`).
├── vite.config.js          # Configuration file for Vite (dev server, build settings).
├── tailwind.config.js      # Configuration for TailwindCSS styling (colors, fonts).
├── postcss.config.js       # Required processor for TailwindCSS.
├── STUDY_GUIDE.md          # In-depth module and role-based architecture guide.
└── FOLDER_STRUCTURE.md     # This file.
```

---

## Source Directory (`src/`)

```text
src/
├── App.jsx                 # The core Router file. Defines all public and protected routes.
├── main.jsx                # The React entry point. Mounts the `<App />` and Redux `<Provider />`.
├── index.css               # Global CSS. Imports Tailwind directives (`@tailwind base;`).
└── App.css                 # Specific application-wide utility classes.
```

---

## 1. Store (`src/store/`)
Handles global state management using Redux Toolkit.

```text
store/
├── index.js                # Configures the global Redux store (`configureStore`).
└── slices/
    └── authSlice.js        # Manages Authentication state (`user`, `token`, login/logout actions).
```

---

## 2. Utils (`src/utils/`)
Contains helper functions and configuration used globally.

```text
utils/
└── api.js                  # Pre-configured Axios instance. Contains interceptors that automatically attach the JWT `Authorization: Bearer` header to every outgoing request.
```

---

## 3. Layouts (`src/layout/`)
Defines the persistent "shells" that wrap the application pages.

```text
layout/
├── AuthLayout.jsx          # A clean, minimal layout used for Login/Register pages (no sidebar).
└── MainLayout.jsx          # The primary app shell. Contains the Sidebar navigation and Header. Renders page content dynamically via `<Outlet />`.
```

---

## 4. Pages (`src/pages/`)
Top-level components mapped directly to specific URL routes in `App.jsx`. These components handle data fetching (`useEffect`) and orchestrate the UI.

```text
pages/
├── Dashboard.jsx           # Main home page. Displays metrics (Projects, Tasks, Overdue).
├── Login.jsx               # User authentication form.
├── Register.jsx            # Organization onboarding form.
├── ForgotPassword.jsx      # Password reset request view.
├── ResetPassword.jsx       # Password reset fulfillment view.
├── Organizations.jsx       # Super Admin view to manage tenants.
├── Projects.jsx            # Lists all projects the user has access to.
├── ProjectDetails.jsx      # Shell page for a specific project.
├── ProjectBoard.jsx        # The visual Kanban drag-and-drop board.
├── MyTasks.jsx             # Filtered view showing only tasks assigned to the current user.
├── CalendarPage.jsx        # Calendar view of tasks and project deadlines.
├── Team.jsx                # User management view for Org Admins / Managers.
├── Reports.jsx             # Charts and analytical data for workload/completion.
├── Notifications.jsx       # Dedicated page for viewing historical notifications.
└── Settings.jsx            # Profile and password update forms.
```

---

## 5. Components (`src/components/`)
Reusable UI elements and heavy logic blocks that are imported into Pages.

```text
components/
├── CreateProjectModal.jsx  # Form overlay to create a new project.
├── CreateTaskModal.jsx     # Form overlay to create tasks and select multiple assignees.
├── TaskDetailsModal.jsx    # Complex overlay showing task info, comments, activity log, and file uploads.
├── TaskTable.jsx           # Reusable data table for displaying task lists.
├── ProjectMembers.jsx      # Component to manage/add users to a project.
├── ActivityList.jsx        # Renders the chronological audit trail inside task details.
├── NotificationDropdown.jsx# The bell icon logic in the Header. Polls for unread alerts.
├── Toast.jsx               # The global notification popup system (success/error messages).
├── Modal.jsx               # Base reusable Modal wrapper (handles backdrop clicks and animation).
└── ui.jsx                  # Library of micro-components (`<Badge>`, `<Avatar>`, `<Skeleton>`) used to ensure design consistency without repeating code.
```

---

## 6. Assets (`src/assets/`)
Static files imported directly into React components (which Vite processes and bundles).

```text
assets/
├── react.svg               
├── vite.svg                
└── hero.png                # Brand graphics used in Auth layouts.
```
