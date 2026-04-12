# Frontend Authentication Setup

This guide explains the authentication system implemented for your Next.js application.

## What's Been Implemented

### 1. **Authentication Module** (`app/middleware/auth.ts`)
Provides utilities for:
- Password hashing and verification (backend use)
- Token generation and verification
- Token storage in localStorage
- User data management
- Authentication state checking

Key Functions:
- `hashPassword()` - Hash passwords (backend only)
- `verifyPassword()` - Compare passwords (backend only)
- `setAuthToken()` - Store tokens
- `getAuthToken()` - Retrieve tokens
- `isAuthenticated()` - Check if user is logged in
- `logout()` - Clear all auth data

### 2. **Validation Module** (`app/middleware/validation.ts`)
Comprehensive input validation:
- Email format validation
- Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
- Phone number validation
- Combined validation for signup and login

### 3. **API Integration** (`lib/api.ts`)
Backend-connected functions:
- `loginUser()` - Authenticate with email/password
- `signupUser()` - Create new account
- `refreshAccessToken()` - Get new access token
- `logoutUser()` - Clear server-side session
- `getTasks()` - Example of protected endpoint

### 4. **Authentication Hook** (`app/hooks/useAuth.ts`)
React hook for managing auth state in components:
```typescript
const { user, isLoading, isAuth, logout } = useAuth(redirectIfNotAuth);
```

### 5. **Updated Pages**
- **Login Page**: Now uses validation and backend API
- **Signup Page**: Enhanced with strong validation and API integration

## How to Use

### In Components

```typescript
'use client';

import { useAuth } from '@/app/hooks/useAuth';

export default function Dashboard() {
  const { user, isLoading, isAuth, logout } = useAuth(true); // redirects if not authenticated
  
  if (isLoading) return <div>Cargando...</div>;
  if (!isAuth) return null; // will redirect
  
  return (
    <div>
      <h1>Bienvenido, {user?.email}</h1>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

### Making Authenticated Requests

The API functions automatically include the auth token:

```typescript
import { getTasks } from '@/lib/api';

const tasks = await getTasks(); // Includes Authorization header
```

### Protected Routes

Create a layout that enforces authentication:

```typescript
// app/(dashboard)/layout.tsx
'use client';

import { useAuth } from '@/app/hooks/useAuth';

export default function DashboardLayout({ children }) {
  const { isLoading, isAuth } = useAuth(true); // redirects if not auth
  
  if (isLoading) return <div>Cargando...</div>;
  
  return <>{children}</>;
}
```

## Backend Integration

Your backend needs to expose these endpoints:

1. **POST `/api/auth/signup`** - Create new user
2. **POST `/api/auth/login`** - Authenticate user
3. **POST `/api/auth/refresh`** - Get new access token
4. **POST `/api/auth/logout`** - Invalidate session

See `BACKEND_AUTH_REQUIREMENTS.md` for complete implementation details.

## Security Features

✅ **Password Hashing**: Passwords hashed with bcryptjs (backend)
✅ **Strong Validation**: Email, password strength, phone validation
✅ **Input Sanitization**: Prevents XSS attacks
✅ **Token Storage**: Secure token management in localStorage
✅ **Protected Routes**: Authentication checks on navigation
✅ **Authorization Headers**: Automatic token inclusion in API calls
✅ **Session Management**: Automatic logout on token expiration

## Configuration

### Backend URL

Update the `API_BASE_URL` in `lib/api.ts` or use environment variable:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Security Considerations

### Current Setup (Development)
- Tokens stored in localStorage
- Works for development and learning
- Subject to XSS vulnerabilities

### Production Recommendations
- Use httpOnly cookies for storing tokens
- Implement server-side session validation
- Add CSRF protection
- Use HTTPS only
- Implement rate limiting on backend
- Add password reset functionality
- Enable two-factor authentication

## File Structure

```
app/
├── middleware/
│   ├── auth.ts           # Authentication utilities
│   └── validation.ts     # Input validation
├── hooks/
│   └── useAuth.ts        # Authentication hook
├── auth/
│   ├── login/page.tsx    # Login page
│   └── signup/page.tsx   # Signup page
└── (dashboard)/
    └── layout.tsx        # Protected routes

lib/
└── api.ts                # API functions

BACKEND_AUTH_REQUIREMENTS.md  # Backend implementation guide
```

## Next Steps

1. **Install dependencies**: `npm install` (already done - bcryptjs added)
2. **Set backend URL**: Update `.env.local` with your backend URL
3. **Implement backend**: Follow `BACKEND_AUTH_REQUIREMENTS.md`
4. **Protect routes**: Use `useAuth(true)` in pages requiring authentication
5. **Handle token refresh**: Backend should return 401 on expired tokens
6. **Test flows**: Sign up → Login → Access protected routes → Logout

## Testing the Flow

1. Go to `/auth/signup` and create an account
2. Verify password requirements are enforced
3. After signup, you should be redirected to `/dashboard`
4. Verify tokens are stored in localStorage: `localStorage.getItem('accessToken')`
5. Make API calls to protected endpoints
6. Test logout functionality

## Troubleshooting

### "Failed to login" - Check:
- Backend `/api/auth/login` endpoint is working
- Password is correct
- User exists in database

### Redirects to login unexpectedly:
- Token may have expired
- Backend may have invalidated the session
- Check localStorage for tokens

### API returns 401:
- Access token is invalid or expired
- Refresh token endpoint not implemented
- Backend not validating tokens properly

## Common Patterns

### Logout Button

```typescript
import { useAuth } from '@/app/hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}
```

### Protected Component

```typescript
export function ProtectedContent() {
  const { user, isLoading } = useAuth(true);
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>Only {user?.email} can see this</div>;
}
```

### Manual Auth Check

```typescript
import { isAuthenticated, getUserData } from '@/app/middleware/auth';

if (isAuthenticated()) {
  const user = getUserData();
  console.log(user?.email);
}
```

## API Response Format

The backend should return responses in this format:

```json
{
  "accessToken": "jwt_token_here",
  "refreshToken": "jwt_token_here",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "phone": "1234567890",
    "createdAt": "2026-04-11T10:00:00Z"
  }
}
```

## Questions?

Check the following files for implementation details:
- `app/middleware/auth.ts` - Core auth logic
- `app/middleware/validation.ts` - Validation rules
- `lib/api.ts` - API endpoints
- `BACKEND_AUTH_REQUIREMENTS.md` - Backend specification
