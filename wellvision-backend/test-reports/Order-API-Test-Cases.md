# Order API Test Cases Report

**Base URL:** `http://localhost:4000/api/orders`

## Order Management Tests
- **GET /preview-order-no**
  - ✅ Get next order number preview (authenticated)
  - ❌ User not authenticated

- **GET /**
  - ✅ Get all orders for authenticated user
  - ❌ User not authenticated

- **GET /pending**
  - ✅ Get pending orders only
  - ❌ User not authenticated

- **POST /**
  - ✅ Create new order with valid data
  - ❌ Missing required fields
  - ❌ Invalid customer ID
  - ❌ Invalid product IDs
  - ❌ User not authenticated

- **GET /:id**
  - ✅ Get specific order by ID
  - ❌ Order not found
  - ❌ Order belongs to different user
  - ❌ Invalid order ID format
  - ❌ User not authenticated

- **PATCH /:id/status**
  - ✅ Update order status validly
  - ❌ Invalid status value
  - ❌ Order not found
  - ❌ User not authenticated

- **PATCH /:id/collect**
  - ✅ Mark order as collected
  - ❌ Order not found
  - ❌ Order not ready for collection
  - ❌ User not authenticated

- **DELETE /:id**
  - ✅ Delete order successfully
  - ❌ Order not found
  - ❌ User not authenticated
