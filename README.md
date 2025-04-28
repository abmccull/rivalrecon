# RivalRecon User Profile Management System (Next.js + Supabase)

**Tech Stack & Monorepo Structure:**
- App (Next.js frontend): Next.js (app directory), Tailwind CSS, Shadcn UI
- Backend: Node.js, Supabase, Redis, Celery
- Auth & Data: Supabase Auth & Database

**Monorepo Setup:**
This project uses [npm workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces) to manage both the Next.js frontend (`/app`) and the Node.js backend (`/backend`) in a single repository. You can run scripts like `build`, `dev`, `lint`, and `test` at the root and they will execute for all workspaces.

**Workspace-wide scripts:**
- `npm run build` — builds both frontend and backend
- `npm run dev` — starts dev mode for all workspaces (if supported)
- `npm run lint` — lints all workspaces
- `npm run test` — runs tests for all workspaces

See `/app` and `/backend` for app- and backend-specific scripts.

This document outlines the user profile management system implemented in RivalRecon using Supabase Authentication and Database. The app (Next.js frontend) is now fully migrated to Next.js (see /app).

## Features

- **User Authentication**: Powered by Supabase Auth
- **Profile Management**: Automatic profile creation and syncing
- **Account Settings**: User can edit personal and company information
- **Avatar Upload**: Support for profile pictures
- **Account Deletion**: Secure process for account removal

## Technical Implementation

### Database Schema

The profile system uses the following tables:

- `auth.users`: Managed by Supabase Auth
- `public.profiles`: Custom table with user profile information

### Key Components

1. **AuthProvider**: Located at `app/src/components/layout/AuthProvider.tsx`
   - Manages authentication state
   - Syncs user metadata with profile

2. **Profile Helpers**: Located at `app/src/lib/auth/profile.ts`
   - `syncUserProfile`: Syncs auth metadata with profile
   - `getProfileById`: Fetches profile data
   - `updateProfile`: Updates profile information
   - `deleteUserAccount`: Initiates account deletion

3. **Settings Page**: Located at `app/src/app/settings/page.tsx`
   - Complete form for profile editing
   - Avatar upload interface
   - Account deletion option

4. **Header Component**: Located at `app/src/components/layout/Header.tsx`
   - Displays user name and avatar
   - Provides account menu

5. **API Routes**:
   - `app/src/app/api/user/delete/route.ts`: Server-side account deletion

## Security

- Row-Level Security (RLS) policies ensure users can only access their own profile data
- Storage policies control avatar uploads
- API routes validate authentication
- Service role key is used only on the server for admin operations

## Environment Variables

The system requires the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (for Next.js app (Next.js frontend))
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key (for Next.js app (Next.js frontend))
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-side only)

## Getting Started

1. Ensure Supabase project is set up with authentication enabled
2. Create the profile table and RLS policies
3. Set up storage bucket for profile avatars
4. Configure environment variables

## Workflow

1. User signs up/signs in
2. Profile is automatically created/synced
3. User can edit profile in settings page
4. Avatar can be uploaded and managed
5. Account can be deleted if needed

## Contributing

When making changes to the profile system:

1. Maintain RLS policies
2. Keep profile fields in sync with database schema
3. Test authentication flows thoroughly
4. Consider security implications of any changes
