# Customer API Test Cases Report

**Base URL:** `http://localhost:4000/api/customers`

## Customer Management Tests
- **GET /**
  - ✅ Get customers with search/pagination
  - ❌ Invalid query parameters

- **GET /recent**
  - ✅ Get last 10 customers

- **POST /**
  - ✅ Create new customer
  - ❌ Missing required fields
  - ❌ Invalid data formats

- **PUT /:id**
  - ✅ Update customer
  - ❌ Customer not found
  - ❌ Invalid data

- **DELETE /:id**
  - ✅ Delete customer
  - ❌ Customer not found

- **GET /:id**
  - ✅ Get specific customer
  - ❌ Customer not found
