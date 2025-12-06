import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import databaseClient from "@/app/libs/prismadb";
import {
  validateCredentials,
  findUserByEmail,
  verifyUserPassword,
  buildAuthUser,
  isValidUserAccount,
} from "@/app/libs/authHelpers";

const prisma = databaseClient;

/**
 * ===========================================
 * AUTHENTICATION CONFIGURATION CONSTANTS
 * ===========================================
 */

/**
 * GitHub OAuth Provider Configuration
 */
const GITHUB_OAUTH_CONFIG = {
  clientId: process.env.GITHUB_ID as string,
  clientSecret: process.env.GITHUB_SECRET as string,
};

/**
 * Google OAuth Provider Configuration
 */
const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
};

/**
 * Session Management Configuration
 * - Strategy: JWT-based sessions
 * - Max Age: 24 hours
 * - Update Age: Session refreshes every hour
 */
const SESSION_CONFIG = {
  strategy: "jwt" as const,
  maxAge: 24 * 60 * 60, // 24 hours in seconds
  updateAge: 60 * 60,   // Update session every 1 hour
};

/**
 * Authentication Page Routes
 * Defines where users are redirected for auth actions
 */
const AUTH_PAGES = {
  signIn: "/",
  signOut: "/",
  error: "/",
} as const;

/**
 * Credentials Form Configuration
 * Defines the structure of the login form fields
 */
const EMAIL_PASSWORD_CREDENTIALS = {
  email: { label: 'email', type: 'text' },
  password: { label: 'password', type: 'password' },
};

/**
 * ===========================================
 * AUTHENTICATION CALLBACK HANDLERS
 * ===========================================
 */

/**
 * JWT Callback Handler
 *
 * Extends JWT token with user ID for session management.
 * Called whenever a JWT token is created or updated.
 *
 * @param token - Current JWT token
 * @param user - User object (only present on sign in)
 * @returns Updated JWT token with user ID
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleJwtCallback = async ({ token, user }: { token: any; user?: any }) => {
  if (user?.id) {
    token.userId = user.id;
  }
  return token;
};

/**
 * Session Callback Handler
 *
 * Injects user ID from JWT token into the session object.
 * Makes user ID available in client-side session.
 *
 * @param session - Current session object
 * @param token - JWT token containing user data
 * @returns Updated session with user ID
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleSessionCallback = async ({ session, token }: { session: any; token: any }) => {
  if (token?.userId && session?.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (session.user as any).id = token.userId as string;
  }
  return session;
};

/**
 * Redirect Callback Handler
 *
 * Controls where users are redirected after authentication actions.
 * Cleans URLs with query parameters and ensures security.
 *
 * Features:
 * - Removes query parameters from URLs
 * - Prevents open redirects (only same domain)
 * - Defaults to dashboard for safe redirects
 *
 * @param url - Requested redirect URL
 * @param baseUrl - Application base URL
 * @returns Sanitized redirect URL
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleRedirectCallback = async ({ url, baseUrl }: { url: string; baseUrl: string }) => {
  // Clean URLs containing query parameters
  if (url.includes('?')) {
    return `${baseUrl}/dashboard`;
  }

  // Allow relative paths
  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  // Allow same-origin absolute URLs
  try {
    if (new URL(url).origin === baseUrl) {
      return url;
    }
  } catch {
    // Invalid URL format, default to dashboard
  }

  // Default safe redirect
  return `${baseUrl}/dashboard`;
};

/**
 * Sign In Callback Handler
 *
 * Performs additional validation before allowing sign in.
 * Prevents deleted users from accessing the application.
 *
 * @param user - User attempting to sign in
 * @returns Boolean indicating if sign in should be allowed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleSignInCallback = async ({ user }: { user: any }) => {
  if (!user?.email) {
    return false;
  }

  // Check if user is deleted
  const dbUser = await findUserByEmail(user.email);

  if (dbUser?.deletedAt) {
    console.warn(`[AUTH] Blocked sign-in attempt by deleted user: ${user.email}`);
    return false;
  }

  return true;
};

/**
 * ===========================================
 * AUTHENTICATION EVENT HANDLERS
 * ===========================================
 */

/**
 * Successful Sign In Event Handler
 *
 * Logs successful authentication attempts for monitoring.
 * Includes timestamp, user info, and authentication method.
 *
 * @param user - Authenticated user object
 * @param account - Account information (provider details)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logSuccessfulSignIn = async ({ user, account }: { user: any; account: any }) => {
  const timestamp = new Date().toISOString();
  const provider = account?.provider || 'credentials';

  console.log(`[AUTH] Successful authentication at ${timestamp}:`, {
    email: user.email,
    provider,
    userId: user.id,
  });
};

/**
 * ===========================================
 * NEXTAUTH CONFIGURATION
 * ===========================================
 */

/**
 * NextAuth Configuration
 *
 * Comprehensive authentication setup for the NexusHUB application.
 *
 * Supported Authentication Methods:
 * - OAuth Providers: GitHub, Google
 * - Credentials: Email/password with bcrypt
 *
 * Features:
 * - JWT-based session management
 * - Automatic session renewal
 * - Deleted user access prevention
 * - URL parameter sanitization
 * - Authentication event logging
 * - Secure redirect handling
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const nextAuthConfiguration: AuthOptions = {
  // Database adapter for session persistence
  adapter: PrismaAdapter(prisma),

  // Authentication providers
  providers: [
    // GitHub OAuth Provider
    GithubProvider(GITHUB_OAUTH_CONFIG),

    // Google OAuth Provider
    GoogleProvider(GOOGLE_OAUTH_CONFIG),

    // Email/Password Credentials Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: EMAIL_PASSWORD_CREDENTIALS,

      /**
       * Credentials Authorization Handler
       *
       * Validates user credentials and returns authenticated user.
       *
       * Steps:
       * 1. Validate input credentials
       * 2. Find user in database
       * 3. Verify account status (not deleted, has password)
       * 4. Verify password with bcrypt
       * 5. Return user object or null
       *
       * @param credentials - User-provided email and password
       * @returns Authenticated user object or null
       */
      async authorize(credentials) {
        // Step 1: Validate credentials exist
        if (!validateCredentials(credentials?.email, credentials?.password)) {
          return null;
        }

        // Step 2: Find user by email
        const dbUser = await findUserByEmail(credentials!.email);

        // Step 3: Validate account status
        if (!isValidUserAccount(dbUser)) {
          return null;
        }

        // Step 4: Verify password
        const isPasswordValid = await verifyUserPassword(
          credentials!.password,
          dbUser!.hashedPassword!
        );

        if (!isPasswordValid) {
          return null;
        }

        // Step 5: Return authenticated user
        return buildAuthUser(dbUser!);
      },
    }),
  ],

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Session configuration
  session: SESSION_CONFIG,

  // NextAuth secret for encryption
  secret: process.env.NEXTAUTH_SECRET,

  // Custom page routes
  pages: AUTH_PAGES,

  // Authentication callbacks
  callbacks: {
    jwt: handleJwtCallback,
    session: handleSessionCallback,
    redirect: handleRedirectCallback,
    signIn: handleSignInCallback,
  },

  // Authentication events
  events: {
    signIn: logSuccessfulSignIn,
  },
};
