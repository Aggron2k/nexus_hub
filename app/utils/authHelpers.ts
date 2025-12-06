/**
 * Authentication Helper Utilities
 *
 * Collection of helper functions for authentication flows,
 * including URL cleanup, navigation, and data mapping.
 */

/**
 * Cleans sensitive parameters from the current URL
 *
 * Removes email, password, and other auth-related query parameters
 * from the browser URL without triggering a page reload.
 *
 * @example
 * ```tsx
 * // URL: /?email=user@example.com&password=123
 * cleanupUrlParameters();
 * // URL: /
 * ```
 */
export const cleanupUrlParameters = (): void => {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/');
  }
};

/**
 * Navigates to the dashboard with a clean URL
 *
 * Ensures URL is cleaned before navigation and uses
 * window.location.href for a full page reload to ensure
 * proper authentication state initialization.
 *
 * @example
 * ```tsx
 * navigateToDashboard();
 * // Redirects to: /dashboard
 * ```
 */
export const navigateToDashboard = (): void => {
  cleanupUrlParameters();

  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  }, 100);
};

/**
 * Maps frontend form field names to backend API field names
 *
 * Converts the new semantic field names used in the form
 * to the original field names expected by the API endpoints.
 *
 * @param formData - Form data with new field names
 * @returns Mapped object with original API field names
 *
 * @example
 * ```tsx
 * const formData = {
 *   fullName: "John Doe",
 *   emailAddress: "john@example.com",
 *   userPassword: "secret123"
 * };
 *
 * const apiData = mapFormDataToApi(formData);
 * // Returns: { name: "John Doe", email: "john@example.com", password: "secret123" }
 * ```
 */
export const mapFormDataToApi = (formData: {
  fullName?: string;
  emailAddress?: string;
  userPassword?: string;
}): {
  name?: string;
  email?: string;
  password?: string;
} => {
  return {
    name: formData.fullName,
    email: formData.emailAddress,
    password: formData.userPassword,
  };
};

/**
 * Type definition for social authentication providers
 */
export type SocialProvider = 'github' | 'google';

/**
 * Configuration for social authentication providers
 */
export interface SocialProviderConfig {
  id: SocialProvider;
  label: string;
}

/**
 * Available social authentication providers
 */
export const SOCIAL_PROVIDERS: SocialProviderConfig[] = [
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' },
];
