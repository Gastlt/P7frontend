# Backend Authentication Requirements

This document outlines the API endpoints and requirements your backend must implement to work with the frontend authentication system.

## Security Requirements

### Password Hashing
- **MUST** hash passwords using bcryptjs (or equivalent like Argon2) with at least 10 salt rounds
- **NEVER** store plaintext passwords
- **NEVER** send passwords back to the client

### Token Management
- Implement **JWT (JSON Web Tokens)** or a secure session-based system
- **Access Token**: Short-lived (15-30 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to generate new access tokens
- Store refresh tokens securely (httpOnly cookies preferred, or secure database)
- **NEVER** expose refresh tokens to the frontend through insecure channels

### CORS & Security Headers
- Configure CORS to allow requests from your frontend domain only
- Implement security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, etc.
- Use HTTPS in production only
- Implement rate limiting on auth endpoints (prevent brute force)

### Password Requirements (enforced by frontend, validate on backend too)
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## API Endpoints

### 1. POST `/api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phone": "1234567890"
}
```

**Validation:**
- Email must be unique (check database)
- Email must be valid format
- Password must meet strength requirements
- Phone must be valid format

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "phone": "1234567890",
    "createdAt": "2026-04-11T10:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Email already exists, invalid email format, weak password
- `500`: Server error

### 2. POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "phone": "1234567890",
    "createdAt": "2026-04-11T10:00:00Z"
  }
}
```

**Error Responses:**
- `401`: Invalid email or password
- `404`: User not found
- `500`: Server error

### 3. POST `/api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 1800
}
```

**Error Responses:**
- `401`: Invalid or expired refresh token
- `500`: Server error

### 4. POST `/api/auth/logout`

**Headers Required:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401`: Unauthorized
- `500`: Server error

## Protected Endpoints

All authenticated endpoints should require the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

### Example: POST `/api/tasks`

Your frontend sends requests like:
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
};
```

**Backend must:**
1. Verify the JWT token
2. Extract the user ID from the token
3. Return `401` if token is invalid or expired
4. Process the request if token is valid

## Implementation Checklist

- [ ] Implement bcryptjs password hashing
- [ ] Create JWT token generation/verification
- [ ] Implement signup endpoint with validation
- [ ] Implement login endpoint with password verification
- [ ] Implement refresh token endpoint
- [ ] Implement logout endpoint
- [ ] Add auth middleware/decorator to protected routes
- [ ] Configure CORS properly
- [ ] Add rate limiting to auth endpoints
- [ ] Implement email validation
- [ ] Add password strength validation on backend
- [ ] Handle edge cases (duplicate emails, expired tokens, etc.)
- [ ] Add proper error messages (don't leak user existence)
- [ ] Test all authentication flows

## Security Best Practices

### DO:
- ✅ Hash passwords with bcryptjs or Argon2
- ✅ Use HTTPS only in production
- ✅ Implement rate limiting (prevent brute force)
- ✅ Validate all inputs on backend
- ✅ Use secure, httpOnly cookies for refresh tokens
- ✅ Implement CSRF protection
- ✅ Log security events (failed logins, etc.)
- ✅ Implement account lockout after failed attempts
- ✅ Use strong JWT secret keys

### DON'T:
- ❌ Store passwords in plaintext
- ❌ Send passwords back to client
- ❌ Store JWT secrets in code
- ❌ Return detailed error messages that leak user info
- ❌ Use weak JWT algorithms
- ❌ Trust client-side validation alone
- ❌ Store sensitive data in localStorage
- ❌ Skip HTTPS in production
- ❌ Use default/weak secrets

## Frontend Token Management

The frontend will:
1. Store `accessToken` in localStorage
2. Store `refreshToken` in localStorage
3. Include `accessToken` in `Authorization: Bearer <token>` header for all API requests
4. Call `/api/auth/refresh` when a request returns 401 (token expired)
5. Clear tokens and redirect to login on logout

**Note:** While localStorage is used for simplicity, consider implementing httpOnly cookies on the backend for production environments.

## Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

**Backend:**
- `JWT_SECRET`: Secret key for signing JWTs
- `JWT_EXPIRY`: Access token expiry time (e.g., "15m")
- `REFRESH_TOKEN_EXPIRY`: Refresh token expiry time (e.g., "7d")
- `BCRYPT_ROUNDS`: Number of rounds for bcryptjs (default: 10)
