import PusherServer from "pusher";
import PusherClient from "pusher-js";

/**
 * ===========================================
 * PUSHER REALTIME CONFIGURATION
 * ===========================================
 */

/**
 * Pusher cluster region configuration
 * Set to 'eu' for European data centers
 */
const PUSHER_CLUSTER_REGION = 'eu' as const;

/**
 * Pusher authentication endpoint
 * Used by the client to authorize private/presence channel subscriptions
 */
const PUSHER_AUTH_ENDPOINT = '/api/pusher/auth';

/**
 * Validates that all required Pusher environment variables are present
 *
 * @throws {Error} If any required environment variable is missing
 *
 * @example
 * ```typescript
 * validatePusherEnvVars();
 * // Throws error if PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_APP_KEY, or PUSHER_SECRET is missing
 * ```
 */
const validatePusherEnvVars = (): void => {
  const requiredVars = {
    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    NEXT_PUBLIC_PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    PUSHER_SECRET: process.env.PUSHER_SECRET,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Pusher environment variables: ${missingVars.join(', ')}`
    );
  }
};

/**
 * Server-side Pusher configuration
 * Contains credentials and settings for server-to-Pusher communication
 */
const PUSHER_SERVER_CONFIG = {
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: PUSHER_CLUSTER_REGION,
  useTLS: true,
};

/**
 * Client-side Pusher configuration
 * Contains settings for browser-to-Pusher communication
 */
const PUSHER_CLIENT_CONFIG = {
  channelAuthorization: {
    endpoint: PUSHER_AUTH_ENDPOINT,
    transport: 'ajax' as const,
  },
  cluster: PUSHER_CLUSTER_REGION,
};

/**
 * Creates and configures the server-side Pusher instance
 *
 * This instance is used for triggering events from the server
 * and managing realtime communications.
 *
 * @returns {PusherServer} Configured Pusher server instance
 *
 * @example
 * ```typescript
 * const server = createRealtimeServer();
 * await server.trigger('my-channel', 'my-event', { message: 'Hello' });
 * ```
 */
const createRealtimeServer = (): PusherServer => {
  validatePusherEnvVars();
  return new PusherServer(PUSHER_SERVER_CONFIG);
};

/**
 * Creates and configures the client-side Pusher instance
 *
 * This instance is used in the browser for subscribing to channels
 * and listening to realtime events.
 *
 * @returns {PusherClient} Configured Pusher client instance
 *
 * @example
 * ```typescript
 * const client = createRealtimeClient();
 * const channel = client.subscribe('presence-channel');
 * channel.bind('my-event', (data) => console.log(data));
 * ```
 */
const createRealtimeClient = (): PusherClient => {
  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '';

  if (!appKey) {
    console.warn('[PUSHER] NEXT_PUBLIC_PUSHER_APP_KEY is not set');
  }

  return new PusherClient(appKey, PUSHER_CLIENT_CONFIG);
};

/**
 * Server-side Pusher instance
 * Use this for all server-side realtime operations
 *
 * @example
 * ```typescript
 * import { realtimeServer } from '@/app/libs/pusher';
 *
 * await realtimeServer.trigger('chat-channel', 'new-message', {
 *   text: 'Hello World',
 *   userId: '123'
 * });
 * ```
 */
export const realtimeServer = createRealtimeServer();

/**
 * Client-side Pusher instance
 * Use this for all browser-side realtime operations
 *
 * @example
 * ```typescript
 * import { realtimeBrowserClient } from '@/app/libs/pusher';
 *
 * const channel = realtimeBrowserClient.subscribe('presence-chat');
 * channel.bind('user-joined', (data) => {
 *   console.log('User joined:', data.name);
 * });
 * ```
 */
export const realtimeBrowserClient = createRealtimeClient();
