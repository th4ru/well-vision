# Authentication API Test Cases Report

**Base URL:** `http://localhost:4000/api/auth`

## Registration Tests
- **POST /register**
  - ✅ Valid registration with all required fields
  - ❌ Missing required fields (name, email, password)
  - ❌ Invalid email format
  - ❌ Email already exists
  - ❌ Weak password (if validation exists)
  - ❌ Invalid phone format (if provided)

## Login Tests
- **POST /login**
  - ✅ Valid login credentials
  - ❌ Invalid email/password
  - ❌ Missing email or password
  - ❌ Account not verified (if email verification required)
  - ❌ Too many failed attempts (if rate limiting exists)

## Logout Tests
- **POST /logout**
  - ✅ Successful logout (clears session/token)

## Email Verification Tests
- **POST /send-verify-otp**
  - ✅ Send OTP to authenticated user
  - ❌ User not authenticated
  - ❌ Email notifications disabled in settings

- **POST /verify-account**
  - ✅ Valid OTP verification
  - ❌ Invalid OTP
  - ❌ OTP expired
  - ❌ User not authenticated

## Password Reset Tests
- **POST /send-reset-otp**
  - ✅ Send reset OTP to valid email
  - ❌ Invalid email format
  - ❌ Email not found

- **POST /reset-password**
  - ✅ Valid reset with email, OTP, new password
  - ❌ Invalid OTP
  - ❌ OTP expired
  - ❌ Weak new password
  - ❌ Email not found

## Session Tests
- **POST /is-auth**
  - ✅ Valid active session
  - ❌ Invalid/expired token
  - ❌ No token provided
