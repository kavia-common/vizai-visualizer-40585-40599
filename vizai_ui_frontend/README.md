# Lightweight React Template for KAVIA

This project now includes a routed VizAI Phase-1 UI skeleton with playful Neon theme.

## Routes

- /login
- /select-animal
- /dashboard
- /timeline
- /reports
- /alerts
- /chat (feature gated)

## Feature flags

Set REACT_APP_FEATURE_FLAGS as JSON string, e.g.:

```
REACT_APP_FEATURE_FLAGS={"chat":true}
```

Chat tab is visible but disabled by default. No backend calls are made.
