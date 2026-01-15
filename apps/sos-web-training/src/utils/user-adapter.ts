import { UserResponse } from '@/hooks/api/use-users';

export interface UIUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  tenantName?: string;
}
/**
 * Adapts the complex User interface to the shared-ui User type
 */
export function adaptUserForUI(user: UserResponse | null | undefined): UIUser | null {
  if (!user) return null;

  // Handle both User types - one with profile object and one with direct name field
  const firstName = user.profile?.firstName || '';
  const lastName = user.profile?.lastName || '';
  const tenantName = user.tenantName || '';
  return {
    id: user.id,
    firstName: firstName,
    lastName: lastName,
    email: user.email || '',
    role: user.role,
    avatar: undefined,
    tenantName: tenantName,
  };
}

/**
 * Validates if a string is an email address
 */
export function isEmailAddress(identifier: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier);
}

/**
 * Validates if a string is a phone number
 */
export function isPhoneNumber(identifier: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(identifier);
}

/**
 * Determines the type of identifier (email or phone)
 */
export function getIdentifierType(identifier: string): 'email' | 'phone' | 'unknown' {
  if (isEmailAddress(identifier)) return 'email';
  if (isPhoneNumber(identifier)) return 'phone';
  return 'unknown';
}

/**
 * Formats a phone number for display (masks most digits)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (phone.length > 6) {
    return `${phone.slice(0, -4).replace(/./g, '*')}${phone.slice(-4)}`;
  }
  return phone;
}

/**
 * Gets the user's full name from the complex User interface
 */
export function getUserFullName(user: UserResponse | null | undefined): string {
  if (!user) return '';

  // Handle both User types
  const firstName = user.profile?.firstName || '';
  const lastName = user.profile?.lastName || '';

  return `${firstName} ${lastName}`.trim() || user.email || 'User';
}

/**
 * Gets the user's display name (first name or email if no first name)
 */
export function getUserDisplayName(user: UserResponse | null | undefined): string {
  if (!user) return '';

  // Handle both User types
  const firstName = user.profile?.firstName || '';
  if (firstName) return firstName;

  return user.email || user.phone || 'User';
}

/**
 * Checks if user has completed their profile
 */
export function isProfileComplete(user: UserResponse | null | undefined): boolean {
  if (!user) return false;

  const profile = user.profile;
  return !!(
    profile.firstName &&
    profile.lastName &&
    profile.dateOfBirth &&
    profile.gender &&
    profile.bodyWeight &&
    profile.height
  );
}

/**
 * Gets the user's primary authentication method
 */
export function getUserAuthMethod(user: UserResponse | null | undefined): string {
  if (!user) return 'Unknown';

  switch (user.auth_providers?.EMAIL) {
    case 'EMAIL':
      return 'Email';
    case 'WHATSAPP':
      return 'WhatsApp';
    case 'LINE':
      return 'LINE';
    case 'OAUTH':
      return 'OAuth';
    default:
      return 'Unknown';
  }
}

/**
 * Checks if user can login with phone number
 */
export function canLoginWithPhone(user: UserResponse | null | undefined): boolean {
  if (!user) return false;
  return !!(
    user.phone &&
    user.phoneVerified &&
    (user.auth_providers?.WHATSAPP || user.auth_providers?.LINE)
  );
}

/**
 * Gets user's preferred language from preferences
 */
export function getUserLanguage(user: UserResponse | null | undefined): string {
  if (!user) return 'en';
  return user.preferences?.language || 'en';
}

/**
 * Gets user's timezone from preferences
 */
export function getUserTimezone(user: UserResponse | null | undefined): string {
  if (!user) return 'UTC';
  return user.preferences?.timezone || 'UTC';
}

/**
 * Checks if user has specific notification enabled
 */
export function hasNotificationEnabled(
  user: UserResponse | null | undefined,
  channel: 'email' | 'push' | 'sms' | 'inApp',
  type?: string,
): boolean {
  if (!user) return false;

  const notifications = user.preferences?.notifications;
  const channelSettings = notifications?.[channel];

  if (!channelSettings.enabled) return false;

  if (type && Object.prototype.hasOwnProperty.call(channelSettings, type)) {
    return (channelSettings as Record<string, boolean>)[type];
  }

  return true;
}
