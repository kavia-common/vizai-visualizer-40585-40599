# VizAI UI - Phase 1 UX Notes

- Registration includes Role (Researcher/Staff/Admin). Role is only visible on the registration page; after login it is hidden from UI but stored in context (AuthContext.user.role) for internal permission gating in future.
- Species selector and Date Range have been moved from the top Navbar into the left-side panel (Global Filters) shown on authenticated pages (Timeline/Reports etc.). These are stored in AuthContext for app-wide use.
- Dashboard Behavior Duration pie and stacked bar legends are interactive: clicking a behavior navigates to Timeline with `?behavior=<name>` query, and Timeline pre-applies that behavior filter.
- Reports page enhanced with Behavior dropdown, Date Range, Hours, and mock "Download PDF/Excel" buttons. These trigger placeholder async behavior until backend endpoints are available.

Environment and feature gating remain controlled via `REACT_APP_FEATURE_FLAGS` and existing variables. Theme variables from CSS are used consistently.
