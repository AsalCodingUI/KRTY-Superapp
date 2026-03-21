# KretyaAPP

> A comprehensive employee performance and workforce management platform built with Next.js and Supabase.

KretyaAPP is a modern, full-featured enterprise application designed to streamline HR operations, performance reviews, team collaboration, and resource management. Built with cutting-edge technologies to provide a seamless, real-time experience for teams of all sizes.

---

## Features

### Dashboard
- **Admin/Stakeholder Dashboard** - Organization-wide overview with team metrics, pending actions, attendance, performance distribution, and employee spotlight
- **Employee Dashboard** - Personal overview with attendance, leave balance, performance scores, competency snapshot, upcoming reviews, 1:1 schedule, and active projects
- **Quarter & Year Filtering** - Dynamic filtering for performance metrics with quarterly and yearly views
- **Real-time Updates** - Live Supabase subscriptions for attendance and leave status changes

### Performance Management
- **360-Degree Reviews** - Comprehensive peer feedback system with customizable review cycles
- **KPI Tracking** - Set, monitor, and evaluate Key Performance Indicators with quarterly reporting
- **SLA Scoring** - Project-level SLA achievement tracking with weighted scoring
- **Work Quality Competency** - Checklist-based quality evaluation per project
- **Employee Profiles** - Detailed performance history and project assignment tracking
- **Team KPI Dashboard** - Project lead view for managing team performance metrics
- **One-on-One Scheduling** - Book and manage 1:1 meetings with real-time slot availability
- **Competency Snapshot** - Visual breakdown of leadership, quality, reliability, communication, and initiative scores

### Team & Project Management
- **Project Assignments** - Assign team members with role-based permissions (Lead, Member)
- **Project Timeline Tracking** - Monitor project progress with start/end dates and status
- **SLA Generator** - Create and manage SLA metrics for projects
- **Competency Library** - Define and track work quality standards across the organization
- **Role-Based Access Control** - Fine-grained permissions for Stakeholders, Project Managers, and Team Members

### Leave & Attendance
- **Leave Request System** - Submit, approve, and track leave requests with balance management
- **Attendance Logging** - Clock in/out with automatic time tracking and real-time status
- **Attendance History** - Comprehensive logs with admin approval workflows
- **Leave Balance Dashboard** - Real-time view of remaining leave days per employee (12 days annual, auto-calculated)
- **Admin Attendance Overview** - Daily stats with on-time, late, on-leave, and absent breakdowns

### Calendar & Events
- **Shared Calendar** - Organization-wide event scheduling and visibility
- **Event Management** - Create, edit, and delete events with participant tracking
- **Event Categories** - Color-coded event types (Meeting, Deadline, Holiday, Training, etc.)
- **Multi-view Support** - Day, week, and month calendar views with sidebar mini-calendar
- **Dialog Variants** - Specialized views for meetings, leave, holidays, and performance events

### User Management
- **Authentication** - Secure login with Supabase Auth
- **Profile Management** - Update personal info, avatar, and job details
- **Super Admin Impersonation** - View dashboards as any employee for support purposes
- **Payroll Calculator** - Salary calculation tools

---

## Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router and Turbopack
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS with semantic design tokens
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[TanStack React Query](https://tanstack.com/query)** - Data fetching, caching, and synchronization
- **[TanStack React Table](https://tanstack.com/table)** - Headless table with sorting, filtering, and pagination
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** - Form management with schema validation
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[date-fns](https://date-fns.org/)** - Modern date utility library
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[dnd-kit](https://dndkit.com/)** - Drag and drop toolkit

### Backend & Infrastructure
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (PostgreSQL, Auth, Storage, Realtime)
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Database-level access control
- **Supabase Realtime** - Live updates for collaborative features
- **[Upstash](https://upstash.com/)** - Rate limiting with Redis

### Development & Testing
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[Vitest](https://vitest.dev/)** - Unit and integration testing
- **[Playwright](https://playwright.dev/)** - Browser testing
- **[Testing Library](https://testing-library.com/)** - Component testing utilities
- **[Storybook 10](https://storybook.js.org/)** - Component development and documentation
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting with Tailwind CSS plugin

---

## Architecture

The project follows a **Feature-Sliced Design (FSD)** architecture:

```
src/
├── app/              # Next.js App Router (routes and layouts)
│   └── (main)/       # Main authenticated layout group
│       ├── dashboard/      # Dashboard pages and components
│       ├── performance/    # Performance management
│       ├── leave/          # Leave management
│       ├── attendance/     # Attendance tracking
│       ├── calendar/       # Calendar and events
│       ├── teams/          # Team management
│       ├── settings/       # User settings
│       ├── sla-generator/  # SLA configuration
│       ├── calculator/     # Payroll calculator
│       ├── payroll/        # Payroll management
│       └── message/        # Messaging
├── entities/         # Business entities (data models & API)
├── features/         # Feature modules (interactive behaviors)
├── page-slices/      # Page-level UI compositions
├── widgets/          # Reusable composite UI blocks
├── shared/           # Shared utilities, UI components, types, and config
│   ├── ui/           # Design system components (35+ components)
│   ├── api/          # Supabase client configuration
│   ├── lib/          # Utility functions
│   ├── types/        # TypeScript type definitions
│   └── config/       # App configuration and design tokens
├── data/             # Static data and constants
└── test/             # Test utilities and setup
```

### Design Tokens

The app uses **semantic design tokens** defined in CSS custom properties for consistent theming:

- **Text**: `text-foreground-primary`, `text-foreground-secondary`, `text-foreground-tertiary`
- **Backgrounds**: `bg-surface-neutral-primary`, `bg-surface-neutral-secondary`
- **Borders**: `border-neutral-primary`
- **Typography**: `text-heading-lg`, `text-heading-md`, `text-label-sm`, `text-body-sm`, etc.
- **Status colors**: `bg-success`, `bg-warning`, `bg-danger`, `bg-info`

> The app runs in **light mode only**. All `dark:` class prefixes have been removed.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **pnpm** 8.x or higher ([Installation](https://pnpm.io/installation))
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Git** ([Download](https://git-scm.com/))

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/kretyaapp.git
cd kretyaapp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Where to find these values:**
> 1. Go to [Supabase Dashboard](https://app.supabase.com/)
> 2. Select your project
> 3. Go to **Settings** > **API**
> 4. Copy the `Project URL` and `anon/public` key

### 4. Set Up Supabase Schema

Run the database migrations or manually create tables via Supabase SQL Editor:

```bash
supabase db push
```

Key tables include:
- `profiles` - User profiles and roles
- `projects` - Project definitions
- `project_assignments` - User-project relationships
- `project_sla_scores` - SLA scoring per assignment
- `project_work_quality_scores` - Work quality checklists
- `review_cycles` - Performance review periods
- `performance_reviews` - 360 review submissions
- `peer_reviews` - Peer feedback scores
- `review_summary` - Aggregated review results
- `leave_requests` - Leave management
- `attendance_logs` - Attendance tracking
- `calendar_events` - Calendar events
- `one_on_one_slots` - 1:1 meeting scheduling

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### Development Commands

```bash
# Start development server (with Turbopack)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Fix lint issues
pnpm lint:fix

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook

# Clean build cache
pnpm clean
```

### First-Time Setup

1. **Create Admin User**
   - Register via `/login` page
   - Manually update role to `stakeholder` in Supabase `profiles` table

2. **Configure Review Cycle**
   - Navigate to Performance > Admin Dashboard
   - Create a new review cycle with start/end dates
   - Activate the cycle to enable reviews

3. **Add Team Members**
   - Go to Performance > List Project
   - Create projects and assign team members
   - Set project leads for team KPI tracking

### User Roles & Flows

**Employee:**
- View personal dashboard with attendance, performance, and projects
- Submit leave requests and clock in/out
- Participate in 360 reviews and view competency scores
- Book 1:1 meeting slots

**Project Lead:**
- View Team KPI dashboard
- Monitor project member performance
- Track project timelines and SLA scores

**Stakeholder/Admin:**
- View organization-wide dashboard with team metrics
- Manage all projects and assignments
- Review and approve leave requests
- Process performance reviews
- Access attendance and performance analytics
- Manage employee spotlight (top performers and attention needed)

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |

---

## License

This project is licensed under the **MIT License** - see the [LICENSE.md](LICENSE.md) file for details.

---

## Team

**Built by:**

- **[Asal Design](https://asaldesign.com)** - Design & User Experience
- **[Kretya Studio](https://kretya.com)** - Development & Engineering

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

For questions or support, please contact:
- **Email**: support@kretya.com
