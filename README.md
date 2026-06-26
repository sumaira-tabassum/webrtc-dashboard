# WebRTC Dashboard - Video Conferencing Platform

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-orange)

A modern full-stack video conferencing dashboard built with Next.js, Supabase, and WebRTC. The application allows authenticated users to create and join meetings, invite teammates through real-time notifications, manage users with role-based access, and share guest meeting links for browser-based video communication.

## Live Demo

🔗 <https://webrtc-dashboard-355rez2xy-sumaira-tabassums-projects.vercel.app/>

> **Note:** This project is under active development, so the live demo may change as new updates are deployed.

## Features

### Authentication

- Supabase email/password authentication
- Protected routes
- Role-based authorization

### User Management

- Admin-only user management
- User profile editing
- User deletion

### Meetings

- Instant meetings
- Registered-user meetings
- Public guest join links
- Meeting invitations
- Real-time notifications

### Communication

- Browser-based WebRTC video/audio
- Supabase Realtime signaling
- Presence tracking

### UI

- Responsive design
- Tailwind CSS
- shadcn/ui components

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Realtime
- WebRTC
- Radix UI / shadcn components
- Lucide icons
- Sonner toasts

## Project Structure

```txt
app/
  (auth)/login/              Login page
  (dashboard)/dashboard/     Dashboard overview
  (dashboard)/meet/          Meeting creation and joining
  (dashboard)/users/         Admin user management
  api/                       Route handlers
  join/[token]/              Public guest meeting join page

components/
  dashboard/                 Dashboard and meeting UI
  ui/                        Shared UI primitives

lib/
  supabase/                  Supabase browser/server/proxy clients
  signaling.ts               Supabase Realtime meeting signaling
  webrtc.ts                  RTCPeerConnection helper
  auth.ts                    Login/logout helpers

proxy.ts                     Auth and role route protection
```

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project with Auth and Realtime enabled

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DEFAULT_USER_PASSWORD=temporary_password_for_admin_created_users
```

`SUPABASE_SERVICE_ROLE_KEY` is used by server-side API routes for admin operations. Never expose it in client code or commit it to GitHub.

## Database

The application uses Supabase with three primary tables:

- profiles
- notifications
- meetings

## Installation

Clone the repository:

```bash
git clone https://github.com/sumaira-tabassum/webrtc-dashboard.git
cd webrtc-dashboard
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file and add the required environment variables.

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

The root route redirects to `/meet`. Unauthenticated users are redirected to `/login`.

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production build
npm run lint     # Run linting
```

## Main Routes

| Route | Description |
|---|---|
| `/login` | Sign in with Supabase Auth |
| `/dashboard` | Dashboard overview |
| `/meet` | Create, join, and run meetings |
| `/users` | Admin-only user management |
| `/join/[token]` | Public guest meeting join page |

## API Routes

| Endpoint | Method | Description |
|---|---:|---|
| `/api/users` | `GET` | List profiles |
| `/api/users` | `POST` | Create an auth user and matching profile |
| `/api/users/[id]` | `PUT` | Update a profile |
| `/api/users/[id]` | `DELETE` | Delete a profile |
| `/api/meetings/instant` | `POST` | Create an instant meeting and guest URL |
| `/api/guest/meetings/[token]` | `GET` | Resolve a guest meeting token |

## Authentication and Authorization

Route protection is handled in `proxy.ts`.

- `/login`, `/join/[token]`, and guest meeting API routes are public.
- All other app routes require a signed-in Supabase user.
- `/users` requires the signed-in user to have `role = "admin"` in the `profiles` table.

## WebRTC Notes

The meeting room uses browser WebRTC APIs and Supabase Realtime channels for signaling.

- Presence tracks participants in a room.
- Broadcast events exchange offers, answers, and ICE candidates.
- Rooms are limited to 6 participants.
- The current peer connection uses Google STUN:

```txt
stun:stun.l.google.com:19302
```

For production deployments, consider adding a TURN server for more reliable connectivity across strict networks.

## Deployment

The application is currently deployed on **Vercel**.

### Production Stack

- **Hosting:** Vercel
- **Frontend:** Next.js 16 (App Router)
- **Backend:** Next.js API Routes
- **Database & Authentication:** Supabase
- **Realtime Signaling:** Supabase Realtime
- **Media Communication:** WebRTC

## Future Improvements

- Screen sharing
- Chat messaging
- Meeting recording
- Virtual backgrounds
- File sharing
- TURN server support
- Meeting scheduling

## Author

**Sumaira Tabassum**

GitHub: <https://github.com/sumaira-tabassum>
