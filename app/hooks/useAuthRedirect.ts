import { useEffect, useRef } from "react";

/**
 * Custom Hook: useAuthRedirect
 *
 * Handles automatic redirection when user authentication state changes.
 * Prevents duplicate notifications and ensures smooth transition to authenticated routes.
 *
 * @param isAuthenticated - Boolean indicating if user is currently authenticated
 * @param onRedirectCallback - Callback function to execute when redirect should occur
 *
 * @example
 * ```tsx
 * useAuthRedirect(
 *   session?.status === 'authenticated',
 *   () => {
 *     toast.success('Welcome back!');
 *     router.push('/dashboard');
 *   }
 * );
 * ```
 */
export const useAuthRedirect = (
  isAuthenticated: boolean,
  onRedirectCallback: () => void
) => {
  // Track if redirect has already been triggered
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only trigger redirect once when authentication status becomes true
    if (isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;

      // Small delay for smooth transition
      const redirectTimer = setTimeout(() => {
        onRedirectCallback();
      }, 1500);

      // Cleanup timer on unmount
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, onRedirectCallback]);
};
