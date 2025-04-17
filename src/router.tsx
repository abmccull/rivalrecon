import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/landing-page';
import Dashboard from './features/dashboard/Dashboard';
import SignInPage from './pages/auth/SignInPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Extend the FutureConfig type to include all v7 future flags
type ExtendedFutureConfig = {
  v7_normalizeFormMethod: boolean;
  v7_relativeSplatPath: boolean;
  v7_startTransition: boolean;
  v7_fetcherPersist: boolean;
  v7_partialHydration: boolean;
  v7_skipActionErrorRevalidation: boolean;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    path: '/sign-up',
    element: <SignInPage isSignUp />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
], {
  basename: process.env.PUBLIC_URL || '/',
  future: {
    v7_normalizeFormMethod: true,
    v7_relativeSplatPath: true,
    v7_startTransition: true,
    v7_fetcherPersist: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  } as ExtendedFutureConfig,
}); 