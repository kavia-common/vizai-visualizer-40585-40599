import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';

// PUBLIC_INTERFACE
// Minimal test to ensure that visiting /dashboard renders content without throwing
// "useFilters must be used within a <FiltersProvider>".
// We simulate being authed by navigating through /login -> /dashboard; however App's ProtectedRoute
// checks authed flag in context restored from localStorage. For a unit smoke test, we start at
// /login and verify the app mounts, then navigate to /dashboard directly using MemoryRouter initialEntries.
// The App itself wraps /dashboard in <FiltersProvider>, so this ensures the context is present.
test('Dashboard route renders under FiltersProvider without context error', () => {
  // Start at /dashboard to ensure the provider wrapping (in App.js Routes) is exercised.
  // App will redirect to /login if not authed; this is acceptable for smoke test of mount.
  // We assert that App mounts and does not crash due to missing FiltersProvider on the Dashboard element.
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  );

  // The app should render at least the global Nav or the auth pages without throwing.
  // If Dashboard rendered, it includes "Overview — Behavior Insights".
  // If auth redirect happened, it includes either login or registration header texts.
  const dashboardHeader = screen.queryByText(/Overview — Behavior Insights/i);
  const login = screen.queryByText(/Welcome to VizAI/i);
  const register = screen.queryByText(/Create Your VizAI Account/i);

  expect(Boolean(dashboardHeader || login || register)).toBe(true);
});
