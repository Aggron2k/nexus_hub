import { getServerSession } from "next-auth";
import { nextAuthConfiguration as authOptions } from "@/app/libs/auth";
import databaseClient from "@/app/libs/prismadb";

const prisma = databaseClient;

/**
 * ===========================================
 * AUTHENTICATION SESSION HELPERS
 * ===========================================
 */

/**
 * Session structure from NextAuth
 */
interface AuthenticationSession {
  user?: {
    email?: string | null;
  };
}

/**
 * Validates if the authentication session contains required user data
 *
 * @param session - The authentication session object from NextAuth
 * @returns Boolean indicating if session has valid user email
 *
 * @example
 * ```typescript
 * const session = await getServerSession(authOptions);
 * if (validateAuthSession(session)) {
 *   // Session is valid, has user email
 * }
 * ```
 */
const validateAuthSession = (session: AuthenticationSession | null): boolean => {
  return Boolean(session?.user?.email);
};

/**
 * Fetches user account from database by email address
 *
 * @param emailAddress - User's email address
 * @returns User account object or null if not found
 *
 * @example
 * ```typescript
 * const account = await fetchUserAccount("user@example.com");
 * ```
 */
const fetchUserAccount = async (emailAddress: string) => {
  try {
    const userAccount = await prisma.user.findUnique({
      where: {
        email: emailAddress,
      },
    });

    return userAccount;
  } catch (error) {
    console.error("[AUTH] Error fetching user account:", error);
    return null;
  }
};

/**
 * Checks if a user account is active (not deleted)
 *
 * @param account - User account object to check
 * @returns Boolean indicating if account is active
 *
 * @example
 * ```typescript
 * const account = await fetchUserAccount("user@example.com");
 * if (isAccountActive(account)) {
 *   // User can access the system
 * }
 * ```
 */
const isAccountActive = (account: any): boolean => {
  return Boolean(account && !account.deletedAt);
};

/**
 * Retrieves the currently authenticated user from the session
 *
 * This function performs a multi-step authentication flow:
 * 1. Retrieves the current session from NextAuth
 * 2. Validates that the session contains user email
 * 3. Fetches the full user account from database
 * 4. Verifies the account is not deleted (soft delete check)
 * 5. Returns the authenticated user or null
 *
 * @returns The authenticated user account or null if:
 *   - No valid session exists
 *   - User not found in database
 *   - User account is deleted (deletedAt is set)
 *
 * @example
 * ```typescript
 * const authenticatedUser = await retrieveAuthenticatedUser();
 *
 * if (!authenticatedUser) {
 *   redirect('/login');
 * }
 *
 * console.log('Logged in as:', authenticatedUser.name);
 * ```
 */
const retrieveAuthenticatedUser = async () => {
  try {
    // Step 1: Get authentication session
    const authenticationSession = await getServerSession(authOptions);

    // Step 2: Validate session has user email
    if (!validateAuthSession(authenticationSession)) {
      return null;
    }

    // Step 3: Fetch user account from database
    const emailAddress = authenticationSession!.user!.email as string;
    const authenticatedAccount = await fetchUserAccount(emailAddress);

    // Step 4: Verify account is active (not deleted)
    if (!isAccountActive(authenticatedAccount)) {
      console.warn("[AUTH] Attempted login with deleted account:", emailAddress);
      return null;
    }

    // Step 5: Return authenticated user
    return authenticatedAccount;
  } catch (error: any) {
    console.error("[AUTH] Error retrieving authenticated user:", error);
    return null;
  }
};

/**
 * Backward compatibility export
 * Maintains the original function name for existing imports
 */
export default retrieveAuthenticatedUser;
