/**
 * Validation utilities for authentication and user input
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('El email es requerido');
    return { isValid: false, errors };
  }

  // Trim and convert to lowercase
  email = email.trim().toLowerCase();

  // Basic email regex - RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('El formato del email no es válido');
  }

  // Check max length
  if (email.length > 254) {
    errors.push('El email es demasiado largo');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('La contraseña es requerida');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  // Check max length to prevent DoS
  if (password.length > 128) {
    errors.push('La contraseña es demasiado larga');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number (basic validation)
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || typeof phone !== 'string') {
    errors.push('El teléfono es requerido');
    return { isValid: false, errors };
  }

  phone = phone.trim();

  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-().+]/g, '');

  if (!/^\d{7,15}$/.test(cleanPhone)) {
    errors.push('El teléfono debe contener entre 7 y 15 dígitos');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 500); // Limit length
}

/**
 * Validate signup data
 */
export function validateSignupData(data: {
  email: string;
  password: string;
  repeatPassword: string;
  phone: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data.email);
  errors.push(...emailValidation.errors);

  // Validate password
  const passwordValidation = validatePassword(data.password);
  errors.push(...passwordValidation.errors);

  // Check password match
  if (data.password !== data.repeatPassword) {
    errors.push('Las contraseñas no coinciden');
  }

  // Validate phone
  const phoneValidation = validatePhone(data.phone);
  errors.push(...phoneValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate login data
 */
export function validateLoginData(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  errors.push(...emailValidation.errors);

  if (!data.password || typeof data.password !== 'string') {
    errors.push('La contraseña es requerida');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
