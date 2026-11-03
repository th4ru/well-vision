# Forex API Test Cases Report

**Base URL:** `http://localhost:4000/api/forex`

## Rate Tests
- **GET /rates**
  - ✅ Get cached exchange rates
  - ❌ Invalid base currency

- **POST /refresh**
  - ✅ Refresh rates from API
  - ❌ API unavailable
  - ❌ Invalid base/symbols
