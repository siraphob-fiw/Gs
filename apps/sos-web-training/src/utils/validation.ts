/**
 * Client-side validation utilities for user data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic phone number validation - should be at least 10 digits
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  return hasSpecialChar && hasNumber && hasLetter;
}

/**
 * Gets password strength requirements message
 */
export function getPasswordRequirements(): string {
  return 'Password must be at least 8 characters with letters, numbers, and special characters';
}

/**
 * Validates user registration data
 */
export function validateRegistrationData(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  authMethod: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  // Email validation for email auth
  if (data.authMethod === 'EMAIL') {
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(data.password)) {
      errors.password = getPasswordRequirements();
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  // Phone validation for phone-based auth
  if (data.authMethod === 'WHATSAPP' || data.authMethod === 'LINE') {
    if (!data.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(data.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates user login data
 */
export function validateLoginData(data: {
  identifier: string;
  password?: string;
  authMethod: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.identifier.trim()) {
    errors.identifier = 'This field is required';
  } else {
    // Validate based on auth method
    if (data.authMethod === 'EMAIL' && !validateEmail(data.identifier)) {
      errors.identifier = 'Please enter a valid email address';
    } else if (
      (data.authMethod === 'WHATSAPP' || data.authMethod === 'LINE') &&
      !validatePhoneNumber(data.identifier)
    ) {
      errors.identifier = 'Please enter a valid phone number';
    }
  }

  if (data.authMethod === 'EMAIL' && !data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates user profile data
 */
export function validateUserProfile(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  bodyWeight?: number;
  height?: number;
  newPassword?: string;
  confirmPassword?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Optional phone number validation
  if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid phone number';
  }

  // Date of birth validation
  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 13 || age > 120) {
      errors.dateOfBirth = 'Please enter a valid date of birth';
    }
  }

  // Body weight validation
  if (data.bodyWeight !== undefined && (data.bodyWeight < 20 || data.bodyWeight > 500)) {
    errors.bodyWeight = 'Please enter a valid body weight (20-500 kg)';
  }

  // Height validation
  if (data.height !== undefined && (data.height < 100 || data.height > 250)) {
    errors.height = 'Please enter a valid height (100-250 cm)';
  }

  // Password validation (if changing password)
  if (data.newPassword) {
    if (!validatePassword(data.newPassword)) {
      errors.newPassword = getPasswordRequirements();
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates verification code format
 */
export function validateVerificationCode(code: string): boolean {
  // Verification codes are typically 6 digits
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code.trim());
}

/**
 * Checks if two email addresses are the same (case-insensitive)
 */
export function isSameEmail(email1: string, email2: string): boolean {
  return email1.toLowerCase().trim() === email2.toLowerCase().trim();
}

/**
 * Normalizes phone number for comparison
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Checks if two phone numbers are the same
 */
export function isSamePhoneNumber(phone1: string, phone2: string): boolean {
  return normalizePhoneNumber(phone1) === normalizePhoneNumber(phone2);
}

/**
 * Validates that email and phone are unique (not already in use)
 */
export function validateUniqueness(
  email: string,
  phoneNumber: string | undefined,
  existingUsers: Array<{ email: string; phoneNumber?: string }>,
): ValidationResult {
  const errors: Record<string, string> = {};

  // Check email uniqueness
  const emailExists = existingUsers.some((user) => isSameEmail(user.email, email));
  if (emailExists) {
    errors.email = 'This email address is already in use';
  }

  // Check phone number uniqueness
  if (phoneNumber) {
    const phoneExists = existingUsers.some(
      (user) => user.phoneNumber && isSamePhoneNumber(user.phoneNumber, phoneNumber),
    );
    if (phoneExists) {
      errors.phoneNumber = 'This phone number is already in use';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validates and sanitizes form data
 */
export function sanitizeFormData<T extends Record<string, string>>(data: T): T {
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, string>)[key] = sanitizeInput(
        (sanitized as Record<string, string>)[key],
      );
    }
  }

  return sanitized;
}
