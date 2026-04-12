/**
 * Authentication utilities
 * Handles password hashing, token generation, and session management
 */

import bcryptjs from 'bcryptjs';

const HASH_ROUNDS = 10; // Number of salt rounds for bcryptjs
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  createdAt: string;
}

/**
 * Hash a password using bcryptjs
 * This should ONLY be called on the backend during signup
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcryptjs.genSalt(HASH_ROUNDS);
    const hashedPassword = await bcryptjs.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plaintext password with a hashed password
 * This should ONLY be called on the backend during login
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a simple JWT-like token (frontend utility)
 * For production, use a proper JWT library and sign on the backend
 */
export function generateToken(data: Record<string, any>, expiresIn: number = TOKEN_EXPIRY): string {
  const payload = {
    ...data,
    iat: Date.now(),
    exp: Date.now() + expiresIn,
  };

  // Base64 encode (NOT cryptographically secure - use real JWT on backend)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): Record<string, any> | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null; // Token expired
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Store auth token in browser storage
 * Be cautious: localStorage can be vulnerable to XSS
 * Consider using httpOnly cookies if possible
 */
export function setAuthToken(token: string, isRefresh: boolean = false): void {
  if (typeof window === 'undefined') return; // Server-side check

  const key = isRefresh ? 'refreshToken' : 'accessToken';
  try {
    localStorage.setItem(key, token);
  } catch (error) {
    console.error(`Failed to store ${key}`, error);
  }
}

/**
 * Retrieve auth token from browser storage
 */
export function getAuthToken(isRefresh: boolean = false): string | null {
  if (typeof window === 'undefined') return null; // Server-side check

  const key = isRefresh ? 'refreshToken' : 'accessToken';
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key}`, error);
    return null;
  }
}

/**
 * Clear auth tokens from browser storage
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return; // Server-side check

  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Failed to clear auth tokens', error);
  }
}

/**
 * Store user info in browser storage
 */
export function setUserData(user: AuthUser): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user data', error);
  }
}

/**
 * Retrieve user info from browser storage
 */
export function getUserData(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Failed to retrieve user data', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const decoded = verifyToken(token);
  return decoded !== null;
}

/**
 * Logout user - clear all auth data
 */
export function logout(): void {
  clearAuthTokens();
}
