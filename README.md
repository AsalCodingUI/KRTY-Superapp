# KretyaAPP

> A comprehensive employee performance and workforce management platform built with Next.js and Supabase.

KretyaAPP is a modern, full-featured enterprise application designed to streamline HR operations, performance reviews, team collaboration, and resource management. Built with cutting-edge technologies to provide a seamless, real-time experience for teams of all sizes.

---

## ✨ Features

### 📊 Performance Management
- **360-Degree Reviews** - Comprehensive peer feedback system with customizable review cycles
- **KPI Tracking** - Set, monitor, and evaluate Key Performance Indicators with quarterly reporting
- **Employee Profiles** - Detailed performance history and project assignment tracking
- **Team KPI Dashboard** - Project lead view for managing team performance metrics
- **One-on-One Scheduling** - Book and manage 1:1 meetings with real-time slot availability

### 👥 Team & Project Management
- **Project Assignments** - Assign team members with role-based permissions (Lead, Member)
- **Project Timeline Tracking** - Monitor project progress with start/end dates and status
- **Competency Library** - Define and track work quality standards across the organization
- **Role-Based Access Control** - Fine-grained permissions for Stakeholders, Project Managers, and Team Members

### 📅 Leave & Attendance
- **Leave Request System** - Submit, approve, and track leave requests with balance management
- **Attendance Logging** - Clock in/out with automatic time tracking
- **Attendance History** - Comprehensive logs with admin approval workflows
- **Leave Balance Dashboard** - Real-time view of remaining leave days per employee

### 🗓️ Calendar & Events
- **Shared Calendar** - Organization-wide event scheduling and visibility
- **Event Management** - Create, edit, and delete events with participant tracking
- **Event Categories** - Color-coded event types (Meeting, Deadline, Holiday, Training, etc.)
- **Multi-view Support** - Day, week, and month calendar views

### 👤 User Management
- **Authentication** - Secure login with Supabase Auth
- **Profile Management** - Update personal info, avatar, and job details
- **Dark Mode** - System-wide theme toggle with preference persistence
- **Workspace Switcher** - Multi-organization support (if configured)

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[SWR](https://swr.vercel.app/)** - React hooks for data fetching with caching
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[date-fns](https://date-fns.org/)** - Modern date utility library
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### Backend & Infrastructure
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (PostgreSQL, Auth, Storage, Realtime)
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Database-level access control
- **Supabase Realtime** - Live updates for collaborative features

### Development Tools
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Storybook](https://storybook.js.org/)** - Component development environment

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **pnpm** 8.x or higher ([Installation](https://pnpm.io/installation))
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Git** ([Download](https://git-scm.com/))

---

## 🚀 Installation

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

# Optional: Analytics, etc.
# NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

> **Where to find these values:**
> 1. Go to [Supabase Dashboard](https://app.supabase.com/)
> 2. Select your project
> 3. Go to **Settings** → **API**
> 4. Copy the `Project URL` and `anon/public` key

### 4. Set Up Supabase Schema

Run the database migrations (if provided) or manually create tables via Supabase SQL Editor:

```sql
-- See /supabase/migrations/ for SQL scripts
-- Or use Supabase CLI: supabase db push
```

Key tables include:
- `profiles` - User profiles
- `projects` - Project definitions
- `project_assignments` - User-project relationships
- `review_cycles` - Performance review periods
- `performance_reviews` - 360 review submissions
- `performance_summaries` - Aggregated review results
- `leave_requests` - Leave management
- `attendance_logs` - Attendance tracking
- `events` - Calendar events

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Usage

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type check
pnpm tsc --noEmit

# Run Storybook
pnpm storybook
```

### First-Time Setup

1. **Create Admin User**
   - Register via `/login` page
   - Manually update role to `stakeholder` in Supabase `profiles` table

2. **Configure Review Cycle**
   - Navigate to Performance → Admin Dashboard
   - Create a new review cycle with start/end dates
   - Activate the cycle to enable reviews

3. **Add Team Members**
   - Go to Performance → List Project
   - Create projects and assign team members
   - Set project leads for team KPI tracking

### Key User Flows

**Employee:**
- View personal KPI dashboard
- Submit leave requests
- Clock in/out for attendance
- Participate in 360 reviews
- Book 1:1 meeting slots

**Project Lead:**
- View Team KPI dashboard
- Monitor project member performance
- Track project timelines

**Stakeholder/Admin:**
- Manage all projects and assignments
- Review and approve leave requests
- Process performance reviews
- Access organization-wide analytics

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | ✅ |

---

## 📸 Screenshots

> Add screenshots of your app here to showcase key features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Built with ❤️ by:**

- **[Asal Design](https://asaldesign.com)** - Design & User Experience
- **[Kretya Studio](https://kretya.com)** - Development & Engineering

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions or support, please contact:
- **Email**: support@kretya.com
- **Documentation**: [docs.kretyaapp.com](https://docs.kretyaapp.com) *(if available)*

---

<div align="center">
  <strong>Made with Next.js, Supabase, and Modern Web Technologies</strong>
</div>
