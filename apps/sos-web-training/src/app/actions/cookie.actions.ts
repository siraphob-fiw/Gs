'use server';

import { cookies, headers } from 'next/headers';

/**
 * Detects if the request is served over HTTPS
 * Handles reverse proxy scenarios (nginx, CloudFlare, AWS ALB, etc.)
 */
async function isSecureConnection(): Promise<boolean> {
  const headersList = await headers();
  
  // Check x-forwarded-proto (standard header set by reverse proxies)
  const forwardedProto = headersList.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto === 'https';
  }
  
  // Check CloudFlare-specific header
  const cfVisitor = headersList.get('cf-visitor');
  if (cfVisitor) {
    try {
      const parsed = JSON.parse(cfVisitor);
      return parsed.scheme === 'https';
    } catch {
      // Ignore parse errors
    }
  }
  
  // Fallback: check if explicitly configured via environment variable
  // Set FORCE_SECURE_COOKIES=true if your production uses HTTPS but headers aren't forwarded
  if (process.env.FORCE_SECURE_COOKIES === 'true') {
    return true;
  }
  
  return false;
}

export const setCookie = async (name: string, value: string) => {
  const expires = new Date(Date.now() + 365 * 86400000); // EXPIRY: 365 DAYS
  const cookieStore = await cookies();
  const isSecure = await isSecureConnection();

  cookieStore.set(name, value, {
    path: '/',
    expires,
    httpOnly: false,
    sameSite: 'lax',
    secure: isSecure,
  });
};

export const getCookie = async (name: string): Promise<string | null> => {
  const cookieStore = await cookies();
  const value = cookieStore.get(name)?.value;
  return value ?? null;
};

export const savePreferences = async (preferences: { analytics: boolean; marketing: boolean }) => {
  await setCookie('cookieConsent', JSON.stringify({ basic: true, ...preferences }));
};

export const loadPreferences = async () => {
  const storedPreferences = await getCookie('cookieConsent');
  return storedPreferences ? JSON.parse(storedPreferences) : null;
};

export async function updateCookiePreference(data: FormData) {
  const analytics = data.get('analytics') === 'true';
  const marketing = data.get('marketing') === 'true';

  await savePreferences({ analytics, marketing });
}
