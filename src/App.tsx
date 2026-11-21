/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AdminPortalPage } from './pages/AdminPortalPage.tsx';
import { BrowseServicesPage } from './pages/BrowseServicesPage.tsx';
import { CategoriesPage } from './pages/CategoriesPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import {
  AboutPage,
  ContactPage,
  FaqPage,
  HowItWorksPage,
  LegalPage,
} from './pages/InfoPages.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { PublicShellPage } from './pages/PublicShellPage.tsx';
import { ServiceDetailPage } from './pages/ServiceDetailPage.tsx';
import { WorkerPortalPage } from './pages/WorkerPortalPage.tsx';
import { WorkerProfilePage } from './pages/WorkerProfilePage.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<BrowseServicesPage mode="browse" />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/search" element={<BrowseServicesPage mode="search" />} />
            <Route path="/workers/:workerId" element={<WorkerProfilePage />} />
            <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />

            <Route
              path="/track-booking"
              element={
                <PublicShellPage
                  title="Track or Cancel Guest Booking"
                  summary="Enter your booking reference and 6-digit access PIN to check status or request cancellation."
                  plannedPhase="Phase 05 Customer System"
                />
              }
            />
            <Route path="/account" element={<AccountPage />} />

            <Route path="/worker" element={<WorkerPortalPage sectionTitle="Worker Overview" />} />
            <Route path="/worker/bookings" element={<WorkerPortalPage sectionTitle="Bookings" />} />
            <Route path="/worker/calendar" element={<WorkerPortalPage sectionTitle="Booking Calendar" />} />
            <Route path="/worker/services" element={<WorkerPortalPage sectionTitle="Services & Pricing" />} />
            <Route path="/worker/locations" element={<WorkerPortalPage sectionTitle="Service Locations" />} />
            <Route path="/worker/profile" element={<WorkerPortalPage sectionTitle="Business Profile" />} />
            <Route path="/worker/subscription" element={<WorkerPortalPage sectionTitle="Subscription" />} />

            <Route path="/admin" element={<AdminPortalPage sectionTitle="Dashboard & Phase 03 Setup" />} />
            <Route path="/admin/workers" element={<AdminPortalPage sectionTitle="Worker Management" />} />
            <Route path="/admin/customers" element={<AdminPortalPage sectionTitle="Customer Management" />} />
            <Route path="/admin/services" element={<AdminPortalPage sectionTitle="Service Management" />} />
            <Route path="/admin/categories" element={<AdminPortalPage sectionTitle="Category Management" />} />
            <Route path="/admin/bookings" element={<AdminPortalPage sectionTitle="Booking Management" />} />
            <Route path="/admin/reviews" element={<AdminPortalPage sectionTitle="Reviews Management" />} />
            <Route path="/admin/subscriptions" element={<AdminPortalPage sectionTitle="Subscription Management" />} />
            <Route path="/admin/payments" element={<AdminPortalPage sectionTitle="Payments" />} />
            <Route path="/admin/cms" element={<AdminPortalPage sectionTitle="Website Content Management" />} />
            <Route path="/admin/support" element={<AdminPortalPage sectionTitle="Support Management" />} />
            <Route path="/admin/staff" element={<AdminPortalPage sectionTitle="Staff Management" />} />
            <Route path="/admin/settings" element={<AdminPortalPage sectionTitle="System Settings" />} />
            <Route path="/admin/audit-logs" element={<AdminPortalPage sectionTitle="Audit Logs" />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
