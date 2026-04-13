# IAMS — Industrial Attachment Management System

A web-based platform that automates the management of industrial attachments for Computer Science students at the University of Botswana. The system handles student registration, organisation registration, student-organisation matching, weekly logbook submissions, supervisor reports, assessment recording, and deadline notifications.

---

## Team Members

| Name | Student ID | Role |
|------|-----------|------|
| Mehedi Hasan Mahin | 202305644 | Project Lead / Auth & Matching |
| David Matlhaope | 202103292 | Firebase Setup / Organisation Registration |
| Amantle Nelson | 202206704 | Student Registration / Assessments |
| Basetsana | 202002798 | Student Registration / Logbooks |
| Lefika Lesego Kgadisa | 202304481 | Organisation Registration / Notifications |

---

## Module

**CSI341 – Introduction to Software Engineering**

---

## Live Demo

[https://iams-lyart.vercel.app](https://iams-lyart.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Routing | React Router DOM v6 |
| Backend / Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| Hosting | Vercel |
| Version Control | GitHub |

---

## Features

### Release 1 (MVP)
- **User Authentication** — Secure login with Firebase Auth (email/password). Role-based access control for Student, Coordinator, and Supervisor.
- **Student Registration** — Students register with personal details, preferred Botswana city, attachment type, and skills.
- **Organisation Registration** — Coordinators register organisations with required skills, available slots, and attachment types.
- **Student-Organisation Matching** — Coordinators match students to organisations using a skill-based compatibility algorithm.

### Release 2
- **Logbook Submission** — Students submit weekly logbooks. Supervisors review and leave feedback.
- **Supervisor Reports** — Supervisors evaluate students with star ratings across 5 criteria and a final recommendation.
- **Assessment Recording** — Coordinators record grades (Logbook /30, Supervisor /40, University Visit /30) with auto-calculated totals and letter grades.
- **Notifications** — Coordinators send deadline reminders to students and supervisors.

---

## User Roles

| Role | Access |
|------|--------|
| **Student** | Dashboard, My Registration, My Logbooks, Supervisor Feedback, Notifications |
| **Coordinator** | Dashboard, Students, Organisations, Matching, Logbooks, Reports, Assessments, Notifications |
| **Supervisor** | Dashboard, My Students, Review Logbooks, Submit Reports, Notifications |

---

## Project Structure

```
iams-sprint1/
├── src/
│   ├── components/
│   │   ├── AppLayout.jsx        # Main layout with sidebar
│   │   ├── Sidebar.jsx          # Role-based navigation
│   │   ├── RoleRoute.jsx        # Role-based route guard
│   │   └── ProtectedRoute.jsx   # Auth route guard
│   ├── context/
│   │   └── AuthContext.jsx      # Global auth state (user, role)
│   ├── firebase/
│   │   └── firebase.js          # Firebase config
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── StaffRegisterPage.jsx
│   │   ├── StudentDashboardPage.jsx
│   │   ├── CoordDashboardPage.jsx
│   │   ├── SuperDashboardPage.jsx
│   │   ├── StudentProfilePage.jsx
│   │   ├── StudentRegisterPage.jsx
│   │   ├── OrganisationsPage.jsx
│   │   ├── OrganisationRegisterPage.jsx
│   │   ├── MatchingPage.jsx
│   │   ├── StudentLogbooksPage.jsx
│   │   ├── CoordLogbooksPage.jsx
│   │   ├── SuperLogbooksPage.jsx
│   │   ├── SuperReportPage.jsx
│   │   ├── CoordReportsPage.jsx
│   │   ├── AssessmentsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── CoordNotificationsPage.jsx
│   │   ├── SuperNotificationsPage.jsx
│   │   └── DashboardPage.css    # Shared design system
│   └── App.jsx                  # Routes
├── firestore.rules              # Firestore security rules
├── vercel.json                  # SPA routing config
└── package.json
```

---

## Firestore Collections

| Collection | Description |
|-----------|-------------|
| `users` | Auth accounts with role field |
| `students` | Student profiles and attachment preferences |
| `organisations` | Organisation details, required skills, available slots |
| `logbooks` | Weekly logbook entries with supervisor comments |
| `reports` | Supervisor evaluation reports with star ratings |
| `assessments` | Coordinator-recorded grades and final scores |
| `notifications` | System notifications and deadline reminders |

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/mehedi-hasan07/IAMS.git
cd IAMS/iams-sprint1

# Install dependencies
npm install

# Create environment file
# Add your Firebase config values to .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the `iams-sprint1/` folder:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Build for Production

```bash
npm run build
```

---

## Staff Account Registration

Coordinator and Supervisor accounts are created via a hidden admin page:

```
/staff/register
```

This page is not linked anywhere in the UI and is intended for administrators only.

---

## Security

- All passwords are encrypted by Firebase Authentication
- Role-based routing prevents unauthorised access to pages
- All routes are protected — unauthenticated users are redirected to `/login`
- Firestore security rules enforce collection-level access per role
- Staff registration is only accessible via a hidden, unlinked route

---

## Sprint Summary

| Sprint | Goal | User Stories |
|--------|------|-------------|
| Sprint 1 | Auth & Student Registration | US-01, US-02 |
| Sprint 2 | Organisation Registration & Matching | US-03, US-04 |
| Sprint 3 | Logbooks & Supervisor Reports | US-05, US-06 |
| Sprint 4 | Assessments & Notifications | US-07, US-08 |

---

## License

Academic project — CSI341, University of Botswana, 2026.
