import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import HomePage from '../pages/HomePage';
import BookingPageWrapper from '../pages/BookingPageWrapper';
import { LocationServices } from '../pages/LocationServicesPage';
import { ClientDashboard } from '../pages/ClientDashboard';
import AdminPageWrapper from '../pages/AdminPageWrapper';
import { SuccessPage } from '../pages/booking/SuccessPage';
import { FailurePage } from '../pages/booking/FailurePage';
import BookingStatusPage from '../pages/BookingStatusPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      { index: true, element: <HomePage /> },
      { path: 'reservar', element: <BookingPageWrapper /> },
      { path: 'ubicacion', element: <LocationServices selectedCenter={null} /> },
      { path: 'booking/success', element: <SuccessPage onGoHome={() => {}} onGoToProfile={() => {}} /> },
      { path: 'booking/failure', element: <FailurePage onRetry={() => {}} onGoHome={() => {}} /> },
      { path: 'booking', element: <BookingStatusPage /> },

      // Protected routes (must be logged in)
      {
        path: 'mis-reservas',
        element: (
          <ProtectedRoute>
            <ClientDashboard user={null} />
          </ProtectedRoute>
        ),
      },

      // Admin-only routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute adminOnly>
            <AdminPageWrapper />
          </ProtectedRoute>
        ),
      },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
