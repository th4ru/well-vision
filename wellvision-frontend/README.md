# WellVision Frontend

React (Create React App) client for the WellVision optical shop management
system.

This folder contains only the frontend. For the full project overview, setup,
environment variables, API reference, business rules and troubleshooting, see
the root **[README.md](../README.md)**.

## Quick start

```bash
npm install
npm start
```

The app runs at `http://localhost:3000` and expects the backend API at
`http://localhost:4000` by default. Override it with `REACT_APP_BASE_URL` in a
local `.env` file:

```
REACT_APP_BASE_URL=http://localhost:4000/api/admin
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Development server with hot reload |
| `npm run build` | Production build in `build/` |
| `npm test` | Jest/CRA test runner |
| `npm run eject` | Eject CRA configuration (irreversible) |
