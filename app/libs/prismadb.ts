import { PrismaClient } from "@prisma/client";

/**
 * Global type declaration for database connection caching
 * Extends the global namespace to include our database connection instance
 */
declare global {
  var databaseConnection: PrismaClient | undefined;
}

/**
 * Environment configuration
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Database client configuration options
 * These options can be extended based on application needs
 */
const DATABASE_CONFIG = {
  // Add any PrismaClient configuration here if needed
  // log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
};

/**
 * Initializes a new Prisma database client instance
 *
 * @returns {PrismaClient} A new PrismaClient instance with configured options
 */
const initializeDatabaseClient = (): PrismaClient => {
  return new PrismaClient(DATABASE_CONFIG);
};

/**
 * Retrieves the singleton database client instance
 * In development mode, caches the client in global scope to prevent
 * multiple instances during hot reloading
 *
 * @returns {PrismaClient} The singleton database client instance
 */
const getDatabaseClient = (): PrismaClient => {
  if (isDevelopment) {
    if (!global.databaseConnection) {
      global.databaseConnection = initializeDatabaseClient();
    }
    return global.databaseConnection;
  }

  return initializeDatabaseClient();
};

/**
 * The singleton database client instance
 * Use this for all database operations throughout the application
 *
 * @example
 * import databaseClient from '@/app/libs/prismadb';
 *
 * const users = await databaseClient.user.findMany();
 */
const databaseClient = getDatabaseClient();

export default databaseClient;
