# Invoice API Test Cases Report

**Base URL:** `http://localhost:4000/api/invoices`

## Bill Number Tests
- **GET /preview-bill-no**
  - ✅ Preview next bill number
  - ❌ User not authenticated

- **GET /next-bill-no**
  - ✅ Get and increment bill number
  - ❌ Database error

## CRUD Tests
- **GET /**
  - ✅ Get invoices with pagination/search
  - ❌ Invalid query parameters
  - ❌ User not authenticated

- **GET /:id**
  - ✅ Get specific invoice
  - ❌ Invoice not found
  - ❌ User not authenticated

- **PUT /:id**
  - ✅ Update invoice
  - ❌ Invoice not found
  - ❌ Invalid data
  - ❌ User not authenticated

- **DELETE /:id**
  - ✅ Delete invoice
  - ❌ Invoice not found
  - ❌ User not authenticated

- **POST /create**
  - ✅ Create new invoice
  - ❌ Missing required fields
  - ❌ Invalid customer/order data
  - ❌ User not authenticated
