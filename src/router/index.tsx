import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import SportCenterSearchPage from '../pages/SportCenterSearchPage';
import BookingPageWrapper from '../pages/BookingPageWrapper';
import { LocationServices } from '../pages/LocationServicesPage';
import { ClientDashboard } from '../pages/ClientDashboard';
import AdminPageWrapper from '../pages/AdminPageWrapper';
import { 
  AdminDashboardSubPage, 
  AdminCourtsSubPage, 
  AdminSchedulesSubPage, 
  AdminCalendarSubPage,
  AdminAgendaSubPage,
  AdminSettingsSubPage,
  AdminSubscriptionsSubPage
} from '../pages/AdminPage';
import { SuccessPage } from '../pages/booking/SuccessPage';
import { FailurePage } from '../pages/booking/FailurePage';
import BookingStatusPage from '../pages/BookingStatusPage';
import CancelBookingPage from '../pages/CancelBookingPage';
import ContactPage from '../pages/ContactPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      { index: true, element: <SportCenterSearchPage /> },
      { path: 'reservar', element: <BookingPageWrapper /> },
      { path: ':slug/reservar', element: <BookingPageWrapper /> },
      { path: 'ubicacion', element: <LocationServices /> },
      { path: 'booking/success', element: <SuccessPage /> },
      { path: 'booking/failure', element: <FailurePage /> },
      { path: 'booking/status', element: <BookingStatusPage /> },
      { path: 'booking/cancel', element: <CancelBookingPage /> },
      { path: 'contacto', element: <ContactPage /> },

      // Protected routes (must be logged in)
      {
        path: 'mis-reservas',
        element: (
          <ProtectedRoute>
            <ClientDashboard />
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
        children: [
          { index: true, element: <AdminDashboardSubPage /> },
          { path: 'courts', element: <AdminCourtsSubPage /> },
          { path: 'schedules', element: <AdminSchedulesSubPage /> },
          { path: 'calendar', element: <AdminCalendarSubPage /> },
          { path: 'agenda', element: <AdminAgendaSubPage /> },
          { path: 'subscriptions', element: <AdminSubscriptionsSubPage /> },
          { path: 'settings', element: <AdminSettingsSubPage /> },
        ]
      },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
