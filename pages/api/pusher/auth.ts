import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { realtimeServer as pusherServer } from "@/app/libs/pusher";
import { nextAuthConfiguration as authOptions } from "@/app/libs/auth";

/**
 * ===========================================
 * TYPE DEFINITIONS
 * ===========================================
 */

/**
 * Pusher authentication request body structure
 * Used for type checking request body parameters
 */
interface PusherAuthRequest {
  socket_id: string;
  channel_name: string;
}

/**
 * Error response structure
 */
interface PusherAuthError {
  error: string;
  message: string;
}

/**
 * User session with required email field
 */
interface ValidUserSession {
  user: {
    email: string;
  };
}

/**
 * ===========================================
 * HELPER FUNCTIONS
 * ===========================================
 */

/**
 * Validates user session and checks for required email field
 *
 * Type guard function that ensures session contains valid user email.
 *
 * @param session - User session from NextAuth
 * @returns Boolean indicating if session is valid with type narrowing
 *
 * @example
 * ```tsx
 * if (!validateUserSession(session)) {
 *   return res.status(401).json({ error: 'Unauthorized' });
 * }
 * // TypeScript now knows session.user.email exists
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateUserSession = (session: any): session is ValidUserSession => {
  return Boolean(session?.user?.email);
};

/**
 * Extracts and validates Pusher credentials from request body
 *
 * Ensures both socket_id and channel_name are present in the request.
 *
 * @param body - Request body object
 * @returns Pusher credentials object or null if invalid
 *
 * @example
 * ```tsx
 * const credentials = extractPusherCredentials(req.body);
 * if (!credentials) {
 *   return res.status(400).json({ error: 'Missing credentials' });
 * }
 * ```
 */
const extractPusherCredentials = (
  body: Partial<PusherAuthRequest>
): { socketId: string; channelName: string } | null => {
  const socketId = body?.socket_id;
  const channelName = body?.channel_name;

  if (!socketId || !channelName) {
    return null;
  }

  return { socketId, channelName };
};

/**
 * Builds Pusher authorization payload
 *
 * Creates the data object required for Pusher presence channel authentication.
 *
 * @param userEmail - Authenticated user's email address
 * @returns Pusher auth data object with user_id
 *
 * @example
 * ```tsx
 * const authPayload = buildPusherAuthData("user@example.com");
 * // Returns: { user_id: "user@example.com" }
 * ```
 */
const buildPusherAuthData = (userEmail: string) => {
  return {
    user_id: userEmail,
  };
};

/**
 * ===========================================
 * MAIN HANDLER
 * ===========================================
 */

/**
 * Pusher Channel Authorization Endpoint
 *
 * Authenticates and authorizes users for Pusher presence channels.
 * This endpoint is called by the Pusher client library to verify
 * user identity and generate authorization tokens.
 *
 * Flow:
 * 1. Validate HTTP method (POST only)
 * 2. Validate user session
 * 3. Extract and validate request credentials
 * 4. Build authorization payload
 * 5. Generate Pusher auth token
 * 6. Return token or error response
 *
 * @param req - Next.js API request with socket_id and channel_name
 * @param res - Next.js API response
 * @returns Pusher authorization token or error response
 *
 * @example
 * ```tsx
 * // Client-side Pusher configuration
 * const pusher = new Pusher(key, {
 *   authEndpoint: '/api/pusher/auth',
 *   auth: { headers: { ... } }
 * });
 *
 * // Server receives:
 * POST /api/pusher/auth
 * Body: { socket_id: "123.456", channel_name: "presence-chat" }
 *
 * // Server responds:
 * { auth: "abc123...", channel_data: "..." }
 * ```
 *
 * @see https://pusher.com/docs/channels/server_api/authenticating-users/
 */
export default async function authenticatePusherClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Step 1: Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are accepted for Pusher authentication'
    } as PusherAuthError);
  }

  // Step 2: Validate user session
  const userSession = await getServerSession(req, res, authOptions);

  if (!validateUserSession(userSession)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication session required'
    } as PusherAuthError);
  }

  // Step 3: Extract and validate Pusher credentials
  const credentials = extractPusherCredentials(req.body);

  if (!credentials) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both socket_id and channel_name are required'
    } as PusherAuthError);
  }

  const { socketId: clientSocketId, channelName } = credentials;

  // Step 4: Build authorization payload
  const authPayload = buildPusherAuthData(userSession.user.email);

  // Step 5: Generate Pusher authorization token
  try {
    const pusherAuthToken = pusherServer.authorizeChannel(
      clientSocketId,
      channelName,
      authPayload
    );

    // Log successful authorization
    console.log('[PUSHER] Channel authorization successful:', {
      channel: channelName,
      userId: userSession.user.email,
      timestamp: new Date().toISOString(),
    });

    // Step 6: Return authorization token
    return res.status(200).json(pusherAuthToken);

  } catch (error) {
    // Log authorization failure
    console.error('[PUSHER] Channel authorization failed:', {
      channel: channelName,
      userId: userSession.user.email,
      error,
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authorize Pusher channel'
    } as PusherAuthError);
  }
}
