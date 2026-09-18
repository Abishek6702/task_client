# Frontend Study Guide & Project Setup

This document provides a highly granular, module-by-module explanation of the frontend architecture, mapping exactly where each piece of UI logic goes, and how Role-Based Access Control (RBAC) affects every view.

## 1. Project Setup & Getting Started

### Prerequisites
- Node.js installed

### Installation & Execution
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev

# Build for production
npm run build
```

The application uses Vite as the build tool, meaning environment variables must be prefixed with `VITE_`.

---

## 2. Top-to-Bottom Architecture Flow

The frontend is a React Single Page Application (SPA). Data and rendering flow top-down:

1. **React Entry (`main.jsx`)**: Wraps the entire application in the Redux `<Provider>` (for global Auth state) and `<BrowserRouter>` (for routing).
2. **Routing & Access Control (`App.jsx`)**: Uses `react-router-dom` to map URL paths to Components. Separates Auth Routes (public) from Protected Routes (requires login).
3. **Layouts (`layout/MainLayout.jsx`)**: The persistent shell of the authenticated app. Contains the Sidebar and Header. Renders page content inside the `<Outlet />` based on the URL.
4. **Pages (`pages/*.jsx`)**: Top-level route components (e.g., `Projects.jsx`). Responsible for triggering `useEffect` to fetch data from the backend `api` when the page mounts.
5. **Modals & UI Components (`components/`)**: Heavy UI logic (like creating a task) is encapsulated in Modals. Micro-components (like Badges and Avatars) live in `ui.jsx`.

---

## 3. Global State & API Interceptors

### Redux Toolkit (`store/slices/authSlice.js`)
- Global state is kept extremely minimal. It is primarily used for Authentication.
- `authSlice` stores the current `user` object and the JWT `token`.
- When a user logs in, `dispatch(setCredentials(...))` is called. When they log out, `dispatch(logout())` is called.

### Axios Interceptor (`utils/api.js`)
- We do not use standard `fetch`. We use a pre-configured Axios instance.
- **The Interceptor:** Before *any* API request leaves the frontend, Axios intercepts it, checks Redux for the JWT token, and automatically injects it into the header: `Authorization: Bearer <token>`.

---

## 4. Role-Based Rendering Explained

The frontend adapts its UI dynamically based on the `user.role` retrieved from Redux. If a user tries to bypass the UI, the backend will still block them.

| Role | Frontend Experience |
|------|---------------------|
| **super_admin** | Sees the **Organizations** tab in the sidebar (defined in `MainLayout.jsx`). Can view and toggle tenant status. |
| **organization_admin** & **project_manager** | Sees "New Project", "New Task", and "Team" management buttons rendered conditionally based on `canCreate = ['organization_admin', 'project_manager'].includes(user?.role)`. |
| **team_lead** | Sees task management buttons but "New Project" is hidden. |
| **employee** | The "Team" and "Reports" pages are completely hidden from their sidebar. They only see projects they are assigned to, and can only move Kanban cards for tasks they own. |
| **viewer** | All forms, edit buttons, and drag-and-drop mechanics are disabled. |

---

## 5. Granular Module Breakdown

Below is a detailed breakdown of every single frontend module, where its code lives, and how it works.

### A. Authentication Module
- **Where it goes:** `pages/Login.jsx`, `pages/Register.jsx`, `pages/ForgotPassword.jsx`, `pages/ResetPassword.jsx`
- **How it works:** Simple forms that `POST` to the backend. On success, `Login` and `Register` dispatch the returned user data to Redux and trigger `navigate('/dashboard')`.
- **Role Interactions:** Publicly accessible. Uses `<AuthLayout />` which hides the sidebar.

### B. Organizations Module (Super Admin Portal)
- **Where it goes:** `pages/Organizations.jsx`
- **How it works:** A table view listing all tenants on the platform. Includes a toggle button to call `PUT /api/organizations/:id` to freeze a company's account.
- **Role Interactions:** Strictly rendered only if `user?.role === 'super_admin'`. Hidden in the sidebar for everyone else.

### C. Dashboard Module (Reports)
- **Where it goes:** `pages/Dashboard.jsx`, `pages/Reports.jsx`
- **How it works:** Calls `GET /api/reports/dashboard` on mount. Renders KPI cards (Total Projects, Open Tasks) and charts.
- **Role Interactions:** Hidden entirely from `employee` and `viewer` roles via `MainLayout.jsx` navigation array filter.

### D. Projects Module
- **Where it goes:** `pages/Projects.jsx`, `pages/ProjectDetails.jsx`, `components/CreateProjectModal.jsx`
- **How it works:** `Projects.jsx` lists all projects in a table. Clicking a project navigates to `ProjectDetails.jsx` which displays the project's specific task list or Kanban board.
- **Role Interactions:** The "New Project" button in `Projects.jsx` is wrapped in a conditional check for admin/manager roles.

### E. Tasks Module (Kanban Board)
- **Where it goes:** `pages/ProjectBoard.jsx`, `pages/MyTasks.jsx`, `components/CreateTaskModal.jsx`, `components/TaskDetailsModal.jsx`
- **How it works:** 
  - **Kanban (`ProjectBoard.jsx`)**: Fetches tasks, groups them into local React state arrays based on `status`. Uses HTML5 drag-and-drop. Employs **Optimistic Updates**: When dropped, the UI updates instantly, then sends the `PUT` request. If the API fails, it catches the error and reverts the card visually.
  - **Assignment (`CreateTaskModal.jsx`)**: Uses a custom chip-based UI to allow multi-select assignment, storing an array of ObjectIds in state to send to the API.
- **Role Interactions:** Only admins/managers see the "Create Task" button. Employees can only drag-and-drop tasks that belong to them.

### F. Comments & Activity Logs Module
- **Where it goes:** Inside `components/TaskDetailsModal.jsx`
- **How it works:** Rendered as tabs within the Task Details view. 
  - Submitting a comment calls `POST /api/comments` and appends the new comment object to the local `comments` array state instantly.
  - Activity logs are read-only and fetched via `GET /api/activities?entityId=X`.
- **Role Interactions:** Viewable by anyone with access to the task.

### G. Notifications Module
- **Where it goes:** `components/NotificationDropdown.jsx`
- **How it works:** Lives in the top Header. On mount (and periodically), it fetches `GET /api/notifications` to calculate the unread count (red dot). Clicking the bell opens a dropdown list. Clicking an item marks it as read.
- **Role Interactions:** Personal to the logged-in user.

### H. Global Search Module
- **Where it goes:** Inside `layout/MainLayout.jsx` (Header search bar)
- **How it works:** As the user types, a debounced `useEffect` triggers `GET /api/search?q=value`. Results (combining tasks, projects, and users) are rendered in an absolute-positioned dropdown beneath the search bar.
- **Role Interactions:** Backend automatically filters results so employees only find things they are allowed to see.

### I. Calendar Module
- **Where it goes:** `pages/CalendarPage.jsx`
- **How it works:** Calls `GET /api/calendar` which returns a unified array of objects with a `date` field. Renders a CSS Grid calendar and maps the events to their respective days.
- **Role Interactions:** Respects standard visibility rules (employees see personal deadlines).
