// app/actions/getUserById.ts
import databaseClient from "@/app/libs/prismadb";

const prisma = databaseClient;

/**
 * ===========================================
 * USER PROFILE DATA FETCHING HELPERS
 * ===========================================
 */

/**
 * Builds the database query configuration for fetching user profile
 * Includes account data and position assignments with detailed information
 *
 * @param userId - Unique identifier of the user
 * @returns Prisma query configuration object
 *
 * @example
 * ```typescript
 * const queryConfig = buildUserQuery("user-123");
 * const user = await prisma.user.findUnique(queryConfig);
 * ```
 */
const buildUserQuery = (userId: string) => {
  return {
    where: { id: userId },
    include: {
      accounts: true,
      userPositions: {
        include: {
          position: {
            select: {
              id: true,
              name: true,
              displayNames: true,
              descriptions: true,
              color: true,
              isActive: true,
              order: true,
            },
          },
        },
        orderBy: [
          { isPrimary: "desc" as const },
          { assignedAt: "desc" as const },
        ],
      },
    },
  };
};

/**
 * Removes sensitive data from user account object
 *
 * Strips out the hashed password and separates position data
 * for further processing.
 *
 * @param userAccount - Raw user account from database
 * @returns Object containing sanitized profile and position assignments
 *
 * @example
 * ```typescript
 * const { profile, roleAssignments } = sanitizeUserData(rawUser);
 * ```
 */
const sanitizeUserData = (userAccount: any) => {
  const { hashedPassword: passwordHash, userPositions: assignedRoles, ...sanitizedProfile } = userAccount;

  return {
    sanitizedProfile,
    assignedRoles,
    hasPasswordSet: Boolean(passwordHash),
  };
};

/**
 * Enriches user profile with processed position/role data
 *
 * Transforms the raw position assignments into a more usable format
 * and provides backward compatibility with legacy 'position' field.
 *
 * @param sanitizedProfile - User profile without sensitive data
 * @param assignedRoles - Raw position assignments from database
 * @param hasPasswordSet - Whether user has a password configured
 * @returns Enriched user profile with positions array and legacy position field
 *
 * @example
 * ```typescript
 * const enrichedData = enrichWithPositions(profile, roles, true);
 * console.log(enrichedData.positions); // Array of positions
 * console.log(enrichedData.position); // Primary or first position
 * ```
 */
const enrichWithPositions = (
  sanitizedProfile: any,
  assignedRoles: any[],
  hasPasswordSet: boolean
) => {
  // Transform position assignments to simplified structure
  const processedPositions = assignedRoles.map((roleAssignment) => ({
    id: roleAssignment.position.id,
    name: roleAssignment.position.name,
    displayNames: roleAssignment.position.displayNames,
    descriptions: roleAssignment.position.descriptions,
    color: roleAssignment.position.color,
    isActive: roleAssignment.position.isActive,
    order: roleAssignment.position.order,
    isPrimary: roleAssignment.isPrimary,
    assignedAt: roleAssignment.assignedAt,
  }));

  // Find primary position or use first available
  const primaryPosition =
    assignedRoles.length > 0
      ? (assignedRoles.find((role) => role.isPrimary) || assignedRoles[0]).position
      : null;

  return {
    ...sanitizedProfile,
    positions: processedPositions,
    position: primaryPosition, // Backward compatibility
    hasPassword: hasPasswordSet,
  };
};

/**
 * Fetches a user profile by unique identifier
 *
 * This function performs a comprehensive user data retrieval:
 * 1. Queries database with user ID including accounts and positions
 * 2. Returns null if user not found
 * 3. Sanitizes sensitive data (removes hashed password)
 * 4. Enriches profile with processed position information
 * 5. Provides backward compatibility with legacy position field
 *
 * @param userId - Unique identifier of the user to fetch
 * @returns Enriched user profile object or null if:
 *   - User not found in database
 *   - Database error occurs
 *
 * The returned object includes:
 * - All user fields except hashedPassword
 * - `positions`: Array of assigned positions with metadata
 * - `position`: Primary position (or first) for backward compatibility
 * - `hasPassword`: Boolean indicating if password is set
 *
 * @example
 * ```typescript
 * const userProfile = await fetchUserProfile("user-123");
 *
 * if (!userProfile) {
 *   return { error: "User not found" };
 * }
 *
 * console.log(userProfile.name);
 * console.log(userProfile.positions); // Array of positions
 * console.log(userProfile.position);  // Primary position
 * console.log(userProfile.hasPassword); // true/false
 * ```
 */
const fetchUserProfile = async (userId: string) => {
  try {
    // Step 1: Build and execute database query
    const queryConfig = buildUserQuery(userId);
    const userAccount = await prisma.user.findUnique(queryConfig);

    // Step 2: Handle not found case
    if (!userAccount) {
      return null;
    }

    // Step 3: Sanitize sensitive data
    const { sanitizedProfile, assignedRoles, hasPasswordSet } =
      sanitizeUserData(userAccount);

    // Step 4: Enrich with processed position data
    const enrichedUserData = enrichWithPositions(
      sanitizedProfile,
      assignedRoles,
      hasPasswordSet
    );

    // Step 5: Return complete user profile
    return enrichedUserData;
  } catch (error: any) {
    console.error("[USER] Error fetching user profile by ID:", error);
    return null;
  }
};

/**
 * Backward compatibility export
 * Maintains the original function name for existing imports
 */
export default fetchUserProfile;
