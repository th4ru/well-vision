# User API Test Cases Report

**Base URL:** `http://localhost:4000/api/user`

## Profile Tests
- **GET /profile**
  - ✅ Get user profile
  - ❌ User not authenticated

- **PUT /profile**
  - ✅ Update profile fields
  - ❌ Invalid email format
  - ❌ Email already in use
  - ❌ Invalid phone format
  - ❌ User not authenticated

## Settings Tests
- **GET /settings**
  - ✅ Get user settings
  - ❌ User not authenticated

- **PUT /settings**
  - ✅ Update user settings
  - ❌ Invalid settings values
  - ❌ User not authenticated

## Security Tests
- **POST /change-password**
  - ✅ Change password successfully
  - ❌ Wrong current password
  - ❌ Weak new password
  - ❌ User not authenticated

- **GET /sessions**
  - ✅ Get active sessions
  - ❌ User not authenticated

- **DELETE /sessions/:jti**
  - ✅ Revoke specific session
  - ❌ Invalid JTI
  - ❌ User not authenticated

- **DELETE /sessions**
  - ✅ Revoke all other sessions
  - ❌ User not authenticated

- **GET /login-history**
  - ✅ Get login history
  - ❌ User not authenticated
