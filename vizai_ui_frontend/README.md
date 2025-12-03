# Lightweight React Template for KAVIA

This project now includes a routed VizAI Phase-1 UI with playful Neon theme and mock data.

## Routes

- /login (exact copy finalized)
- /select-animal
- /dashboard (Behavior Count, Behavior Duration with stacked/pie toggle, Daily Activity Pattern)
- /timeline (Behavior Explorer with filters, result counter, zoom, list/grid toggle, event cards, View Video)
- /reports (builder, preview, export modal scaffold and async hint)
- /alerts (Alert Center with thresholds and actions)
- /help (Help Center with feedback queue and system status)
- /chat (feature gated, disabled by default)

## Feature flags

Set REACT_APP_FEATURE_FLAGS as JSON string, e.g.:

```
REACT_APP_FEATURE_FLAGS={"chat":true}
```

Chat tab is visible but disabled by default unless enabled. All data remains mocked in Phase-1.

## Environment

See `.env.example` for available variables (base URLs, flags). Do not commit real secrets.
