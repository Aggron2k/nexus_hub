import bcrypt from "bcrypt";
import databaseClient from "@/app/libs/prismadb";

const prisma = databaseClient;

/**
 * Authentication Helper Functions
 *
 * Collection of utility functions for NextAuth authentication flows.
 * Provides validation, user lookup, password verification, and user object building.
 */

/**
 * User data structure returned from database
 */
interface DatabaseUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  hashedPassword: string | null;
  deletedAt: Date | null;
}

/**
 * Authenticated user object structure
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Validates credential inputs
 *
 * Checks if both email and password are provided and non-empty.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Boolean indicating if credentials are valid
 *
 * @example
 * ```tsx
 * const isValid = validateCredentials("user@example.com", "password123");
 * // Returns: true
 * ```
 */
export const validateCredentials = (
  email?: string,
  password?: string
): boolean => {
  return Boolean(email && password && email.trim() !== '' && password.trim() !== '');
};

/**
 * Finds a user by email address in the database
 *
 * Retrieves user data including authentication fields and deletion status.
 * Selects only necessary fields for performance.
 *
 * @param email - User's email address to search for
 * @returns User object if found, null otherwise
 *
 * @example
 * ```tsx
 * const user = await findUserByEmail("john@example.com");
 * if (user) {
 *   console.log("User found:", user.name);
 * }
 * ```
 */
export const findUserByEmail = async (
  email: string
): Promise<DatabaseUser | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        hashedPassword: true,
        deletedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("[AUTH] Error finding user by email:", error);
    return null;
  }
};

/**
 * Verifies user password against stored hash
 *
 * Uses bcrypt to securely compare plaintext password with hashed version.
 *
 * @param plainPassword - User's plaintext password input
 * @param hashedPassword - Stored hashed password from database
 * @returns Boolean indicating if password matches
 *
 * @example
 * ```tsx
 * const isValid = await verifyUserPassword("mypassword", "$2b$10$...");
 * if (isValid) {
 *   console.log("Password correct!");
 * }
 * ```
 */
export const verifyUserPassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("[AUTH] Error verifying password:", error);
    return false;
  }
};

/**
 * Builds authenticated user object for session
 *
 * Extracts and formats necessary user data for NextAuth session.
 * Removes sensitive fields like hashedPassword.
 *
 * @param user - Database user object
 * @returns Formatted user object for authentication
 *
 * @example
 * ```tsx
 * const dbUser = await findUserByEmail("user@example.com");
 * const authUser = buildAuthUser(dbUser);
 * // Returns: { id: "123", email: "user@example.com", name: "John", image: null }
 * ```
 */
export const buildAuthUser = (user: DatabaseUser): AuthenticatedUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
};

/**
 * Checks if a user account is marked as deleted
 *
 * @param user - Database user object
 * @returns Boolean indicating if user is deleted
 *
 * @example
 * ```tsx
 * if (isUserDeleted(dbUser)) {
 *   return null; // Deny access
 * }
 * ```
 */
export const isUserDeleted = (user: DatabaseUser | null): boolean => {
  return Boolean(user?.deletedAt);
};

/**
 * Validates user account status
 *
 * Checks if user exists, has a password, and is not deleted.
 *
 * @param user - Database user object or null
 * @returns Boolean indicating if user account is valid
 *
 * @example
 * ```tsx
 * const user = await findUserByEmail(email);
 * if (!isValidUserAccount(user)) {
 *   return null; // Invalid account
 * }
 * ```
 */
export const isValidUserAccount = (user: DatabaseUser | null): boolean => {
  if (!user || !user.hashedPassword) {
    return false;
  }

  if (isUserDeleted(user)) {
    return false;
  }

  return true;
};
